import { describe, expect, it } from 'vitest';
import { isVectorFormat, sanitizeFileName } from './settings-panel';

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
