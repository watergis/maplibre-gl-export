import type { ImageRegistry } from '../pattern';
import { el, fmt, hoistCommonAttrs, type Attrs, type IdAllocator } from '../svg';
import { tileKey, tileOutline } from '../tile-clip';
import type { StyleLayer } from '../style';
import type { Point, Project, QueriedFeature, TileId } from '../types';

/** Distance in pixels the clipping outline of a tile is grown by, to hide the seams */
const TILE_CLIP_EXPAND = 0.5;

export interface RenderContext {
	doc: Document;
	defs: Element;
	project: Project;
	/** bearing of the map in degrees */
	bearing: number;
	/** size of the map in CSS pixels */
	width: number;
	height: number;
	images: ImageRegistry;
	/** allocates the ids of the elements, unique within the document */
	id: IdAllocator;
	/** ids of the clip paths which were already defined, by tile */
	clipIds: Map<string, string>;
}

/** Create the group a layer is drawn in */
export function layerGroup(ctx: RenderContext, layer: StyleLayer) {
	return el(ctx.doc, 'g', {
		id: ctx.id(layer.id),
		'data-layer': layer.id,
		'data-type': layer.type
	});
}

export interface TileFeatures {
	tile: TileId | undefined;
	features: QueriedFeature[];
}

/** Group features by the tile they were read from, in the order the tiles first appear */
export function groupByTile(features: QueriedFeature[]): TileFeatures[] {
	const groups = new Map<string, TileFeatures>();
	for (const feature of features) {
		const { tile } = feature;
		const key = tileKey(tile);
		let group = groups.get(key);
		if (!group) {
			group = { tile, features: [] };
			groups.set(key, group);
		}
		group.features.push(feature);
	}
	return [...groups.values()];
}

/**
 * Create the group the features of one tile are drawn in. It is clipped to the tile just
 * like the map does, because the tiles overlap each other by their buffers.
 */
export function tileGroup(ctx: RenderContext, tile: TileId | undefined) {
	if (!tile) return el(ctx.doc, 'g');
	const key = tileKey(tile);
	let id = ctx.clipIds.get(key);
	if (!id) {
		id = ctx.id(`tile-${tile.z}-${tile.x}-${tile.y}`);
		const points = tileOutline(tile, ctx.project, TILE_CLIP_EXPAND)
			.map((point) => `${fmt(point.x)},${fmt(point.y)}`)
			.join(' ');
		ctx.defs.appendChild(el(ctx.doc, 'clipPath', { id }, [el(ctx.doc, 'polygon', { points })]));
		ctx.clipIds.set(key, id);
	}
	return el(ctx.doc, 'g', { 'clip-path': `url(#${id})` });
}

/**
 * Projection which also applies a `*-translate` property.
 * @param anchor `map` when the translation follows the rotation of the map
 */
export function translatedProject(
	ctx: RenderContext,
	translate: [number, number],
	anchor: string
): Project {
	let [dx, dy] = translate;
	if (dx === 0 && dy === 0) return ctx.project;
	if (anchor !== 'viewport') {
		const angle = (-ctx.bearing * Math.PI) / 180;
		[dx, dy] = [
			dx * Math.cos(angle) - dy * Math.sin(angle),
			dx * Math.sin(angle) + dy * Math.cos(angle)
		];
	}
	return (lngLat): Point => {
		const point = ctx.project(lngLat);
		return { x: point.x + dx, y: point.y + dy };
	};
}

/**
 * Draw a layer whose features are `<path>` elements clipped to their tile.
 * @param attrsOf attributes of the path of a feature, or undefined when it is invisible
 */
export function renderPathLayer(
	layer: StyleLayer,
	features: QueriedFeature[],
	ctx: RenderContext,
	attrsOf: (feature: QueriedFeature, ctx: RenderContext) => Attrs | undefined
) {
	const group = layerGroup(ctx, layer);
	const pending: { parent: Element; attrs: Attrs }[] = [];

	for (const { tile, features: tileFeatures } of groupByTile(features)) {
		const paths = tileFeatures
			.map((feature) => attrsOf(feature, ctx))
			.filter((attrs) => attrs !== undefined);
		if (paths.length === 0) continue;
		const parent = tileGroup(ctx, tile);
		group.appendChild(parent);
		for (const attrs of paths) pending.push({ parent, attrs });
	}
	if (pending.length === 0) return undefined;

	hoistCommonAttrs(
		group,
		pending.map(({ attrs }) => attrs),
		['d']
	);
	for (const { parent, attrs } of pending) parent.appendChild(el(ctx.doc, 'path', attrs));
	return group;
}
