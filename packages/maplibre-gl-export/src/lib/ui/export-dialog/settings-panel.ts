import {
	Compass,
	File,
	FileImage,
	FilePenLine,
	MoveHorizontal,
	MoveVertical,
	Proportions,
	RectangleHorizontal,
	RectangleVertical,
	RulerDimensionLine,
	Type,
	VectorPolygon,
	type IconNode
} from 'lucide';
import {
	DPI,
	Format,
	PageOrientation,
	type ExportDialogState,
	type ExportSettings,
	type FormatType,
	type MapView,
	type PageOrientationType,
	type SizeType,
	type Translation
} from '../../interfaces';
import {
	cls,
	createField,
	createInputGroup,
	createSegmentedButton,
	createSelect,
	createSlider,
	createSwitch,
	el
} from '../components';
import { CUSTOM_SIZE_VALUE, orientSize } from '../page-size';

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

/**
 * Read the selected page size as a `[width, height]` mm tuple, or `null` when the custom
 * size is not a pair of positive numbers.
 */
export const readPageSize = (state: ExportDialogState): [number, number] | null => {
	if (state.sizeValue === CUSTOM_SIZE_VALUE) {
		const { customWidth: width, customHeight: height } = state;
		if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
			return null;
		}
		return [width, height];
	}
	try {
		return orientSize(JSON.parse(state.sizeValue) as SizeType, state.orientation);
	} catch {
		return null;
	}
};

export interface SettingsPanelOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	/** prefix of the ids and names of the form elements, unique to the dialog */
	idPrefix: string;
	translation: Translation;
	/** page sizes offered in the dropdown, `label -> [long, short]` in mm */
	sizes: Record<string, SizeType>;
	/** state of the dialog. It is changed in place as the user edits the settings */
	state: ExportDialogState;
	/** the page size or orientation changed to a valid `[width, height]` in mm */
	onPageLayoutChange: (size: [number, number]) => void;
	/** a setting shown in the preview changed */
	onRenderChange: () => void;
}

/** Right column of the export dialog: the form of the export settings */
export default class SettingsPanel {
	public readonly element: HTMLFormElement;

	private options: SettingsPanelOptions;

	private customFields: HTMLElement[];

	private customWidth: HTMLInputElement;

	private customHeight: HTMLInputElement;

	private orientationField: HTMLElement;

	private vectorField: HTMLElement;

	private vectorLabelsField: HTMLElement;

	private fileName!: HTMLInputElement;

	private fileExtension!: HTMLElement;

	constructor(options: SettingsPanelOptions) {
		this.options = options;
		const { prefix, state } = options;
		const t = options.translation;

		this.element = el('form', cls(prefix, 'dialog__settings'));
		this.element.addEventListener('submit', (event) => event.preventDefault());

		// page size
		const sizeOptions = Object.entries(options.sizes).map(([label, size]) => ({
			label,
			value: JSON.stringify(size)
		}));
		sizeOptions.push({ label: t.Custom, value: CUSTOM_SIZE_VALUE });
		const pageSize = createSelect({
			prefix,
			id: this.id('page-size'),
			name: 'page-size',
			options: sizeOptions,
			value: state.sizeValue,
			onChange: (value) => this.onPageSizeChange(value)
		});
		const pageSizeField = this.field('pageSize', File, t.PageSize, pageSize, pageSize.id);

		// custom width / height
		const width = this.createSizeInput('custom-width', state.customWidth, (value) => {
			state.customWidth = value;
			this.onPageLayoutChange();
		});
		const height = this.createSizeInput('custom-height', state.customHeight, (value) => {
			state.customHeight = value;
			this.onPageLayoutChange();
		});
		this.customWidth = width.input;
		this.customHeight = height.input;
		this.customFields = [
			this.field('customWidth', MoveHorizontal, t.Width, width.element, width.input.id, [
				'custom-size'
			]),
			this.field('customHeight', MoveVertical, t.Height, height.element, height.input.id, [
				'custom-size'
			])
		];

		// orientation
		const orientation = createSegmentedButton<PageOrientationType>({
			prefix,
			name: this.id('orientation'),
			label: t.PageOrientation,
			choices: [
				{ value: PageOrientation.Landscape, icon: RectangleHorizontal, label: t.Landscape },
				{ value: PageOrientation.Portrait, icon: RectangleVertical, label: t.Portrait }
			],
			value: state.orientation,
			onChange: (value) => {
				state.orientation = value;
				this.onPageLayoutChange();
			}
		});
		this.orientationField = this.field(
			'landscape',
			RectangleHorizontal,
			t.PageOrientation,
			orientation,
			undefined,
			['orientation']
		);

		// format
		const format = createSegmentedButton<FormatType>({
			prefix,
			name: this.id('format'),
			label: t.Format,
			choices: Object.entries(Format).map(([label, value]) => ({ label, value })),
			value: state.format,
			compact: true,
			onChange: (value) => {
				state.format = value;
				this.syncFormat();
			}
		});
		const formatField = this.field('format', FileImage, t.Format, format);

		// vector export, only for SVG and PDF
		this.vectorField = this.switchField(
			'vector',
			VectorPolygon,
			t.ExportAsVector,
			'vector',
			state.vector,
			(checked) => {
				state.vector = checked;
				this.syncFormat();
			}
		);
		this.vectorLabelsField = this.switchField(
			'vectorLabels',
			Type,
			t.ExportLabelsAsVector,
			'vector-labels',
			state.vectorLabels,
			(checked) => {
				state.vectorLabels = checked;
			}
		);

		this.element.append(
			pageSizeField,
			...this.customFields,
			this.orientationField,
			formatField,
			this.vectorField,
			this.vectorLabelsField,
			this.createDpiField(),
			// overlays
			this.switchField(
				'scalebar',
				RulerDimensionLine,
				t.Scalebar,
				'scalebar',
				state.scalebar,
				(checked) => {
					state.scalebar = checked;
					options.onRenderChange();
				}
			),
			this.switchField(
				'northIcon',
				Compass,
				t.NorthIcon,
				'north-icon',
				state.northIcon,
				(checked) => {
					state.northIcon = checked;
					options.onRenderChange();
				}
			),
			this.createFileNameField()
		);

		this.syncPageSizeFields();
		this.syncFormat();
	}

