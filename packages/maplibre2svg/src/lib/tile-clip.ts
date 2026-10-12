import type { Point, Project, TileId } from './types';

export const tileKey = (tile: TileId | undefined) => (tile ? `${tile.z}/${tile.x}/${tile.y}` : '');

const tileLng = (x: number, z: number) => (x / 2 ** z) * 360 - 180;

const tileLat = (y: number, z: number) =>
	(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** z))) * 180) / Math.PI;

/** Corners of a tile as `[lng, lat]`, clockwise from the north-west */
export function tileCorners({ z, x, y }: TileId): [number, number][] {
	const west = tileLng(x, z);
	const east = tileLng(x + 1, z);
	const north = tileLat(y, z);
	const south = tileLat(y + 1, z);
	return [
		[west, north],
		[east, north],
		[east, south],
		[west, south]
	];
}

/**
 * Outline of a tile in pixels, which the features of the tile are clipped to.
 *
 * @param expand distance to grow the outline by. Clipping two neighbouring tiles at the
 * exact same edge leaves a hairline gap between them when the SVG is rasterized.
 */
export function tileOutline(tile: TileId, project: Project, expand = 0): Point[] {
	const corners = tileCorners(tile).map(project);
	if (expand === 0) return corners;
	const cx = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length;
	const cy = corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length;
	return corners.map((corner) => {
		const dx = corner.x - cx;
		const dy = corner.y - cy;
		const length = Math.hypot(dx, dy) || 1;
		return { x: corner.x + (dx / length) * expand, y: corner.y + (dy / length) * expand };
	});
}

/** Whether a position lies inside the tile itself rather than in its buffer */
export function isInTile([lng, lat]: [number, number] | number[], { z, x, y }: TileId) {
	const scale = 2 ** z;
	const tx = ((lng + 180) / 360) * scale;
	const sin = Math.sin((lat * Math.PI) / 180);
	const ty = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
	return tx >= x && tx < x + 1 && ty >= y && ty < y + 1;
}
