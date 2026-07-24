import { FormatType } from './Format';

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
}
