import { describe, expect, it } from 'vitest';
import { geometryToPaths, geometryToPoints, offsetPath, pathData, pathLength } from './geometry';
import { project } from './test-utils';

describe('geometryToPaths', () => {
	it('projects lines as open paths', () => {
		const paths = geometryToPaths(
			{
				type: 'MultiLineString',
				coordinates: [
					[
						[0, 0],
						[1, 1]
					],
					[
						[2, 0],
						[3, 0]
					]
				]
			},
			project
		);
		expect(pathData(paths)).toBe('M0 0L10 -10M20 0L30 0');
	});

	it('projects every ring of a polygon as a closed path', () => {
		const ring = (size: number) => [
			[0, 0],
			[size, 0],
			[size, -size],
			[0, 0]
		];
		const paths = geometryToPaths({ type: 'Polygon', coordinates: [ring(2), ring(1)] }, project);
		expect(paths.every((path) => path.closed)).toBe(true);
		expect(pathData(paths)).toBe('M0 0L20 0L20 20L0 0ZM0 0L10 0L10 10L0 0Z');
	});

	it('has no paths for points', () => {
		expect(geometryToPaths({ type: 'Point', coordinates: [1, 1] }, project)).toEqual([]);
	});
});

describe('geometryToPoints', () => {
	it('returns every vertex', () => {
		expect(geometryToPoints({ type: 'Point', coordinates: [1, 2] }, project)).toEqual([
			{ x: 10, y: -20 }
		]);
		expect(
			geometryToPoints(
				{
					type: 'LineString',
					coordinates: [
						[0, 0],
						[1, 0]
					]
				},
				project
			)
		).toHaveLength(2);
	});
});

describe('pathData', () => {
	it('rounds to 2 decimals and drops repeated vertices', () => {
		const d = pathData([
			{
				points: [
					{ x: 0.004, y: 1.236 },
					{ x: 0.001, y: 1.2361 },
					{ x: 5, y: 5 }
				],
				closed: false
			}
		]);
		expect(d).toBe('M0 1.24L5 5');
	});

	it('skips paths with less than 2 points', () => {
		expect(pathData([{ points: [{ x: 0, y: 0 }], closed: false }])).toBe('');
	});
});

describe('offsetPath', () => {
	it('moves a line to the right of its direction', () => {
		const path = {
			points: [
				{ x: 0, y: 0 },
				{ x: 10, y: 0 }
			],
			closed: false
		};
		// east on the screen, so right is down
		expect(offsetPath(path, 2).points).toEqual([
			{ x: 0, y: 2 },
			{ x: 10, y: 2 }
		]);
		expect(offsetPath(path, 0)).toBe(path);
	});

	it('joins the segments of a corner with a miter', () => {
		const { points } = offsetPath(
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 }
				],
				closed: false
			},
			1
		);
		expect(points[1].x).toBeCloseTo(9);
		expect(points[1].y).toBeCloseTo(1);
	});

	it('keeps a ring closed', () => {
		const { points } = offsetPath(
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
					{ x: 0, y: 10 },
					{ x: 0, y: 0 }
				],
				closed: true
			},
			1
		);
		expect(points).toHaveLength(5);
		expect(points[4]).toEqual(points[0]);
		expect(points[0].x).toBeCloseTo(1);
		expect(points[0].y).toBeCloseTo(1);
	});
});

describe('pathLength', () => {
	it('sums the length of the segments', () => {
		expect(
			pathLength([
				{ x: 0, y: 0 },
				{ x: 3, y: 4 },
				{ x: 3, y: 10 }
			])
		).toBe(11);
	});
});
