import { describe, expect, it } from 'vitest';
import { imageName, tintSdf } from './pattern';
import { createContext } from './test-utils';

const pixels = (...alpha: number[]) => new Uint8Array(alpha.flatMap((a) => [9, 9, 9, a]));
const image = (sdf = false) => ({
	data: { width: 4, height: 2, data: pixels(0, 0, 0, 0, 255, 255, 255, 255) },
	pixelRatio: 2,
	sdf
});

describe('imageName', () => {
	it('reads a string, a resolved image and a cross-faded pair', () => {
		expect(imageName('dots')).toBe('dots');
		expect(imageName({ name: 'dots', available: true })).toBe('dots');
		expect(imageName({ from: { name: 'a' }, to: { name: 'b' } })).toBe('a');
		expect(imageName({ from: 'a', to: 'b' })).toBe('a');
		expect(imageName('')).toBeUndefined();
		expect(imageName(undefined)).toBeUndefined();
	});
});

describe('tintSdf', () => {
	it('draws the inside of the shape in the color and leaves the outside transparent', () => {
		const result = tintSdf(pixels(0, 255, 191), [10, 20, 30]);
		expect([...result.slice(0, 4)]).toEqual([10, 20, 30, 0]);
		expect([...result.slice(4, 8)]).toEqual([10, 20, 30, 255]);
		// the edge of the shape is half transparent
		expect(result[11]).toBeGreaterThan(100);
		expect(result[11]).toBeLessThan(160);
	});
});

describe('ImageRegistry', () => {
	it('defines an image once, in CSS pixels', () => {
		const ctx = createContext({ pin: image() });
		const first = ctx.images.image('pin');
		expect(first).toMatchObject({ width: 2, height: 1 });
		expect(ctx.images.image('pin')).toBe(first);
		expect(ctx.defs.querySelectorAll('image')).toHaveLength(1);
		expect(ctx.defs.querySelector('image')?.getAttribute('href')).toBe('data:test/4x2');
	});

	it('defines an SDF image once per color', () => {
		const ctx = createContext({ pin: image(true) });
		const red = ctx.images.image('pin', '#ff0000');
		expect(ctx.images.image('pin', '#ff0000')).toBe(red);
		expect(ctx.images.image('pin', '#0000ff')?.id).not.toBe(red?.id);
		expect(ctx.defs.querySelectorAll('image')).toHaveLength(2);
	});

	it('defines a pattern which repeats the image', () => {
		const ctx = createContext({ dots: image() });
		const id = ctx.images.pattern('dots');
		expect(ctx.images.pattern('dots')).toBe(id);
		const pattern = ctx.defs.querySelector('pattern');
		expect(pattern?.getAttribute('id')).toBe(id);
		expect(pattern?.getAttribute('width')).toBe('2');
		expect(pattern?.getAttribute('patternUnits')).toBe('userSpaceOnUse');
		expect(pattern?.querySelector('use')?.getAttribute('href')).toMatch(/^#image-/);
	});

	it('has nothing for an unknown image', () => {
		const ctx = createContext();
		expect(ctx.images.image('missing')).toBeUndefined();
		expect(ctx.images.pattern('missing')).toBeUndefined();
	});
});
