import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGeoTiff, lngLatToMercator, type RgbaRaster } from './geotiff';
import type { GeoCorners } from './geopdf';

const WIDTH = 300;
const HEIGHT = 1000;

/** Gradient whose every pixel tells where it is */
const pixel = (x: number, y: number) => [x % 256, y % 256, (x + y) % 256];

const raster: RgbaRaster = {
	width: WIDTH,
	height: HEIGHT,
	read: (y, rows) => {
		const data = new Uint8ClampedArray(WIDTH * rows * 4);
		for (let row = 0; row < rows; row++) {
			for (let x = 0; x < WIDTH; x++) {
				data.set([...pixel(x, y + row), 255], (row * WIDTH + x) * 4);
			}
		}
		return data;
	}
};

const northUp: GeoCorners = {
	topLeft: [139, 36],
	topRight: [141, 36],
	bottomRight: [141, 35],
	bottomLeft: [139, 35]
};

/** Rotated by 90 degrees, so the top of the image faces east */
const rotated: GeoCorners = {
	topLeft: [141, 36],
	topRight: [141, 35],
	bottomRight: [139, 35],
	bottomLeft: [139, 36]
};

const TYPE_SIZES: Record<number, number> = { 2: 1, 3: 2, 4: 4, 5: 8, 12: 8 };

/** Read the tags of the first IFD of a little-endian TIFF */
function readTags(buffer: ArrayBuffer) {
	const view = new DataView(buffer);
	expect(view.getUint16(0, true)).toBe(0x4949);
	expect(view.getUint16(2, true)).toBe(42);
	const ifd = view.getUint32(4, true);
	const tags = new Map<number, number[]>();
	for (let i = 0; i < view.getUint16(ifd, true); i++) {
		const entry = ifd + 2 + i * 12;
		const type = view.getUint16(entry + 2, true);
		const count = view.getUint32(entry + 4, true);
		const size = TYPE_SIZES[type];
		const offset = size * count <= 4 ? entry + 8 : view.getUint32(entry + 8, true);
		const values: number[] = [];
		for (let j = 0; j < count; j++) {
			const at = offset + j * size;
			if (type === 2) values.push(view.getUint8(at));
			if (type === 3) values.push(view.getUint16(at, true));
			if (type === 4) values.push(view.getUint32(at, true));
			if (type === 5) values.push(view.getUint32(at, true) / view.getUint32(at + 4, true));
			if (type === 12) values.push(view.getFloat64(at, true));
		}
		tags.set(view.getUint16(entry, true), values);
	}
	return tags;
}

const text = (values: number[] | undefined) =>
	new TextDecoder().decode(new Uint8Array(values ?? []).slice(0, -1));

/** Decode the RGB pixels of the image, undoing compression and the predictor */
async function readPixels(buffer: ArrayBuffer, tags: Map<number, number[]>) {
	const offsets = tags.get(273) ?? [];
	const counts = tags.get(279) ?? [];
	const compressed = tags.get(259)?.[0] === 8;
	const chunks: Uint8Array[] = [];
	for (let i = 0; i < offsets.length; i++) {
		const strip = new Uint8Array(buffer, offsets[i], counts[i]);
		if (!compressed) {
			chunks.push(strip);
			continue;
		}
		const stream = new Blob([strip]).stream().pipeThrough(new DecompressionStream('deflate'));
		chunks.push(new Uint8Array(await new Response(stream).arrayBuffer()));
	}
	const rgb = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
	chunks.reduce((offset, chunk) => (rgb.set(chunk, offset), offset + chunk.length), 0);
	if (tags.get(317)?.[0] === 2) {
		const rowBytes = WIDTH * 3;
		for (let row = 0; row < HEIGHT; row++) {
			for (let k = row * rowBytes + 3; k < (row + 1) * rowBytes; k++) {
				rgb[k] = (rgb[k] + rgb[k - 3]) & 0xff;
			}
		}
	}
	return rgb;
}

function expectPixels(rgb: Uint8Array) {
	expect(rgb.length).toBe(WIDTH * HEIGHT * 3);
	for (let y = 0; y < HEIGHT; y++) {
		for (let x = 0; x < WIDTH; x++) {
			const i = (y * WIDTH + x) * 3;
			if (rgb[i] !== pixel(x, y)[0] || rgb[i + 1] !== pixel(x, y)[1]) {
				expect([...rgb.slice(i, i + 3)], `pixel ${x}, ${y}`).toEqual(pixel(x, y));
			}
		}
	}
}

