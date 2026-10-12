import { describe, expect, it } from 'vitest';
import { toCssColor } from './color';

describe('toCssColor', () => {
	it('un-premultiplies an evaluated color', () => {
		expect(toCssColor({ r: 0.5, g: 0, b: 0, a: 0.5 })).toEqual({ color: '#ff0000', opacity: 0.5 });
		expect(toCssColor({ r: 0, g: 0.2, b: 1, a: 1 })).toEqual({ color: '#0033ff', opacity: 1 });
	});

	it('treats a fully transparent color as invisible', () => {
		expect(toCssColor({ r: 0, g: 0, b: 0, a: 0 }).opacity).toBe(0);
		expect(toCssColor('transparent').opacity).toBe(0);
	});

	it('splits the alpha off CSS strings', () => {
		expect(toCssColor('rgba(255, 0, 0, 0.25)')).toEqual({ color: '#ff0000', opacity: 0.25 });
		expect(toCssColor('rgb(0 128 255 / 50%)')).toEqual({ color: '#0080ff', opacity: 0.5 });
		expect(toCssColor('#11223380')).toEqual({ color: '#112233', opacity: 128 / 255 });
		expect(toCssColor('#f00')).toEqual({ color: '#f00', opacity: 1 });
		expect(toCssColor('hsl(10, 50%, 50%)')).toEqual({ color: 'hsl(10, 50%, 50%)', opacity: 1 });
	});

	it('falls back to the default of the style specification', () => {
		expect(toCssColor(undefined)).toEqual({ color: '#000000', opacity: 1 });
		expect(toCssColor(null, '#ffffff')).toEqual({ color: '#ffffff', opacity: 1 });
	});
});
