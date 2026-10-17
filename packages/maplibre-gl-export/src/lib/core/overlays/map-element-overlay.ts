import type { ControlPosition } from 'maplibre-gl';

const SVG_NS = 'http://www.w3.org/2000/svg';

export const FONT_FAMILY = "'Helvetica Neue', Arial, Helvetica, sans-serif";

/** Horizontal padding of the attribution and scale controls */
export const PADDING = 5;

/** Box of an overlay in pixels of the page it is drawn on */
export interface OverlayBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Page an overlay is drawn on. The export canvas is in export pixels, so its `scale` is the
 * ratio to the 96 DPI layout, while the vector SVG is in CSS pixels, so its `scale` is 1.
 */
export interface OverlayLayout {
	width: number;
	height: number;
	scale: number;
}

/** Options every overlay has in common */
export interface OverlayOptions {
	visibility?: 'visible' | 'none';
	position?: ControlPosition;
	/** Distance between the overlay and the edge of the page at 96 DPI */
	margin?: number;
}

/** Create an SVG element with the given attributes and text */
export function createSvgNode(name: string, attrs: Record<string, string | number>, text?: string) {
	const node = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
	if (text !== undefined) node.textContent = text;
	return node;
}

/**
 * Calculate the top-left corner where an overlay of the given size is drawn.
 * @param page page the overlay is drawn on
 * @param position corner of the page
 * @param width overlay width
 * @param height overlay height
 * @param margin distance from the page edge
 */
export function getOverlayOrigin(
	page: { width: number; height: number },
	position: ControlPosition,
	width: number,
	height: number,
	margin: number
) {
	const left = ['top-left', 'bottom-left'].includes(position);
	const top = ['top-left', 'top-right'].includes(position);
	return {
		x: left ? margin : page.width - width - margin,
		y: top ? margin : page.height - height - margin
	};
}

/**
 * Stack an overlay on top of / below another one when they overlap, e.g. the scale bar and
 * the attribution which share a corner or spread over the width of a narrow page.
 * @param box box of the overlay to move. It is updated in place.
 * @param other box of the overlay which is kept in place
 * @param position corner of `box`. It is moved towards the center of the page.
 * @param margin gap between the two overlays
 */
export function stackOverlay(
	box: OverlayBox,
	other: OverlayBox,
	position: ControlPosition,
	margin: number
) {
	const overlaps =
		box.x < other.x + other.width &&
		other.x < box.x + box.width &&
		box.y < other.y + other.height &&
		other.y < box.y + box.height;
	if (!overlaps) return;
	box.y = position.startsWith('top')
		? other.y + other.height + margin
		: other.y - box.height - margin;
}

/**
 * An element drawn over the exported map, such as the scale bar. It is drawn either on the
 * export canvas by `draw`, or as SVG elements of the vector export by `create`.
 *
 * An instance holds the box it was drawn in, so a new one is made for every page.
 */
export abstract class MapElementOverlay<O extends OverlayOptions = OverlayOptions> {
	/** Box occupied by the overlay once it was drawn. undefined when nothing was drawn */
	box: OverlayBox | undefined;

	/** Name of the overlay used in warnings */
	protected abstract readonly name: string;

	/** Corner of the page the overlay is placed in when `position` is not set */
	protected abstract readonly defaultPosition: ControlPosition;

	/**
	 * @param options settings of the overlay
	 * @param avoid overlay which is drawn before this one, which this one is stacked over
	 * when they overlap
	 */
	constructor(
		protected options: O,
		private avoid?: MapElementOverlay
	) {}

	get visible() {
		return this.options.visibility !== 'none';
	}

	get position() {
		return this.options.position ?? this.defaultPosition;
	}

	/**
	 * Distance from the page edge
	 * @param scale `scale` of the page, see {@link OverlayLayout}. default is 1, i.e. CSS pixels.
	 */
	margin(scale = 1) {
		return (this.options.margin ?? 10) * scale;
	}

	/** Draw the overlay on the export canvas. Failures are warned about rather than thrown. */
	async draw(ctx: CanvasRenderingContext2D, layout: OverlayLayout) {
		if (!this.visible) return;
		try {
			await this.drawOnCanvas(ctx, layout);
		} catch (err) {
			console.warn(`Failed to render ${this.name}:`, err);
		}
	}

	/**
	 * Create the SVG elements of the overlay for the vector export.
	 * @returns undefined when there is nothing to draw
	 */
	create(layout: OverlayLayout) {
		if (!this.visible) return undefined;
		return this.createElement(layout);
	}

	protected abstract drawOnCanvas(
		ctx: CanvasRenderingContext2D,
		layout: OverlayLayout
	): Promise<void>;

	protected abstract createElement(layout: OverlayLayout): SVGGElement | undefined;

	/**
	 * Place the overlay of the given size in its corner of the page, stacked over the overlay
	 * to avoid when they overlap, and keep the box as the one occupied by this overlay.
	 */
	protected place(layout: OverlayLayout, width: number, height: number) {
		const margin = this.margin(layout.scale);
		const origin = getOverlayOrigin(layout, this.position, width, height, margin);
		const box = { ...origin, width, height };
		if (this.avoid?.box) stackOverlay(box, this.avoid.box, this.position, margin);
		this.box = box;
		return box;
	}
}
