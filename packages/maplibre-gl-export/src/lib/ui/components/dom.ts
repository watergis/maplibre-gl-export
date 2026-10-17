import { createElement, type IconNode } from 'lucide';

/** Create an element with an optional class name and text */
export const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string
): HTMLElementTagNameMap[K] => {
	const element = document.createElement(tag);
	if (className) element.className = className;
	if (text !== undefined) element.textContent = text;
	return element;
};

/** Class name of an element of the dialog: `{prefix}-export-{name}` */
export const cls = (prefix: string, name: string) => `${prefix}-export-${name}`;

/**
 * Create a Lucide icon (https://lucide.dev/icons/).
 *
 * The SVG is wrapped in `<span class="{prefix}-export-icon {prefix}-export-icon--{name}">`
 * so that an icon can be restyled or replaced from CSS (see the SCSS file).
 * @param prefix CSS class prefix of the underlying library
 * @param icon Lucide icon
 * @param name used in the class name of the icon
 */
export const createIcon = (prefix: string, icon: IconNode, name: string): HTMLSpanElement => {
	const span = el('span', `${cls(prefix, 'icon')} ${cls(prefix, `icon--${name}`)}`);
	span.setAttribute('aria-hidden', 'true');
	span.appendChild(createElement(icon, { 'aria-hidden': 'true' }));
	return span;
};
