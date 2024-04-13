export const Format = {
	JPEG: 'jpg',
	PNG: 'png',
	PDF: 'pdf',
	SVG: 'svg'
} as const;
export type FormatType = (typeof Format)[keyof typeof Format];
