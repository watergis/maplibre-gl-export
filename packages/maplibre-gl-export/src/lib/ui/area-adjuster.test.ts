import { describe, expect, it } from 'vitest';
import { mmToPx, toExportZoom, toMapZoom } from './area-adjuster';

describe('zoom conversion', () => {
	it('lays out the page at 96 DPI', () => {
		expect(mmToPx(25.4)).toBeCloseTo(96);
	});

	it('keeps the zoom when the frame is as wide as the page at 96 DPI', () => {
		expect(toExportZoom(10, 25.4 * 10, 960)).toBeCloseTo(10);
	});

	it('zooms in by one level when the page is twice as wide as the frame', () => {
		expect(toExportZoom(10, 25.4 * 10, 480)).toBeCloseTo(11);
	});

	it('is inverted by toMapZoom', () => {
		const exportZoom = toExportZoom(7.3, 297, 612);
		expect(toMapZoom(exportZoom, 297, 612)).toBeCloseTo(7.3);
	});
});
