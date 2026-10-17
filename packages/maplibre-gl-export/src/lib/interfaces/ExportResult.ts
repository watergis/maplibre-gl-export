import { FormatType } from '@watergis/export-ui';

/** Exported image, handed to the `onExport` callback */
export interface ExportResult {
	/** composed image of the map. It is discarded once the callback has returned */
	canvas: HTMLCanvasElement;
	/** exported image in the requested format */
	blob: Blob;
	/** file name the image would be saved as, including the extension */
	fileName: string;
	/** format the image was exported in */
	format: FormatType;
	/**
	 * source of the SVG holding the map as vectors. It is only set when
	 * `svgVectorOptions.enabled` is true, the format is SVG or PDF and the map could be converted.
	 */
	svg?: string;
}
