import type { Geometry } from 'geojson';
import type { EvaluatedLayer } from './style';

export interface Point {
	x: number;
	y: number;
}

/** Projects a `[lng, lat]` position to CSS pixels of the map container */
export type Project = (lngLat: [number, number]) => Point;

export interface TileId {
	z: number;
	x: number;
	y: number;
}

/** How a layer is written to the SVG */
export type LayerKind = 'vector' | 'raster' | 'symbol' | 'skip';

/**
 * A rendered feature of a layer. Its `layer.paint` and `layer.layout` hold the values which
 * were evaluated for the feature at the current zoom.
 */
export interface QueriedFeature {
	id?: string | number;
	geometry: Geometry;
	properties: Record<string, unknown> | null;
	layer?: EvaluatedLayer;
	/** tile the feature was read from, when it is known */
	tile?: TileId;
}

/** An image of the style */
export interface StyleImageLike {
	data: { width: number; height: number; data: Uint8Array | Uint8ClampedArray };
	pixelRatio?: number;
	sdf?: boolean;
}

/** How symbol layers (labels and icons) are written to the SVG */
export type LabelMode = 'raster' | 'vector';

export interface Maplibre2SvgOptions {
	/**
	 * Physical width of the SVG document, in `unit`. The size of the map canvas in CSS
	 * pixels is used when it is omitted.
	 */
	width?: number;
	/** Physical height of the SVG document, in `unit` */
	height?: number;
	/** Unit of `width` and `height`. default is 'mm' */
	unit?: 'mm' | 'in' | 'px';
	/**
	 * How symbol layers are written.
	 * - `raster` (default): all symbol layers are rendered by the map and laid over the vector
	 *   layers as one transparent image, so labels look exactly as they do on the map.
	 * - `vector`: labels become editable `<text>` elements. Their position is approximated,
	 *   because the map does not expose where it placed them.
	 */
	labels?: LabelMode;
	/** How long to wait for the map to become idle while rendering raster layers. default is 5000 ms */
	idleTimeout?: number;
	/** Encodes RGBA pixels as an image URL. A canvas is used by default. */
	encodeImage?: (data: Uint8ClampedArray, width: number, height: number) => string;
}

/** Thrown when the state of the map cannot be converted to a vector SVG */
export class UnsupportedMapError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnsupportedMapError';
	}
}
