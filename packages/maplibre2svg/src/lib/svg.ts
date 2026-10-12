export const SVG_NS = 'http://www.w3.org/2000/svg';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export type Attrs = Record<string, string | number | undefined>;

/** Format a number for an SVG attribute, rounded to 2 decimals */
export function fmt(value: number) {
	const rounded = Math.round(value * 100) / 100;
	return Object.is(rounded, -0) ? '0' : String(rounded);
}

export function setAttrs(node: Element, attrs: Attrs) {
	for (const [name, value] of Object.entries(attrs)) {
		if (value === undefined) continue;
		const text = typeof value === 'number' ? fmt(value) : value;
		if (name === 'href') {
			// `xlink:href` is still what most editors and converters read
			node.setAttributeNS(XLINK_NS, 'xlink:href', text);
		}
		node.setAttribute(name, text);
	}
}

/** Create an SVG element */
export function el(doc: Document, name: string, attrs: Attrs = {}, children: Node[] = []) {
	const node = doc.createElementNS(SVG_NS, name) as SVGElement;
	setAttrs(node, attrs);
	for (const child of children) node.appendChild(child);
	return node;
}

/** Turn an arbitrary string, such as a layer id, into a valid XML id */
export function toId(value: string) {
	const id = value.replace(/[^A-Za-z0-9_.-]/g, '_');
	return /^[A-Za-z_]/.test(id) ? id : `_${id}`;
}

/**
 * Move the attributes which all of the items share to `parent`, so that they are
 * written once per layer instead of once per feature.
 */
export function hoistCommonAttrs(parent: Element, items: Attrs[], exclude: string[] = []) {
	if (items.length < 2) return;
	const [first, ...rest] = items;
	for (const [name, value] of Object.entries(first)) {
		if (value === undefined || exclude.includes(name)) continue;
		if (!rest.every((attrs) => attrs[name] === value)) continue;
		setAttrs(parent, { [name]: value });
		for (const attrs of items) delete attrs[name];
	}
}

/** Serialize the SVG element as a standalone SVG document */
export function svgToString(svg: Element) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
}
