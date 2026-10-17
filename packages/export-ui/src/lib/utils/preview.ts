/** Wait after the last change before the preview is rendered again, so quick changes add up */
export const RENDER_DELAY_MS = 300;

/** The preview is rendered again when the frame grows by more than this ratio */
export const RESIZE_RENDER_RATIO = 1.25;

/** Lowest DPI the preview is rendered at, so that it never becomes unreadable */
const MIN_PREVIEW_DPI = 20;

/** Smallest zoom of the preview image (50%) */
export const PREVIEW_ZOOM_MIN = 0.5;

/** Largest zoom of the preview image (300%) */
export const PREVIEW_ZOOM_MAX = 3;

/** Zoom added or removed by the zoom buttons of the preview (10%) */
export const PREVIEW_ZOOM_STEP = 0.1;

/** Part of the page, in CSS pixels, which stays inside the preview pane when it is dragged */
const PREVIEW_PAN_MARGIN = 40;

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
	// pixels of the preview per inch of the page
	const dpi = (25.4 * frameWidth * pixelRatio) / pageWidth;
	return Math.min(Math.max(dpi, MIN_PREVIEW_DPI), maxDpi);
};

/**
 * Zoom of the preview after one click on the zoom in (`1`) or zoom out (`-1`) button.
 * It is rounded to the step so that floating point errors do not add up.
 */
export const stepPreviewZoom = (zoom: number, direction: 1 | -1) => {
	const steps = Math.round(zoom / PREVIEW_ZOOM_STEP) + direction;
	const next = Math.round(steps * PREVIEW_ZOOM_STEP * 100) / 100;
	return Math.min(Math.max(next, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX);
};

/**
 * Keep the dragged preview image partly inside the preview pane.
 * The page is centered in the frame and scaled around its center, so the offset may go up to
 * half of the scaled page plus half of the frame, minus the margin kept visible.
 * @param pan offset of the page from the center of the frame, in CSS pixels
 * @param pageSize `[width, height]` of the page before it is scaled, in CSS pixels
 * @param frameSize `[width, height]` of the frame, in CSS pixels
 * @param zoom zoom of the preview
 */
export const clampPreviewPan = (
	pan: { x: number; y: number },
	pageSize: [number, number],
	frameSize: [number, number],
	zoom: number
) => {
	const clamp = (value: number, page: number, frame: number) => {
		const max = Math.max((page * zoom + frame) / 2 - PREVIEW_PAN_MARGIN, 0);
		return Math.min(Math.max(value, -max), max);
	};
	return {
		x: clamp(pan.x, pageSize[0], frameSize[0]),
		y: clamp(pan.y, pageSize[1], frameSize[1])
	};
};
