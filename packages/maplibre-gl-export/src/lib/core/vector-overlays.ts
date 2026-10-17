const SVG_NS = 'http://www.w3.org/2000/svg';

/** Box of an overlay in CSS pixels of the map */
export interface OverlayBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

const FONT_FAMILY = "'Helvetica Neue', Arial, Helvetica, sans-serif";

/** Horizontal padding of the attribution and scale controls */
const PADDING = 5;

function create(name: string, attrs: Record<string, string | number>, text?: string) {
	const node = document.createElementNS(SVG_NS, name);
	for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
	if (text !== undefined) node.textContent = text;
	return node;
}

/**
 * Split the text of an element into the lines it is wrapped into by the browser, so that
 * the SVG text can be wrapped the same way.
 */
export function getWrappedLines(element: HTMLElement) {
	const lines: { top: number; words: string[] }[] = [];
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const content = node.textContent ?? '';
		const regex = /\S+/g;
		for (let match = regex.exec(content); match; match = regex.exec(content)) {
			range.setStart(node, match.index);
			range.setEnd(node, match.index + match[0].length);
			const top = range.getBoundingClientRect().top;
			const last = lines[lines.length - 1];
			// words at the same height as the current line belong to it, others start a new line
			if (last && Math.abs(top - last.top) < 1) last.words.push(match[0]);
			else lines.push({ top, words: [match[0]] });
		}
	}
	return lines.map((line) => line.words.join(' '));
}

/** Draw the attribution as lines of text on a translucent box, like the attribution control */
export function createAttributionOverlay(lines: string[], box: OverlayBox) {
	const fontSize = 12;
	const lineHeight = box.height / Math.max(lines.length, 1);
	const group = create('g', { 'data-overlay': 'attribution' });
	group.appendChild(create('rect', { ...box, fill: '#ffffff', 'fill-opacity': 0.5 }));
	const text = create('text', {
		'font-family': FONT_FAMILY,
		'font-size': fontSize,
		fill: '#000000',
		'fill-opacity': 0.75
	});
	lines.forEach((line, i) => {
		text.appendChild(
			create(
				'tspan',
				{
					x: box.x + PADDING,
					y: box.y + lineHeight * (i + 0.5) + fontSize * 0.35
				},
				line
			)
		);
	});
	group.appendChild(text);
	return group as SVGGElement;
}

/** Draw the scale bar as the scale control draws it: a box which is open at the top */
export function createScalebarOverlay(text: string, box: OverlayBox) {
	const border = 2;
	const fontSize = 10;
	const { x, y, width, height } = box;
	const group = create('g', { 'data-overlay': 'scalebar' });
	group.appendChild(create('rect', { ...box, fill: '#ffffff', 'fill-opacity': 0.75 }));
	group.appendChild(
		create('path', {
			// the stroke is kept inside of the box
			d: `M${x + border / 2} ${y}V${y + height - border / 2}H${x + width - border / 2}V${y}`,
			fill: 'none',
			stroke: '#333333',
			'stroke-width': border
		})
	);
	group.appendChild(
		create(
			'text',
			{
				x: x + border + PADDING,
				y: y + (height - border) / 2 + fontSize * 0.35,
				'font-family': FONT_FAMILY,
				'font-size': fontSize,
				fill: '#333333'
			},
			text
		)
	);
	return group as SVGGElement;
}

/**
 * Draw the north icon from its SVG source, rotated to match the map bearing.
 * @returns undefined when the source is not a valid SVG
 */
export function createNorthIconOverlay(source: string, box: OverlayBox, bearing: number) {
	const icon = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
	if (icon.nodeName.toLowerCase() !== 'svg') return undefined;

	const imported = document.importNode(icon, true);
	imported.setAttribute('x', String(box.x));
	imported.setAttribute('y', String(box.y));
	imported.setAttribute('width', String(box.width));
	imported.setAttribute('height', String(box.height));

	const group = create('g', {
		'data-overlay': 'north-icon',
		// the map is rotated clockwise by `bearing`, so north sits counter-clockwise by the same angle
		transform: `rotate(${-bearing} ${box.x + box.width / 2} ${box.y + box.height / 2})`
	});
	group.appendChild(imported);
	return group as SVGGElement;
}
