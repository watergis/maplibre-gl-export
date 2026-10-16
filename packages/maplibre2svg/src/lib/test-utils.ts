import type { Map as MaplibreMap } from 'maplibre-gl';
import type { RenderContext } from './layers/common';
import { ImageRegistry } from './pattern';
import { createIdAllocator, el } from './svg';
import type { EvaluatedLayer, StyleLayer } from './style';
import type { QueriedFeature, StyleImageLike } from './types';

/** Projection which maps 1 degree to 10 pixels, with the origin at [0, 0] */
export const project = ([lng, lat]: [number, number]) => ({ x: lng * 10, y: -lat * 10 });

export function createContext(images: Record<string, StyleImageLike> = {}): RenderContext {
	const defs = el(document, 'defs');
	const id = createIdAllocator();
	return {
		doc: document,
		defs,
		project,
		bearing: 0,
		width: 200,
		height: 100,
		images: new ImageRegistry(
			document,
			defs,
			(name) => images[name],
			id,
			(_data, width, height) => `data:test/${width}x${height}`
		),
		id,
		clipIds: new Map()
	};
}

export interface MockMap {
	/** the mock, typed as the map it stands in for */
	map: MaplibreMap;
	/** every change of the visibility of a layer, in order */
	visibility: [string, boolean][];
	/** ids of the layers which were visible each time the canvas was read */
	captures: string[][];
}

/**
 * A stand-in for the MapLibre map, with the methods the conversion uses.
 * @param features rendered features of each layer, topmost first as the map returns them
 * @param overrides methods to replace
 */
export function createMap(
	layers: StyleLayer[],
	features: Record<string, QueriedFeature[]> = {},
	overrides: object = {}
): MockMap {
	const hidden = new Set<string>();
	const visibility: [string, boolean][] = [];
	const captures: string[][] = [];

	const canvas = document.createElement('canvas');
	canvas.style.width = '200px';
	canvas.style.height = '100px';
	canvas.toDataURL = () => {
		captures.push(layers.map((layer) => layer.id).filter((id) => !hidden.has(id)));
		return `data:capture/${captures.length}`;
	};

	const map = {
		getStyle: () => ({ layers }),
		getZoom: () => 10,
		getPitch: () => 0,
		getBearing: () => 0,
		getCanvas: () => canvas,
		project,
		queryRenderedFeatures: (options: { layers: string[] }) => [
			...(features[options.layers[0]] ?? [])
		],
		setLayoutProperty: (layerId: string, _name: string, value: string) => {
			const visible = value !== 'none';
			visibility.push([layerId, visible]);
			if (visible) hidden.delete(layerId);
			else hidden.add(layerId);
		},
		once: (_type: string, listener: () => void) => listener(),
		getTerrain: () => null,
		getProjection: () => undefined,
		getImage: () => undefined,
		...overrides
	};
	return { map: map as unknown as MaplibreMap, visibility, captures };
}

/** A feature with evaluated properties, as the map returns it */
export function feature(
	geometry: QueriedFeature['geometry'],
	layer: Partial<EvaluatedLayer> = {},
	extra: Partial<QueriedFeature> = {}
): QueriedFeature {
	return {
		geometry,
		properties: {},
		layer: { id: 'layer', type: 'fill', ...layer },
		...extra
	};
}

/** A layer of a style. Tests leave out what the conversion does not read, such as the source. */
export function styleLayer(id: string, type: string, extra: object = {}) {
	return { id, type, ...extra } as StyleLayer;
}
