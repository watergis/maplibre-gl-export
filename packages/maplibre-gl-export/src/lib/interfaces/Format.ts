export const Format = {
	JPEG: 'jpg',
	PNG: 'png',
	PDF: 'pdf',
	SVG: 'svg',
	GEOTIFF: 'tif'
} as const;
export type FormatType = (typeof Format)[keyof typeof Format];
