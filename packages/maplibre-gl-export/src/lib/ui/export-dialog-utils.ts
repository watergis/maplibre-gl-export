import {
	Format,
	PageOrientation,
	Size,
	type AllowedSize,
	type CustomSize,
	type FormatType,
	type PageOrientationType,
	type SizeType
} from '../interfaces';

/**
 * Sentinel value of the page-size `<select>` option that switches the dialog to the
 * user-entered custom width/height inputs. It is intentionally not valid JSON so it can
 * never be confused with a serialized `[width, height]` preset tuple.
 */
export const CUSTOM_SIZE_VALUE = 'custom';

/** Number of CSS pixels in a millimeter at 96 DPI, which is the layout resolution of the page */
const PX_PER_MM = 96 / 25.4;

/** Width or height of the page in CSS pixels when it is laid out at 96 DPI */
export const mmToPx = (mm: number) => mm * PX_PER_MM;

/** Lowest DPI the preview is rendered at, so that it never becomes unreadable */
const MIN_PREVIEW_DPI = 20;

/**
 * Zoom level of the exported map which shows the same area as a frame of `frameWidth` pixels on
 * a map at `mapZoom`.
 *
 * The exported map is laid out at 96 DPI, so it is `mmToPx(pageWidth)` pixels wide. Every zoom
 * level doubles the width in pixels of the same area, so the difference of the two zoom levels
 * is the log2 of the ratio of the widths.
 * @param mapZoom zoom level of the map the frame is drawn on
 * @param pageWidth width of the page in mm
 * @param frameWidth width of the frame in CSS pixels
 */
export const toExportZoom = (mapZoom: number, pageWidth: number, frameWidth: number) =>
	mapZoom + Math.log2(mmToPx(pageWidth) / frameWidth);

/** Inverse of {@link toExportZoom} */
export const toMapZoom = (exportZoom: number, pageWidth: number, frameWidth: number) =>
	exportZoom - Math.log2(mmToPx(pageWidth) / frameWidth);

/**
 * Size of the largest rectangle with the ratio of the page which fits in the viewport.
 * @param viewportWidth width of the viewport in CSS pixels
 * @param viewportHeight height of the viewport in CSS pixels
 * @param pageWidth width of the page in mm
 * @param pageHeight height of the page in mm
 * @param padding space kept free on every side, in CSS pixels
 */
export const fitPageInViewport = (
	viewportWidth: number,
	viewportHeight: number,
	pageWidth: number,
	pageHeight: number,
	padding = 0
) => {
	const width = Math.max(viewportWidth - padding * 2, 1);
	const height = Math.max(viewportHeight - padding * 2, 1);
	const scale = Math.min(width / pageWidth, height / pageHeight);
	return { width: pageWidth * scale, height: pageHeight * scale };
};

/**
 * DPI at which the preview is rendered so that its pixels match the frame it is shown in.
 *
 * The page is laid out at 96 DPI whatever DPI is chosen, so the preview rendered at this DPI is
 * the exported image with fewer pixels. It never exceeds the DPI of the export.
 * @param pageWidth width of the page in mm
 * @param frameWidth width of the preview in CSS pixels
 * @param pixelRatio device pixel ratio of the screen
 * @param maxDpi DPI of the export
 */
export const getPreviewDpi = (
	pageWidth: number,
	frameWidth: number,
	pixelRatio: number,
	maxDpi: number
) => {
	const dpi = (96 * frameWidth * pixelRatio) / mmToPx(pageWidth);
	return Math.min(Math.max(dpi, MIN_PREVIEW_DPI), maxDpi);
};

/**
 * Turn a `[long, short]` page size (the order the presets are stored in) into the
 * `[width, height]` of the page in the given orientation.
 */
export const orientSize = (
	size: SizeType,
	orientation: PageOrientationType | string
): [number, number] =>
	orientation === PageOrientation.Portrait ? [size[1], size[0]] : [size[0], size[1]];

/** Whether a developer-defined page size has a name and two positive dimensions */
export const isValidCustomSize = (customSize: CustomSize): boolean => {
	if (typeof customSize?.name !== 'string' || customSize.name.length === 0) {
		return false;
	}
	const size = customSize.size;
	return (
		Array.isArray(size) &&
		size.length === 2 &&
		size.every((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)
	);
};

/**
 * Resolve the `AllowedSizes` option into the `label -> [width, height]` map backing the
 * page size dropdown. Entries are either a preset name or a developer-defined
 * `{ name, size }` pair; invalid entries are skipped so a single bad entry cannot break
 * the dialog. Falls back to every preset when nothing valid is left.
 */
export const resolveAllowedSizes = (allowedSizes?: AllowedSize[]): Record<string, SizeType> => {
	const sizes: Record<string, SizeType> = {};
	allowedSizes?.forEach((allowedSize) => {
		let name: string;
		let size: SizeType;
		if (typeof allowedSize === 'string') {
			const dimensions = Size[allowedSize];
			if (!dimensions) {
				return;
			}
			name = allowedSize;
			size = dimensions;
		} else {
			if (!isValidCustomSize(allowedSize)) {
				console.warn('maplibre-gl-export: ignoring invalid AllowedSizes entry', allowedSize);
				return;
			}
			name = allowedSize.name;
			size = allowedSize.size;
		}
		// first entry wins so the dropdown never shows the same label twice
		if (name in sizes) {
			return;
		}
		sizes[name] = size;
	});
	if (Object.keys(sizes).length === 0) {
		return { ...Size };
	}
	return sizes;
};

/** Whether two page sizes are equal by value */
export const isSameSize = (a: SizeType | undefined, b: SizeType | undefined) =>
	!!a && !!b && a.length === b.length && a.every((item, index) => item === b[index]);

/** Whether the format can hold the map as vectors */
export const isVectorFormat = (format: string) => format === Format.SVG || format === Format.PDF;

/** MIME type of each export format, offered to the save file picker */
export const MIME_TYPES: Record<FormatType, string> = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	pdf: 'application/pdf',
	svg: 'image/svg+xml',
	tif: 'image/tiff'
};

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
