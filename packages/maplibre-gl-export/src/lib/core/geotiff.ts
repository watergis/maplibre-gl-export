import type { GeoCorners, LngLatTuple } from './geopdf';

/** Radius of the sphere of WGS 84 / Pseudo-Mercator (EPSG:3857), in metres */
const EARTH_RADIUS = 6378137;

/**
 * Project longitude and latitude into WGS 84 / Pseudo-Mercator (EPSG:3857).
 * @returns easting and northing in metres
 */
export function lngLatToMercator([lng, lat]: LngLatTuple): [number, number] {
	const x = (EARTH_RADIUS * lng * Math.PI) / 180;
	const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
	return [x, y];
}

/** Image which is written into the GeoTIFF, read a few rows at a time to save memory */
export interface RgbaRaster {
	width: number;
	height: number;
	/** RGBA pixels of `rows` rows starting at row `y`, as `ImageData.data` holds them */
	read: (y: number, rows: number) => Uint8ClampedArray | Uint8Array;
}

export interface GeoTiffOptions {
	/**
	 * geographic coordinates of the corners of the image, which georeference it.
	 * A plain TIFF is created when they are not given.
	 */
	corners?: GeoCorners;
	/** resolution of the image in dots per inch */
	dpi?: number;
	/** written as `ImageDescription` */
	description?: string;
	/** written as `Software` */
	software?: string;
	/** written as `Artist`, which holds the attribution of the map */
	artist?: string;
}

/** Size of the uncompressed data of a strip, which the image is split into */
const STRIP_BYTES = 256 * 1024;

const TYPE_ASCII = 2;
const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;
const TYPE_DOUBLE = 12;

const TYPE_SIZES: Record<number, number> = {
	[TYPE_ASCII]: 1,
	[TYPE_SHORT]: 2,
	[TYPE_LONG]: 4,
	[TYPE_RATIONAL]: 8,
	[TYPE_DOUBLE]: 8
};

interface TiffTag {
	tag: number;
	type: number;
	values: number[] | Uint8Array;
}

const ascii = (tag: number, text: string): TiffTag => {
	const bytes = new TextEncoder().encode(text);
	// ASCII values end with NUL
	const values = new Uint8Array(bytes.length + 1);
	values.set(bytes);
	return { tag, type: TYPE_ASCII, values };
};

