import { describe, expect, it } from 'vitest';
import {
	clampPreviewPan,
	getPreviewDpi,
	PREVIEW_ZOOM_MAX,
	PREVIEW_ZOOM_MIN,
	stepPreviewZoom
} from './preview';

describe('getPreviewDpi', () => {
	it('matches the pixels of the frame', () => {
		// a 960 px wide page shown 480 px wide on a 2x screen keeps 96 DPI
		expect(getPreviewDpi(254, 480, 2, 300)).toBeCloseTo(96);
		expect(getPreviewDpi(254, 480, 1, 300)).toBeCloseTo(48);
	});

	it('never exceeds the DPI of the export nor goes below the minimum', () => {
		expect(getPreviewDpi(254, 4800, 2, 300)).toBe(300);
		expect(getPreviewDpi(2540, 10, 1, 300)).toBe(20);
	});
});

describe('stepPreviewZoom', () => {
	it('adds or removes 10%', () => {
		expect(stepPreviewZoom(1, 1)).toBe(1.1);
		expect(stepPreviewZoom(1, -1)).toBe(0.9);
	});

	it('does not drift after many steps', () => {
		let zoom = 1;
		for (let i = 0; i < 7; i++) zoom = stepPreviewZoom(zoom, 1);
		expect(zoom).toBe(1.7);
	});

	it('stays between 50% and 300%', () => {
		expect(stepPreviewZoom(PREVIEW_ZOOM_MAX, 1)).toBe(PREVIEW_ZOOM_MAX);
		expect(stepPreviewZoom(PREVIEW_ZOOM_MIN, -1)).toBe(PREVIEW_ZOOM_MIN);
	});
});

describe('clampPreviewPan', () => {
	it('keeps an offset which leaves the page in the frame', () => {
		expect(clampPreviewPan({ x: 50, y: -20 }, [400, 300], [500, 400], 2)).toEqual({
			x: 50,
			y: -20
		});
	});

	it('keeps a margin of the page inside the frame', () => {
		// (400 * 2 + 500) / 2 - 40 = 610, (300 * 2 + 400) / 2 - 40 = 460
		expect(clampPreviewPan({ x: 1000, y: -1000 }, [400, 300], [500, 400], 2)).toEqual({
			x: 610,
			y: -460
		});
	});
});
