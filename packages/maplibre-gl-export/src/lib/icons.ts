import {
	Check,
	Compass,
	Download,
	File,
	FileImage,
	FilePenLine,
	MoveHorizontal,
	Move,
	MoveVertical,
	Printer,
	Proportions,
	RectangleHorizontal,
	RectangleVertical,
	RulerDimensionLine,
	Type,
	VectorPolygon,
	X,
	createElement,
	type IconNode
} from 'lucide';

/** Lucide icons (https://lucide.dev/icons/) shown by default in the export dialog */
export const icons = {
	title: Printer,
	close: X,
	pageSize: File,
	customWidth: MoveHorizontal,
	customHeight: MoveVertical,
	landscape: RectangleHorizontal,
	portrait: RectangleVertical,
	format: FileImage,
	vector: VectorPolygon,
	vectorLabels: Type,
	dpi: Proportions,
	scalebar: RulerDimensionLine,
	northIcon: Compass,
	fileName: FilePenLine,
	save: Download,
	adjustArea: Move,
	done: Check
} satisfies Record<string, IconNode>;

/** Keys of the icons of the export dialog. They are used in the class names of the icons */
export type IconKey = keyof typeof icons;

/**
 * Create the icon element of the export dialog.
 *
 * The Lucide SVG is wrapped in `<span class="{prefix}-export-icon {prefix}-export-icon--{key}">`
 * so that an icon can be restyled or replaced from CSS (see the SCSS file).
 * @param key which icon to create
 * @param cssPrefix CSS class prefix of the underlying library
 */
export const createIcon = (key: IconKey, cssPrefix: string): HTMLSpanElement => {
	const span = document.createElement('span');
	span.className = `${cssPrefix}-export-icon ${cssPrefix}-export-icon--${key}`;
	span.setAttribute('aria-hidden', 'true');
	span.appendChild(createElement(icons[key], { 'aria-hidden': 'true' }));
	return span;
};
