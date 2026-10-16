export const Format = {
	JPEG: 'jpg',
	PNG: 'png',
	WEBP: 'webp',
	PDF: 'pdf',
	SVG: 'svg',
	GEOTIFF: 'tif'
} as const;
export type FormatType = (typeof Format)[keyof typeof Format];
