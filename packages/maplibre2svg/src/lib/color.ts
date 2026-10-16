export interface CssColor {
	/** opaque color, e.g. `#ff0000` */
	color: string;
	/** alpha of the color, 0..1 */
	opacity: number;
}

const toHex = (value: number) =>
	Math.max(0, Math.min(255, Math.round(value)))
		.toString(16)
		.padStart(2, '0');

const rgb = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

function parseString(value: string): CssColor {
	const text = value.trim();
	const hex = /^#([0-9a-f]{3,8})$/i.exec(text)?.[1];
	if (hex && (hex.length === 4 || hex.length === 8)) {
		const full = hex.length === 4 ? [...hex].map((c) => c + c).join('') : hex;
		return { color: `#${full.slice(0, 6)}`, opacity: parseInt(full.slice(6), 16) / 255 };
	}
	const fn = /^rgba?\(([^)]+)\)$/i.exec(text);
	if (fn) {
		const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
		const channel = (part: string) =>
			part.endsWith('%') ? (parseFloat(part) * 255) / 100 : parseFloat(part);
		const alpha = parts[3];
		return {
			color: rgb(channel(parts[0]), channel(parts[1]), channel(parts[2])),
			opacity:
				alpha === undefined ? 1 : alpha.endsWith('%') ? parseFloat(alpha) / 100 : parseFloat(alpha)
		};
	}
	// named colors, hsl() and the like are valid in SVG as they are
	return { color: text, opacity: text === 'transparent' ? 0 : 1 };
}

/**
 * Convert a color of the style to an opaque CSS color and its alpha.
 *
 * Evaluated properties hold the color as an object with `r`, `g`, `b` premultiplied by `a`
 * (all 0..1). Colors which were not evaluated are plain CSS strings.
 */
export function toCssColor(value: unknown, fallback = '#000000'): CssColor {
	if (typeof value === 'string') return parseString(value);
	if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
		const { r, g, b, a = 1 } = value as { r: number; g: number; b: number; a?: number };
		if (a <= 0) return { color: '#000000', opacity: 0 };
		return { color: rgb((r / a) * 255, (g / a) * 255, (b / a) * 255), opacity: a };
	}
	return parseString(fallback);
}
