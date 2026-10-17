import { describe, expect, it, vi } from 'vitest';
import {
	isSameSize,
	isVectorFormat,
	getPreviewDpi,
	mmToPx,
	orientSize,
	resolveAllowedSizes,
	sanitizeFileName,
	fitPageInViewport,
	toExportZoom,
	toMapZoom
} from './export-dialog-utils';
import { Size } from './interfaces';

describe('zoom conversion', () => {
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

describe('fitPageInViewport', () => {
	it('is limited by the width for a wide page', () => {
		const size = fitPageInViewport(800, 600, 297, 210, 50);
		expect(size.width).toBeCloseTo(700);
		expect(size.height).toBeCloseTo((700 * 210) / 297);
	});

	it('is limited by the height for a tall page', () => {
		const size = fitPageInViewport(800, 600, 210, 297, 50);
		expect(size.height).toBeCloseTo(500);
		expect(size.width).toBeCloseTo((500 * 210) / 297);
	});
});

describe('getPreviewDpi', () => {
	it('matches the pixels of the frame', () => {
		expect(mmToPx(25.4)).toBeCloseTo(96);
		// a 960 px wide page shown 480 px wide on a 2x screen keeps 96 DPI
		expect(getPreviewDpi(254, 480, 2, 300)).toBeCloseTo(96);
		expect(getPreviewDpi(254, 480, 1, 300)).toBeCloseTo(48);
	});

	it('never exceeds the DPI of the export nor goes below the minimum', () => {
		expect(getPreviewDpi(254, 4800, 2, 300)).toBe(300);
		expect(getPreviewDpi(2540, 10, 1, 300)).toBe(20);
	});
});

describe('orientSize', () => {
	it('keeps landscape sizes and swaps portrait ones', () => {
		expect(orientSize(Size.A4, 'landscape')).toEqual([297, 210]);
		expect(orientSize(Size.A4, 'portrait')).toEqual([210, 297]);
	});
});

describe('resolveAllowedSizes', () => {
	it('resolves presets and custom sizes, skipping invalid and duplicated entries', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const sizes = resolveAllowedSizes([
			'A4',
			{ name: '16:9', size: [320, 180] },
			{ name: 'bad', size: [0, 10] },
			'A4'
		]);
		expect(sizes).toEqual({ A4: Size.A4, '16:9': [320, 180] });
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});

	it('falls back to every preset', () => {
		expect(resolveAllowedSizes([])).toEqual({ ...Size });
	});
});

describe('isSameSize', () => {
	it('compares by value', () => {
		expect(isSameSize([297, 210], Size.A4)).toBe(true);
		expect(isSameSize([210, 297], Size.A4)).toBe(false);
		expect(isSameSize(undefined, Size.A4)).toBe(false);
	});
});

describe('isVectorFormat', () => {
	it('is true only for SVG and PDF', () => {
		expect(isVectorFormat('svg')).toBe(true);
		expect(isVectorFormat('pdf')).toBe(true);
		expect(isVectorFormat('png')).toBe(false);
	});
});

describe('sanitizeFileName', () => {
	it('drops the extension of the format and invalid characters', () => {
		expect(sanitizeFileName(' my/map.png ', 'png')).toBe('my_map');
		expect(sanitizeFileName('map.pdf', 'png')).toBe('map.pdf');
		expect(sanitizeFileName('   ', 'png')).toBe('map');
	});
});