/** Compress a strip with zlib, which is what TIFF calls Deflate (compression 8) */
async function deflate(data: Uint8Array) {
	const stream = new Blob([data as Uint8Array<ArrayBuffer>])
		.stream()
		.pipeThrough(new CompressionStream('deflate'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Read the RGB samples of a strip, dropping alpha. When `predict` is true, every sample is
 * replaced by its difference from the same sample of the pixel on its left (predictor 2),
 * which makes the map compress much better.
 */
function readStrip(raster: RgbaRaster, y: number, rows: number, predict: boolean) {
	const rgba = raster.read(y, rows);
	const rowBytes = raster.width * 3;
	const rgb = new Uint8Array(rowBytes * rows);
	for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
		rgb[j] = rgba[i];
		rgb[j + 1] = rgba[i + 1];
		rgb[j + 2] = rgba[i + 2];
	}
	if (predict) {
		for (let row = 0; row < rows; row++) {
			const start = row * rowBytes;
			for (let k = start + rowBytes - 1; k >= start + 3; k--) {
				rgb[k] = (rgb[k] - rgb[k - 3]) & 0xff;
			}
		}
	}
	return rgb;
}

/**
 * Create the GeoTIFF tags which place the image in EPSG:3857.
 *
 * The pixel grid is fitted to the top-left, top-right and bottom-left corners, so a rotated
 * map is written as an affine transformation and keeps its rotation. A north-up map is written
 * as a tie point and a pixel size instead, which more software reads.
 */
function createGeoTags(corners: GeoCorners, width: number, height: number): TiffTag[] {
	const [x0, y0] = lngLatToMercator(corners.topLeft);
	const [x1, y1] = lngLatToMercator(corners.topRight);
	const [x2, y2] = lngLatToMercator(corners.bottomLeft);
	// model = [a b; d e] * [column; row] + [x0; y0]
	const a = (x1 - x0) / width;
	const b = (x2 - x0) / height;
	const d = (y1 - y0) / width;
	const e = (y2 - y0) / height;

	const isNorthUp = Math.abs(b) < Math.abs(a) * 1e-9 && Math.abs(d) < Math.abs(e) * 1e-9;
	const transformTags: TiffTag[] = isNorthUp
		? [
				// ModelPixelScaleTag
				{ tag: 33550, type: TYPE_DOUBLE, values: [a, -e, 0] },
				// ModelTiepointTag
				{ tag: 33922, type: TYPE_DOUBLE, values: [0, 0, 0, x0, y0, 0] }
			]
		: [
				// ModelTransformationTag
				{
					tag: 34264,
					type: TYPE_DOUBLE,
					values: [a, b, 0, x0, d, e, 0, y0, 0, 0, 0, 0, 0, 0, 0, 1]
				}
			];

	const geoKeys = [
		// GTModelTypeGeoKey: projected
		[1024, 0, 1, 1],
		// GTRasterTypeGeoKey: PixelIsArea
		[1025, 0, 1, 1],
		// ProjectedCSTypeGeoKey: WGS 84 / Pseudo-Mercator
		[3072, 0, 1, 3857],
		// ProjLinearUnitsGeoKey: metre
		[3076, 0, 1, 9001]
	];
	return [
		...transformTags,
		// GeoKeyDirectoryTag: version 1.1.0 followed by the keys
		{ tag: 34735, type: TYPE_SHORT, values: [1, 1, 0, geoKeys.length, ...geoKeys.flat()] }
	];
}

/**
 * Write a TIFF tag value into the buffer
 */
function writeValues(view: DataView, offset: number, { type, values }: TiffTag) {
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		switch (type) {
			case TYPE_ASCII:
				view.setUint8(offset + i, value);
				break;
			case TYPE_SHORT:
				view.setUint16(offset + i * 2, value, true);
				break;
			case TYPE_LONG:
				view.setUint32(offset + i * 4, value, true);
				break;
			case TYPE_RATIONAL:
				view.setUint32(offset + i * 8, value, true);
				view.setUint32(offset + i * 8 + 4, 1, true);
				break;
			case TYPE_DOUBLE:
				view.setFloat64(offset + i * 8, value, true);
				break;
		}
	}
}

/**
 * Create a GeoTIFF of an RGB image, which GIS software such as QGIS (GDAL) places on the map.
 *
 * The image is written as a baseline little-endian TIFF in strips, compressed with Deflate
 * when the browser supports `CompressionStream`. The corners are given in latitude and
 * longitude, and are projected into EPSG:3857 which the map is drawn in.
 *
 * @param raster image to write. Its alpha is dropped
 * @param options georeference and metadata of the image
 */
export async function createGeoTiff(raster: RgbaRaster, options: GeoTiffOptions = {}) {
	const { width, height } = raster;
	const rowsPerStrip = Math.max(1, Math.min(height, Math.floor(STRIP_BYTES / (width * 3))));

	const compressed = typeof CompressionStream !== 'undefined';
	const strips: Uint8Array[] = [];
	for (let y = 0; y < height; y += rowsPerStrip) {
		const rows = Math.min(rowsPerStrip, height - y);
		const strip = readStrip(raster, y, rows, compressed);
		strips.push(compressed ? await deflate(strip) : strip);
	}

	const dpi = Math.round(options.dpi ?? 96);
	const tags: TiffTag[] = [
		// ImageWidth, ImageLength
		{ tag: 256, type: TYPE_LONG, values: [width] },
		{ tag: 257, type: TYPE_LONG, values: [height] },
		// BitsPerSample
		{ tag: 258, type: TYPE_SHORT, values: [8, 8, 8] },
		// Compression: Deflate or none
		{ tag: 259, type: TYPE_SHORT, values: [compressed ? 8 : 1] },
		// PhotometricInterpretation: RGB
		{ tag: 262, type: TYPE_SHORT, values: [2] },
		...(options.description ? [ascii(270, options.description)] : []),
		// StripOffsets, filled in once the layout is known
		{ tag: 273, type: TYPE_LONG, values: strips.map(() => 0) },
		// SamplesPerPixel
		{ tag: 277, type: TYPE_SHORT, values: [3] },
		// RowsPerStrip
		{ tag: 278, type: TYPE_LONG, values: [rowsPerStrip] },
		// StripByteCounts
		{ tag: 279, type: TYPE_LONG, values: strips.map((strip) => strip.length) },
		// XResolution, YResolution
		{ tag: 282, type: TYPE_RATIONAL, values: [dpi] },
		{ tag: 283, type: TYPE_RATIONAL, values: [dpi] },
		// PlanarConfiguration: chunky
		{ tag: 284, type: TYPE_SHORT, values: [1] },
		// ResolutionUnit: inch
		{ tag: 296, type: TYPE_SHORT, values: [2] },
		...(options.software ? [ascii(305, options.software)] : []),
		...(options.artist ? [ascii(315, options.artist)] : []),
		// Predictor: horizontal differencing
		...(compressed ? [{ tag: 317, type: TYPE_SHORT, values: [2] }] : []),
		...(options.corners ? createGeoTags(options.corners, width, height) : [])
	];

	// layout: header, IFD, values which do not fit in the IFD entries, strips
	const ifdOffset = 8;
	const ifdSize = 2 + tags.length * 12 + 4;
	let offset = ifdOffset + ifdSize;
	const valueOffsets = tags.map(({ type, values }) => {
		const size = TYPE_SIZES[type] * values.length;
		if (size <= 4) return undefined;
		// values start on a word boundary
		offset += offset % 2;
		const start = offset;
		offset += size;
		return start;
	});
	offset += offset % 2;
	const headerSize = offset;
	const stripOffsets = tags.find(({ tag }) => tag === 273)?.values as number[];
	strips.forEach((strip, i) => {
		stripOffsets[i] = offset;
		offset += strip.length;
	});

	const header = new ArrayBuffer(headerSize);
	const view = new DataView(header);
	// "II": little-endian, 42: TIFF
	view.setUint16(0, 0x4949, true);
	view.setUint16(2, 42, true);
	view.setUint32(4, ifdOffset, true);

	view.setUint16(ifdOffset, tags.length, true);
	tags.forEach((tag, i) => {
		const entry = ifdOffset + 2 + i * 12;
		view.setUint16(entry, tag.tag, true);
		view.setUint16(entry + 2, tag.type, true);
		view.setUint32(entry + 4, tag.values.length, true);
		const valueOffset = valueOffsets[i];
		if (valueOffset === undefined) {
			writeValues(view, entry + 8, tag);
		} else {
			view.setUint32(entry + 8, valueOffset, true);
			writeValues(view, valueOffset, tag);
		}
	});
	// no further IFD
	view.setUint32(ifdOffset + 2 + tags.length * 12, 0, true);

	return new Blob([header, ...(strips as Uint8Array<ArrayBuffer>[])], { type: 'image/tiff' });
}
