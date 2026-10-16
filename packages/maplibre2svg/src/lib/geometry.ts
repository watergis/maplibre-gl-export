import type { Geometry, Position } from 'geojson';
import { fmt } from './svg';
import type { Point, Project } from './types';

export interface Path {
	points: Point[];
	closed: boolean;
}

const projectAll = (positions: Position[], project: Project) =>
	positions.map((position) => project([position[0], position[1]]));

/** Project the lines and rings of a geometry. Points have none. */
export function geometryToPaths(geometry: Geometry, project: Project): Path[] {
	switch (geometry.type) {
		case 'LineString':
			return [{ points: projectAll(geometry.coordinates, project), closed: false }];
		case 'MultiLineString':
			return geometry.coordinates.map((line) => ({
				points: projectAll(line, project),
				closed: false
			}));
		case 'Polygon':
			return geometry.coordinates.map((ring) => ({
				points: projectAll(ring, project),
				closed: true
			}));
		case 'MultiPolygon':
			return geometry.coordinates.flatMap((polygon) =>
				polygon.map((ring) => ({ points: projectAll(ring, project), closed: true }))
			);
		case 'GeometryCollection':
			return geometry.geometries.flatMap((child) => geometryToPaths(child, project));
		default:
			return [];
	}
}

/** Project every vertex of a geometry */
export function geometryToPoints(geometry: Geometry, project: Project): Point[] {
	switch (geometry.type) {
		case 'Point':
			return projectAll([geometry.coordinates], project);
		case 'MultiPoint':
			return projectAll(geometry.coordinates, project);
		case 'GeometryCollection':
			return geometry.geometries.flatMap((child) => geometryToPoints(child, project));
		default:
			return geometryToPaths(geometry, project).flatMap((path) => path.points);
	}
}

/** Build the `d` attribute of a `<path>` */
export function pathData(paths: Path[]) {
	const parts: string[] = [];
	for (const { points, closed } of paths) {
		if (points.length < 2) continue;
		let previous = '';
		points.forEach((point, index) => {
			const command = `${fmt(point.x)} ${fmt(point.y)}`;
			// vertices closer than the output precision only add to the file size
			if (command === previous) return;
			previous = command;
			parts.push(`${index === 0 ? 'M' : 'L'}${command}`);
		});
		if (closed) parts.push('Z');
	}
	return parts.join('');
}

/** Length of a path in pixels */
export function pathLength(points: Point[]) {
	let length = 0;
	for (let i = 1; i < points.length; i++) {
		length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
	}
	return length;
}

/** Longest distance a miter join may extend, as a multiple of the offset */
const MAX_MITER = 4;

/**
 * Offset a line sideways. A positive offset moves it to the right of its direction,
 * as `line-offset` does (y points down on the screen).
 */
export function offsetPath(path: Path, offset: number): Path {
	const { closed } = path;
	// a closed ring repeats its first vertex at the end
	const points =
		closed &&
		path.points.length > 1 &&
		path.points[0].x === path.points[path.points.length - 1].x &&
		path.points[0].y === path.points[path.points.length - 1].y
			? path.points.slice(0, -1)
			: path.points;
	const count = points.length;
	if (offset === 0 || count < 2) return path;

	const normal = (from: Point, to: Point): Point | undefined => {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const length = Math.hypot(dx, dy);
		return length === 0 ? undefined : { x: -dy / length, y: dx / length };
	};

	const result = points.map((point, index) => {
		const hasPrevious = closed || index > 0;
		const hasNext = closed || index < count - 1;
		const before = hasPrevious ? normal(points[(index - 1 + count) % count], point) : undefined;
		const after = hasNext ? normal(point, points[(index + 1) % count]) : undefined;
		const a = before ?? after;
		const b = after ?? before;
		if (!a || !b) return point;

		// the miter direction halves the angle between both segments
		const mx = a.x + b.x;
		const my = a.y + b.y;
		const length = Math.hypot(mx, my);
		if (length < 1e-6) return { x: point.x + a.x * offset, y: point.y + a.y * offset };
		const cos = (mx / length) * a.x + (my / length) * a.y;
		const scale = Math.min(1 / Math.max(cos, 1e-6), MAX_MITER) * offset;
		return { x: point.x + (mx / length) * scale, y: point.y + (my / length) * scale };
	});

	if (closed) result.push(result[0]);
	return { points: result, closed };
}
