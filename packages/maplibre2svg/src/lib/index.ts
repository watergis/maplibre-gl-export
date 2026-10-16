import { buildSegments, classifyLayer } from './classify';
import { renderBackground } from './layers/background';
import { renderCircle } from './layers/circle';
import type { RenderContext } from './layers/common';
import { renderFill } from './layers/fill';
import { renderLine } from './layers/line';
import { renderSymbol } from './layers/symbol';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { assertSupported, getMapSize, queryLayerFeatures } from './map';
import { ImageRegistry } from './pattern';
import { captureRasterGroups } from './raster-pass';
import { createIdAllocator, el, SVG_NS, XLINK_NS } from './svg';
import type { StyleLayer } from './style';
import type { Maplibre2SvgOptions, StyleImageLike } from './types';

export { buildSegments, classifyLayer, type Segment } from './classify';
export { svgToString } from './svg';
export * from './style';
export * from './types';

/** Draw a vector layer, or return undefined when nothing of it is visible */
function renderLayer(layer: StyleLayer, map: MaplibreMap, ctx: RenderContext) {
	if (layer.type === 'background') return renderBackground(layer, ctx);
	const features = queryLayerFeatures(map, layer.id);
	if (features.length === 0) return undefined;
	switch (layer.type) {
		case 'fill':
			return renderFill(layer, features, ctx);
		case 'line':
			return renderLine(layer, features, ctx);
		case 'circle':
			return renderCircle(layer, features, ctx);
		case 'symbol':
			return renderSymbol(layer, features, ctx);
		default:
			return undefined;
	}
}

/**
 * Convert a rendered map into an SVG whose fill, line and circle layers are real vectors.
 *
 * The features are read from the map as it is rendered at the moment, so the map has to be
 * idle. Layers which have no vector counterpart (raster, hillshade, heatmap, fill-extrusion,
 * ...) are rendered by the map and embedded as images at their place in the layer order.
 *
 * @param map the MapLibre GL JS map to convert
 * @throws UnsupportedMapError when the state of the map cannot be converted
 */
export async function maplibre2svg(
	map: MaplibreMap,
	options: Maplibre2SvgOptions = {}
): Promise<SVGSVGElement> {
	assertSupported(map);

	const doc = document;
	const { width, height } = getMapSize(map);
	const unit = options.unit ?? 'mm';
	const suffix = unit === 'px' ? '' : unit;

	const svg = doc.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
	svg.setAttribute('xmlns', SVG_NS);
	svg.setAttribute('xmlns:xlink', XLINK_NS);
	svg.setAttribute('version', '1.1');
	svg.setAttribute('width', `${options.width ?? width}${options.width ? suffix : ''}`);
	svg.setAttribute('height', `${options.height ?? height}${options.height ? suffix : ''}`);
	svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
	const defs = el(doc, 'defs');
	svg.appendChild(defs);

	// a map without `getImage` cannot have its patterns and icons drawn, so they are rasterized
	const getImage =
		typeof map.getImage === 'function'
			? (name: string) => map.getImage(name) as StyleImageLike | undefined
			: undefined;
	const id = createIdAllocator();
	const ctx: RenderContext = {
		doc,
		defs,
		project: (lngLat) => {
			const { x, y } = map.project(lngLat);
			return { x, y };
		},
		bearing: map.getBearing(),
		width,
		height,
		images: new ImageRegistry(doc, defs, getImage, id, options.encodeImage),
		id,
		clipIds: new Map()
	};

	const layers = map.getStyle()?.layers ?? [];
	const classifyOptions = {
		zoom: map.getZoom(),
		pitch: map.getPitch(),
		labels: options.labels ?? 'raster',
		hasImages: getImage !== undefined
	};
	const segments = buildSegments(layers, classifyOptions);

	// all features are read before any layer is hidden to render the raster segments
	const placeholders: SVGElement[] = [];
	for (const segment of segments) {
		if (segment.kind === 'raster') {
			const image = el(doc, 'image', { width, height, 'data-layers': segment.layerIds.join(' ') });
			placeholders.push(image);
			svg.appendChild(image);
			continue;
		}
		for (const layer of segment.layers) {
			const group = renderLayer(layer, map, ctx);
			if (group) svg.appendChild(group);
		}
	}

	const groups = segments.flatMap((segment) =>
		segment.kind === 'raster' ? [segment.layerIds] : []
	);
	const visible = layers
		.filter((layer) => classifyLayer(layer, classifyOptions) !== 'skip')
		.map((layer) => layer.id);
	const images = await captureRasterGroups(map, groups, visible, options.idleTimeout ?? 5000);
	placeholders.forEach((image, index) => {
		image.setAttributeNS(XLINK_NS, 'xlink:href', images[index]);
		image.setAttribute('href', images[index]);
	});

	return svg;
}
