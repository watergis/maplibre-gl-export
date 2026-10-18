import { Format, type FormatType } from '../interfaces';

/** MIME type of each export format, offered to the save file picker */
export const MIME_TYPES: Record<FormatType, string> = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	pdf: 'application/pdf',
	svg: 'image/svg+xml',
	tif: 'image/tiff'
};

/** Whether the format can hold the map as vectors */
export const isVectorFormat = (format: string) => format === Format.SVG || format === Format.PDF;

/**
 * Clean a file name typed by the user: characters most file systems refuse are replaced,
 * and the extension of the selected format is dropped because it is appended on export.
 * Falls back to `map` when nothing is left.
 */
export const sanitizeFileName = (name: string, format: string) => {
	let fileName = name.trim().replace(/[\\/:*?"<>|]+/g, '_');
	const extension = `.${format}`;
	if (fileName.toLowerCase().endsWith(extension)) {
		fileName = fileName.slice(0, -extension.length);
	}
	return fileName.length > 0 ? fileName : 'map';
};