describe('lngLatToMercator', () => {
	it('projects into EPSG:3857', () => {
		const [x0, y0] = lngLatToMercator([0, 0]);
		expect(x0).toBe(0);
		expect(y0).toBeCloseTo(0, 6);
		const [x, y] = lngLatToMercator([180, 85.0511287798]);
		expect(x).toBeCloseTo(20037508.34, 1);
		expect(y).toBeCloseTo(20037508.34, 0);
	});
});

describe('createGeoTiff', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('writes the RGB image in Deflate compressed strips', async () => {
		const blob = await createGeoTiff(raster, { dpi: 300 });
		expect(blob.type).toBe('image/tiff');
		const buffer = await blob.arrayBuffer();
		const tags = readTags(buffer);
		expect(tags.get(256)).toEqual([WIDTH]);
		expect(tags.get(257)).toEqual([HEIGHT]);
		expect(tags.get(258)).toEqual([8, 8, 8]);
		expect(tags.get(259)).toEqual([8]);
		expect(tags.get(277)).toEqual([3]);
		expect(tags.get(282)).toEqual([300]);
		expect(tags.get(273)?.length).toBeGreaterThan(1);
		expectPixels(await readPixels(buffer, tags));
	});

	it('writes the image uncompressed without CompressionStream', async () => {
		vi.stubGlobal('CompressionStream', undefined);
		const buffer = await (await createGeoTiff(raster)).arrayBuffer();
		const tags = readTags(buffer);
		expect(tags.get(259)).toEqual([1]);
		expect(tags.has(317)).toBe(false);
		expectPixels(await readPixels(buffer, tags));
	});

	it('writes the metadata', async () => {
		const tags = readTags(
			await (
				await createGeoTiff(raster, {
					description: 'center: [140, 35.5]',
					software: 'MapLibre GL Export Plugin',
					artist: '© OpenStreetMap contributors'
				})
			).arrayBuffer()
		);
		expect(text(tags.get(270))).toBe('center: [140, 35.5]');
		expect(text(tags.get(305))).toBe('MapLibre GL Export Plugin');
		expect(text(tags.get(315))).toBe('© OpenStreetMap contributors');
	});

	it('writes no georeference without corners', async () => {
		const tags = readTags(await (await createGeoTiff(raster)).arrayBuffer());
		expect(tags.has(33550)).toBe(false);
		expect(tags.has(34264)).toBe(false);
		expect(tags.has(34735)).toBe(false);
	});

	it('georeferences a north-up map with a tie point and a pixel size', async () => {
		const tags = readTags(await (await createGeoTiff(raster, { corners: northUp })).arrayBuffer());
		const [left, top] = lngLatToMercator(northUp.topLeft);
		const [right, bottom] = lngLatToMercator(northUp.bottomRight);
		const [scaleX, scaleY] = tags.get(33550) ?? [];
		expect(scaleX).toBeCloseTo((right - left) / WIDTH, 6);
		expect(scaleY).toBeCloseTo((top - bottom) / HEIGHT, 6);
		expect(tags.get(33922)).toEqual([0, 0, 0, left, top, 0]);
		expect(tags.has(34264)).toBe(false);
		expect(tags.get(34735)).toEqual([
			1, 1, 0, 4, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, 3857, 3076, 0, 1, 9001
		]);
	});

	it('georeferences a rotated map with an affine transformation', async () => {
		const tags = readTags(await (await createGeoTiff(raster, { corners: rotated })).arrayBuffer());
		expect(tags.has(33550)).toBe(false);
		const matrix = tags.get(34264) ?? [];
		const project = (column: number, row: number) => [
			matrix[0] * column + matrix[1] * row + matrix[3],
			matrix[4] * column + matrix[5] * row + matrix[7]
		];
		const corners: [keyof GeoCorners, number, number][] = [
			['topLeft', 0, 0],
			['topRight', WIDTH, 0],
			['bottomRight', WIDTH, HEIGHT],
			['bottomLeft', 0, HEIGHT]
		];
		for (const [corner, column, row] of corners) {
			const [x, y] = lngLatToMercator(rotated[corner]);
			const [px, py] = project(column, row);
			expect(px).toBeCloseTo(x, 3);
			expect(py).toBeCloseTo(y, 3);
		}
	});
});
