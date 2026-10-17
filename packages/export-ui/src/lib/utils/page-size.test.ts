import { describe, expect, it, vi } from 'vitest';
import { isSameSize, orientSize, resolveAllowedSizes } from './page-size';
import { Size } from '../interfaces';

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