	/** {@link readPageSize} of the current state */
	public readPageSize() {
		return readPageSize(this.options.state);
	}

	/** Show why the custom size is invalid */
	public reportValidity() {
		this.customWidth.reportValidity();
		this.customHeight.reportValidity();
	}

	/** Set the file name, e.g. the one chosen in the save file picker */
	public setFileName(name: string) {
		const fileName = sanitizeFileName(name, this.options.state.format);
		this.options.state.fileName = fileName;
		this.fileName.value = fileName;
	}

	/** Everything needed to export the map with the current settings */
	public getSettings(
		size: [number, number],
		view: MapView,
		fileHandle?: FileSystemFileHandle
	): ExportSettings {
		const { state } = this.options;
		return {
			size,
			dpi: state.dpi,
			format: state.format,
			fileName: sanitizeFileName(state.fileName, state.format),
			scalebar: state.scalebar,
			northIcon: state.northIcon,
			vector: isVectorFormat(state.format) && state.vector,
			vectorLabels: state.vectorLabels,
			view,
			fileHandle
		};
	}

	private id(name: string) {
		return `${this.options.idPrefix}-${name}`;
	}

	private field(
		name: string,
		icon: IconNode,
		label: string,
		control: HTMLElement,
		id?: string,
		modifiers?: string[],
		value?: HTMLElement
	) {
		return createField({
			prefix: this.options.prefix,
			name,
			icon,
			label,
			control,
			id,
			modifiers,
			value
		});
	}

	/** A switch in a field row */
	private switchField(
		name: string,
		icon: IconNode,
		label: string,
		id: string,
		checked: boolean,
		onChange: (checked: boolean) => void
	) {
		const input = createSwitch({
			prefix: this.options.prefix,
			id: this.id(id),
			name: id,
			checked,
			onChange
		});
		return this.field(name, icon, label, input, input.id, ['switch']);
	}

	/** A number input in mm, used for the custom page size */
	private createSizeInput(id: string, value: number, onInput: (value: number) => void) {
		return createInputGroup({
			prefix: this.options.prefix,
			id: this.id(id),
			name: id,
			type: 'number',
			value: String(value),
			addon: 'mm',
			onInput: (value) => onInput(Number(value))
		});
	}

	/** Slider snapping to the DPI presets */
	private createDpiField() {
		const { state } = this.options;
		const values: number[] = Object.values(DPI);
		if (!values.includes(state.dpi)) values.push(state.dpi);
		values.sort((a, b) => a - b);
		const slider = createSlider({
			prefix: this.options.prefix,
			id: this.id('dpi'),
			name: 'dpi',
			values,
			value: state.dpi,
			valueText: (value) => `${value} DPI`,
			onChange: (value) => {
				state.dpi = value;
			}
		});
		return this.field(
			'dpi',
			Proportions,
			this.options.translation.DPI,
			slider.element,
			slider.input.id,
			undefined,
			slider.readout
		);
	}

	private createFileNameField() {
		const { state } = this.options;
		const fileName = createInputGroup({
			prefix: this.options.prefix,
			id: this.id('file-name'),
			name: 'file-name',
			type: 'text',
			value: state.fileName,
			onInput: (value) => {
				state.fileName = value;
			},
			onChange: (value) => this.setFileName(value)
		});
		this.fileName = fileName.input;
		this.fileExtension = fileName.addon;
		return this.field(
			'fileName',
			FilePenLine,
			this.options.translation.FileName,
			fileName.element,
			fileName.input.id
		);
	}

	/** Show the rows which apply to the selected format */
	private syncFormat() {
		const { state } = this.options;
		const vectorFormat = isVectorFormat(state.format);
		this.vectorField.hidden = !vectorFormat;
		this.vectorLabelsField.hidden = !vectorFormat || !state.vector;
		this.fileExtension.textContent = `.${state.format}`;
	}

	private onPageSizeChange(value: string) {
		const { state } = this.options;
		if (value === CUSTOM_SIZE_VALUE && state.sizeValue !== CUSTOM_SIZE_VALUE) {
			// start from the size the user was just looking at
			const size = this.readPageSize();
			if (size) {
				state.customWidth = size[0];
				state.customHeight = size[1];
				this.customWidth.value = String(size[0]);
				this.customHeight.value = String(size[1]);
			}
		}
		state.sizeValue = value;
		this.syncPageSizeFields();
		this.onPageLayoutChange();
	}

	/**
	 * Show the width/height inputs only for the "Custom" entry. Orientation is meaningless then
	 * because the two inputs already define both dimensions, so its row is hidden.
	 */
	private syncPageSizeFields() {
		const isCustom = this.options.state.sizeValue === CUSTOM_SIZE_VALUE;
		this.customFields.forEach((field) => (field.hidden = !isCustom));
		this.orientationField.hidden = isCustom;
	}

	private onPageLayoutChange() {
		const size = this.readPageSize();
		if (size) this.options.onPageLayoutChange(size);
	}
}
