import { describe, expect, it } from 'vitest';
import { isInTile, tileCorners, tileKey, tileOutline } from './tile-clip';
import { project } from './test-utils';

describe('tileCorners', () => {
	it('covers the world at zoom 0', () => {
		const [nw, ne, se, sw] = tileCorners({ z: 0, x: 0, y: 0 });
		expect(nw[0]).toBe(-180);
		expect(ne[0]).toBe(180);
		expect(nw[1]).toBeCloseTo(85.0511, 4);
		expect(se[1]).toBeCloseTo(-85.0511, 4);
		expect(sw).toEqual([nw[0], se[1]]);
	});

	it('returns the quadrant of a tile at zoom 1', () => {
		const [nw, , se] = tileCorners({ z: 1, x: 1, y: 1 });
		expect(nw[0]).toBe(0);
		expect(nw[1]).toBeCloseTo(0);
		expect(se[0]).toBe(180);
	});
});

describe('tileOutline', () => {
	it('projects the corners', () => {
		const outline = tileOutline({ z: 1, x: 1, y: 0 }, project);
		expect(outline[0].x).toBeCloseTo(0);
		expect(outline[1].x).toBeCloseTo(1800);
		expect(outline[2].y).toBeCloseTo(0);
	});

	it('grows outwards', () => {
		const tile = { z: 1, x: 1, y: 0 };
		const plain = tileOutline(tile, project);
		const grown = tileOutline(tile, project, 1);
		expect(grown[0].x).toBeLessThan(plain[0].x);
		expect(grown[0].y).toBeLessThan(plain[0].y);
		expect(grown[2].x).toBeGreaterThan(plain[2].x);
		expect(grown[2].y).toBeGreaterThan(plain[2].y);
	});

	it('follows the rotation of the map', () => {
		// the map is turned by 90 degrees
		const rotated = ([lng, lat]: [number, number]) => ({ x: lat, y: lng });
		const outline = tileOutline({ z: 1, x: 1, y: 1 }, rotated);
		expect(outline[1].y).toBeCloseTo(180);
		expect(outline[1].x).toBeCloseTo(0);
	});
});

describe('isInTile', () => {
	it('tells the tile apart from its buffer', () => {
		const tile = { z: 1, x: 1, y: 0 };
		expect(isInTile([90, 45], tile)).toBe(true);
		expect(isInTile([-1, 45], tile)).toBe(false);
		expect(isInTile([90, -1], tile)).toBe(false);
		// the western and northern edges belong to the tile
		expect(isInTile([0, 45], tile)).toBe(true);
	});
});

describe('tileKey', () => {
	it('is empty for an unknown tile', () => {
		expect(tileKey(undefined)).toBe('');
		expect(tileKey({ z: 3, x: 2, y: 1 })).toBe('3/2/1');
	});
});
