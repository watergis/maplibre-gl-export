import { describe, expect, it } from 'vitest';
import { fitPageInViewport } from './printable-area-manager';

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
