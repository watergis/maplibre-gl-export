/*
 * North icons offered in the export dialog: the "compass" icons of Font-GIS
 * (https://viglino.github.io/font-gis/, Apache-2.0, by Jean-Marc Viglino), and the SVG files the
 * user chooses.
 */
import compassAlt from 'font-gis/svg/compass/uEB06-compass-alt.svg?raw';
import compassAltO from 'font-gis/svg/compass/uEB07-compass-alt-o.svg?raw';
import compassNeedle from 'font-gis/svg/compass/uEA91-compass-needle.svg?raw';
import compassRose from 'font-gis/svg/compass/uEA92-compass-rose.svg?raw';
import compassRoseN from 'font-gis/svg/compass/uEA93-compass-rose-n.svg?raw';
import compass from 'font-gis/svg/compass/uEA90-compass.svg?raw';
import northArrowN from 'font-gis/svg/compass/uEA8C-north-arrow-n.svg?raw';
import northArrow from 'font-gis/svg/compass/uEA8B-north-arrow.svg?raw';

export interface NorthIcon {
	/** name of the icon in Font-GIS, e.g. `north-arrow` */
	name: string;
	/** SVG source. It is filled with `currentColor`, see {@link applyNorthIconColor} */
	svg: string;
}

/**
 * Width of the north icon as a fraction of the page width (5%), when none is chosen.
 * The size slider of the dialog is relative to it: 100% is this width, 200% twice it.
 */
export const DEFAULT_NORTH_ICON_SIZE_FRACTION = 0.05;

/** Sizes of the north icon offered in the dialog, in % of the default size: 0% to 300% */
export const NORTH_ICON_SIZES = Array.from({ length: 31 }, (_, i) => i * 10);

/** Colour of the north icon when none is chosen */
export const DEFAULT_NORTH_ICON_COLOR = '#000000';

/** Width of the white outline drawn around the north icon, in the 100 × 100 box of the icon */
const HALO_WIDTH = 1.5;

/**
 * Turn an SVG of Font-GIS, as saved by Inkscape, into a small SVG which scales with its size:
 * the editor metadata is dropped, a `viewBox` is added, the shapes are filled with `currentColor`
 * and outlined in white so that the icon stays visible on a dark map.
 *
 * It works on the text of the SVG, without DOMParser, so that it runs outside of a browser too.
 * @param raw SVG of Font-GIS. Its icon is drawn in a 100 × 100 box
 */
export const normalizeNorthIconSvg = (raw: string) => {
	const body = raw
		// the content of the root element
		.replace(/^[\s\S]*?<svg\b[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		.replace(/<sodipodi:namedview\b[\s\S]*?(\/>|<\/sodipodi:namedview>)/g, '')
		.replace(/<metadata\b[\s\S]*?<\/metadata>/g, '')
		.replace(/<defs\b[^>]*\/>/g, '')
		.replace(/\s(sodipodi|inkscape):[\w-]+="[^"]*"/g, '')
		.replace(/\s(id|aria-label)="[^"]*"/g, '')
		// the colours are set by the groups below; only the fill rule is kept from the styles
		.replace(/\sstyle="([^"]*)"/g, (_, style: string) => {
			const fillRule = /(?:^|;)\s*fill-rule\s*:\s*(evenodd|nonzero)/.exec(style)?.[1];
			return fillRule ? ` fill-rule="${fillRule}"` : '';
		})
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.trim();
	return (
		'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
		`<g fill="none" stroke="#ffffff" stroke-width="${HALO_WIDTH}" stroke-linejoin="round">${body}</g>` +
		`<g fill="currentColor">${body}</g>` +
		'</svg>'
	);
};

/** Compass icons of Font-GIS, `north-arrow` first */
export const NORTH_ICONS: NorthIcon[] = Object.entries({
	'north-arrow': northArrow,
	'north-arrow-n': northArrowN,
	compass,
	'compass-needle': compassNeedle,
	'compass-rose': compassRose,
	'compass-rose-n': compassRoseN,
	'compass-alt': compassAlt,
	'compass-alt-o': compassAltO
}).map(([name, raw]) => ({ name, svg: normalizeNorthIconSvg(raw) }));

/** The north icon used when none is chosen: `north-arrow` of Font-GIS */
export const DEFAULT_NORTH_ICON = NORTH_ICONS[0].svg;

/**
 * Colour a north icon. `currentColor` is replaced by the colour itself rather than set through the
 * `color` attribute, because svg2pdf.js (vector PDF) does not resolve `currentColor`.
 * An SVG which does not use `currentColor` keeps its own colours.
 * @param svg SVG source of the icon
 * @param color CSS colour, e.g. `#ff0000`
 */
export const applyNorthIconColor = (svg: string, color = DEFAULT_NORTH_ICON_COLOR) =>
	svg.replace(/currentColor/g, color);

/**
 * Split a north icon into its icon and its colour, e.g. the `image` of the options which
 * {@link applyNorthIconColor} has coloured. A coloured icon of Font-GIS is turned back into the
 * icon of {@link NORTH_ICONS}, so that it can be coloured again; any other SVG is kept as it is.
 * @param svg SVG source of the north icon
 */
export const readNorthIcon = (svg: string): { image: string; color: string } => {
	for (const icon of NORTH_ICONS) {
		const [before, after] = icon.svg.split('currentColor');
		if (
			svg.length > before.length + after.length &&
			svg.startsWith(before) &&
			svg.endsWith(after)
		) {
			const color = svg.slice(before.length, svg.length - after.length);
			if (!/["<>]/.test(color)) return { image: icon.svg, color };
		}
	}
	return { image: svg, color: DEFAULT_NORTH_ICON_COLOR };
};

/**
 * Check an SVG file chosen by the user and prepare it to be used as the north icon.
 * Scripts and event handlers are removed, and a `viewBox` is added from the width and height
 * when there is none so that the icon scales with its size.
 * @param text content of the file
 * @returns the SVG source, or undefined when the file is not an SVG
 */
export const readCustomNorthIcon = (text: string) => {
	const svg = text
		.replace(/<\?xml[\s\S]*?\?>/g, '')
		.replace(/<!DOCTYPE[^>[]*(\[[\s\S]*?\])?\s*>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<script\b[\s\S]*?(<\/script>|\/>)/gi, '')
		.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
		.trim();
	const root = /^<svg\b[^>]*>/i.exec(svg)?.[0];
	if (!root || !/<\/svg>$|^<svg\b[^>]*\/>$/i.test(svg)) return undefined;
	if (/\sviewBox\s*=/i.test(root)) return svg;

	const length = (name: string) => {
		const value = new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, 'i').exec(root);
		return value ? Number(value[1]) : undefined;
	};
	const width = length('width');
	const height = length('height');
	if (!width || !height) return svg;
	return svg.replace(/^<svg\b/i, `<svg viewBox="0 0 ${width} ${height}"`);
};
