import type { LayerType, PaintName, StyleLayer } from './style';
import type { LabelMode, LayerKind } from './types';

/** Layer types which are drawn as vectors */
const VECTOR_TYPES: LayerType[] = ['background', 'fill', 'line', 'circle'];

/** Properties which have no vector counterpart: a layer using one of them is rasterized */
const RASTER_ONLY_PROPERTIES: PaintName<'line'>[] = ['line-gradient', 'line-pattern'];

/** Properties which are only supported as long as they are 0 */
const BLUR_PROPERTIES: PaintName<'line' | 'circle'>[] = ['line-blur', 'circle-blur'];

/** Properties which need the images of the style */
const PATTERN_PROPERTIES: PaintName<'fill' | 'background'>[] = [
	'fill-pattern',
	'background-pattern'
];

export interface ClassifyOptions {
	zoom: number;
	/** pitch of the map in degrees */
	pitch: number;
	labels: LabelMode;
	/** whether the images of the style can be read, which patterns and icons need */
	hasImages: boolean;
}

export type Segment =
	{ kind: 'vector'; layers: StyleLayer[] } | { kind: 'raster'; layerIds: string[] };

const isSet = (value: unknown) => value !== undefined && value !== null;

/** Decide how a layer is written to the SVG */
export function classifyLayer(layer: StyleLayer, options: ClassifyOptions): LayerKind {
	const layout = ('layout' in layer ? layer.layout : undefined) as
		Record<string, unknown> | undefined;
	const paint = (('paint' in layer ? layer.paint : undefined) ?? {}) as Record<string, unknown>;

	if (layout?.visibility === 'none') return 'skip';
	if (layer.minzoom !== undefined && options.zoom < layer.minzoom) return 'skip';
	if (layer.maxzoom !== undefined && options.zoom >= layer.maxzoom) return 'skip';

	if (layer.type === 'symbol') {
		if (options.labels !== 'vector') return 'symbol';
		if (!isSet(layout?.['icon-image'])) return 'vector';
		// icons cannot be drawn without the images of the style, nor placed along a line yet
		const placement = layout?.['symbol-placement'];
		return !options.hasImages || (isSet(placement) && placement !== 'point') ? 'symbol' : 'vector';
	}
	if (!VECTOR_TYPES.includes(layer.type)) return 'raster';

	// circles are drawn at a constant size, while a pitched map scales them with the
	// perspective or lays them flat onto the map
	if (
		layer.type === 'circle' &&
		options.pitch > 0 &&
		(paint['circle-pitch-scale'] !== 'viewport' || paint['circle-pitch-alignment'] === 'map')
	)
		return 'raster';

	// a background has no features its properties could be evaluated for
	if (layer.type === 'background' && Object.values(paint).some((value) => Array.isArray(value)))
		return 'raster';
	if (RASTER_ONLY_PROPERTIES.some((name) => isSet(paint[name]))) return 'raster';
	if (BLUR_PROPERTIES.some((name) => isSet(paint[name]) && paint[name] !== 0)) return 'raster';
	if (!options.hasImages && PATTERN_PROPERTIES.some((name) => isSet(paint[name]))) return 'raster';
	return 'vector';
}

/**
 * Split the layers of a style into runs of vector and raster layers, keeping their order.
 *
 * Symbol layers which are rasterized are gathered in one segment on top of everything else:
 * labels of different layers collide with each other, so rendering them separately would
 * place them differently than the map does.
 */
export function buildSegments(layers: StyleLayer[], options: ClassifyOptions): Segment[] {
	const segments: Segment[] = [];
	const symbols: string[] = [];

	for (const layer of layers) {
		const kind = classifyLayer(layer, options);
		if (kind === 'skip') continue;
		if (kind === 'symbol') {
			symbols.push(layer.id);
			continue;
		}
		const last = segments[segments.length - 1];
		if (kind === 'vector') {
			if (last?.kind === 'vector') last.layers.push(layer);
			else segments.push({ kind: 'vector', layers: [layer] });
		} else if (last?.kind === 'raster') last.layerIds.push(layer.id);
		else segments.push({ kind: 'raster', layerIds: [layer.id] });
	}

	if (symbols.length > 0) segments.push({ kind: 'raster', layerIds: symbols });
	return segments;
}
