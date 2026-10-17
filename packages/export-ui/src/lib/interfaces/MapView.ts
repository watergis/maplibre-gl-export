/**
 * Camera of the exported map. It lets the map be exported from a different view than the one
 * the source map currently shows, such as the area chosen in the preview of the export dialog.
 */
export interface MapView {
	/** `[longitude, latitude]` of the center of the page */
	center: [number, number];
	/** zoom level of the page when it is laid out at 96 DPI */
	zoom: number;
	bearing: number;
	pitch: number;
}
