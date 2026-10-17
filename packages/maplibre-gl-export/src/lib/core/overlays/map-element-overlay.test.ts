import { describe, expect, it } from 'vitest';
import {
	getOverlayOrigin,
	MapElementOverlay,
	stackOverlay,
	type OverlayLayout
} from './map-element-overlay';

/** Overlay which only places a box of a fixed size, to test the layout without the DOM */
class BoxOverlay extends MapElementOverlay {
	protected readonly name = 'box';

	protected readonly defaultPosition = 'bottom-left';

	async drawOnCanvas(_ctx: CanvasRenderingContext2D, layout: OverlayLayout) {
		this.place(layout, 100, 20);
	}

	createElement(layout: OverlayLayout) {
		this.place(layout, 100, 20);
		return undefined;
	}
}

const page = { width: 400, height: 300 };

describe('getOverlayOrigin', () => {
	it('places the overlay in each corner of the page', () => {
		expect(getOverlayOrigin(page, 'top-left', 100, 20, 10)).toEqual({ x: 10, y: 10 });
		expect(getOverlayOrigin(page, 'top-right', 100, 20, 10)).toEqual({ x: 290, y: 10 });
		expect(getOverlayOrigin(page, 'bottom-left', 100, 20, 10)).toEqual({ x: 10, y: 270 });
		expect(getOverlayOrigin(page, 'bottom-right', 100, 20, 10)).toEqual({ x: 290, y: 270 });
	});
});

describe('stackOverlay', () => {
	it('moves a bottom overlay above the one it overlaps', () => {
		const box = { x: 10, y: 270, width: 100, height: 20 };
		stackOverlay(box, { x: 0, y: 260, width: 400, height: 30 }, 'bottom-left', 10);
		expect(box.y).toBe(230);
	});

	it('moves a top overlay below the one it overlaps', () => {
		const box = { x: 10, y: 10, width: 100, height: 20 };
		stackOverlay(box, { x: 0, y: 10, width: 400, height: 30 }, 'top-left', 10);
		expect(box.y).toBe(50);
	});

	it('keeps an overlay which does not overlap in place', () => {
		const box = { x: 10, y: 270, width: 100, height: 20 };
		stackOverlay(box, { x: 200, y: 260, width: 190, height: 30 }, 'bottom-left', 10);
		expect(box.y).toBe(270);
	});
});

describe('MapElementOverlay', () => {
	it('scales the margin by the scale of the page', () => {
		const overlay = new BoxOverlay({ margin: 10 });
		overlay.create({ ...page, scale: 2 });
		expect(overlay.box).toEqual({ x: 20, y: 260, width: 100, height: 20 });
	});

	it('is stacked over the overlay to avoid', () => {
		const other = new BoxOverlay({ position: 'bottom-left' });
		other.create({ ...page, scale: 1 });
		const overlay = new BoxOverlay({ position: 'bottom-left' }, other);
		overlay.create({ ...page, scale: 1 });
		expect(overlay.box?.y).toBe(240);
	});

	it('draws nothing when it is hidden', async () => {
		const overlay = new BoxOverlay({ visibility: 'none' });
		await overlay.draw({} as CanvasRenderingContext2D, { ...page, scale: 1 });
		expect(overlay.create({ ...page, scale: 1 })).toBeUndefined();
		expect(overlay.box).toBeUndefined();
	});
});
