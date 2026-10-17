import type { FormatType } from './Format';
import type { MapView } from './MapView';
import type { PageOrientationType } from './PageOrientation';
import type { SizeType } from './Size';
import type { Translation } from './Translation';

/** What the user chose in the dialog. It is kept by the control so reopening restores it */
export interface ExportDialogState {
	/** value of the page size `<select>`: a JSON `[long, short]` tuple or `'custom'` */
	sizeValue: string;
	orientation: PageOrientationType;
	/** width of the custom page size in mm */
	customWidth: number;
	/** height of the custom page size in mm */
	customHeight: number;
	format: FormatType;
	dpi: number;
	scalebar: boolean;
	northIcon: boolean;
	vector: boolean;
	vectorLabels: boolean;
	/** file name without extension */
	fileName: string;
}

/** Everything needed to export the map, handed to `onSave` */
export interface ExportSettings {
	/** `[width, height]` of the page in mm */
	size: [number, number];
	dpi: number;
	format: FormatType;
	/** file name without extension */
	fileName: string;
	scalebar: boolean;
	northIcon: boolean;
	vector: boolean;
	vectorLabels: boolean;
	/** camera of the exported map, as chosen in the preview */
	view: MapView;
	/** file chosen with the save file picker. The file is downloaded when it is not set */
	fileHandle?: FileSystemFileHandle;
}

export interface ExportDialogOptions {
	/** map the user is looking at. Its view is the initial view of the preview */
	map: {
		getCenter(): { lng: number; lat: number };
		getZoom(): number;
		getBearing(): number;
		getPitch(): number;
	};
	/** CSS class prefix of the underlying library */
	cssPrefix: string;
	translation: Translation;
	/** page sizes offered in the dropdown, `label -> [long, short]` in mm */
	sizes: Record<string, SizeType>;
	state: ExportDialogState;
	/**
	 * Render the image of the preview: the image exported with `settings`, at `dpi` (lower than
	 * the DPI of the export so that it is fast to render).
	 */
	renderPreview: (settings: ExportSettings, dpi: number) => Promise<HTMLCanvasElement>;
	/**
	 * Let the user adjust the exported area on the map itself, starting from `view`.
	 * It resolves to the adjusted view, or `null` when the user cancelled.
	 */
	adjustArea: (view: MapView, pageSize: [number, number]) => Promise<MapView | null>;
	/**
	 * Whether Save asks where to save the file with the save file picker of the browser
	 * (File System Access API), where it is available. The file is downloaded otherwise.
	 */
	useSaveFilePicker: boolean;
	/** export the map. It resolves to whether the map was exported */
	onSave: (settings: ExportSettings) => Promise<boolean>;
	/** called once the dialog has been closed, with the last state of the form */
	onClose?: (state: ExportDialogState) => void;
}

/** `window.showSaveFilePicker` of the File System Access API, which is not in lib.dom yet */
export type ShowSaveFilePicker = (options?: {
	suggestedName?: string;
	types?: { description?: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;
