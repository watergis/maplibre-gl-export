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

/** Draw the attribution as text on a translucent box, like the attribution control */
export function createAttributionOverlay(text: string, box: OverlayBox) {
	const fontSize = 12;
	const group = create('g', { 'data-overlay': 'attribution' });
	group.appendChild(create('rect', { ...box, fill: '#ffffff', 'fill-opacity': 0.5 }));
	group.appendChild(
		create(
			'text',
			{
				x: box.x + PADDING,
				y: box.y + box.height / 2 + fontSize * 0.35,
				'font-family': FONT_FAMILY,
				'font-size': fontSize,
				fill: '#000000',
				'fill-opacity': 0.75
			},
			text
		)
	);
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
