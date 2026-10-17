import {
	CUSTOM_SIZE_VALUE,
	MIME_TYPES,
	PREVIEW_ZOOM_MAX,
	PREVIEW_ZOOM_MIN,
	clampPreviewPan,
	getPreviewDpi,
	isVectorFormat,
	orientSize,
	sanitizeFileName,
	stepPreviewZoom
} from './export-dialog-utils';
import {
	Compass,
	Download,
	File,
	FileImage,
	FilePenLine,
	Minus,
	Move,
	MoveHorizontal,
	MoveVertical,
	Plus,
	Printer,
	Proportions,
	RectangleHorizontal,
	RectangleVertical,
	RulerDimensionLine,
	Type,
	VectorPolygon,
	X,
	createElement,
	type IconNode
} from 'lucide';
import {
	DPI,
	Format,
	PageOrientation,
	type ExportDialogOptions,
	type ExportDialogState,
	type ExportSettings,
	type FormatType,
	type MapView,
	type PageOrientationType,
	type ShowSaveFilePicker,
	type SizeType
} from '../interfaces';

/** Counter making the ids of the form elements unique when the dialog is opened several times */
let dialogCount = 0;

/** Wait after the last change before the preview is rendered again, so quick changes add up */
const RENDER_DELAY_MS = 300;

/** The preview is rendered again when the frame grows by more than this ratio */
const RESIZE_RENDER_RATIO = 1.25;

/**
 * Modal dialog of the export control: a preview of the page on the left and the export settings
 * on the right.
 *
 * The preview is the exported image itself, rendered by the same generator at a lower DPI (the
 * page is laid out at 96 DPI whatever DPI is chosen, so only the number of pixels differs).
 * The area to export is adjusted on the map itself, see {@link adjustArea}.
 *
 * It is built from plain DOM elements. Every element has a class prefixed with
 * `{cssPrefix}-export-` so that the dialog can be fully restyled from CSS.
 */
export default class ExportDialog {
	private options: ExportDialogOptions;

	private state: ExportDialogState;

	private dialog!: HTMLDialogElement;

	/** pane which the page is fitted into */
	private frame!: HTMLDivElement;

	/** the page: it has the ratio of the page and holds the preview image */
	private page!: HTMLDivElement;

	/** rendered preview image */
	private previewCanvas: HTMLCanvasElement | undefined;

	private previewError!: HTMLElement;

	private resizeObserver: ResizeObserver | undefined;

	/** camera of the exported map, changed with the zoom and pan buttons */
	private view: MapView;

	/** width of the frame the preview canvas was rendered for */
	private rendered: { width: number } | undefined;

	/** timer of the pending render, see {@link requestRender} */
	private renderTimer: ReturnType<typeof setTimeout> | undefined;

	/** running render loop. Only one map is rendered at a time */
	private renderLoop: Promise<void> | undefined;

	/** set when the preview has to be rendered again once the running render has finished */
	private renderDirty = false;

	private closed = false;

	/** set while the dialog is hidden for the user to adjust the area on the map */
	private adjusting = false;

	private adjustButton: HTMLButtonElement | undefined;

	/** zoom of the preview image, changed with the zoom buttons below the preview */
	private previewZoom = 1;

	/** offset of the preview image from the center of the frame, changed by dragging it */
	private previewPan = { x: 0, y: 0 };

	/** pointer dragging the preview image, with the offset and pointer position when it started */
	private drag: { pointerId: number; x: number; y: number; panX: number; panY: number } | undefined;

	private zoomElements: {
		zoomOut?: HTMLButtonElement;
		zoomIn?: HTMLButtonElement;
		reset?: HTMLButtonElement;
	} = {};

	/** last valid `[width, height]` of the page, used while the custom size is being typed */
	private pageSize: [number, number];

	private saving = false;

	private pointerDownOnBackdrop = false;

	private idPrefix: string;

	private elements: {
		pageSize?: HTMLSelectElement;
		customFields?: HTMLElement[];
		customWidth?: HTMLInputElement;
		customHeight?: HTMLInputElement;
		orientationField?: HTMLElement;
		vectorField?: HTMLElement;
		vectorLabelsField?: HTMLElement;
		fileName?: HTMLInputElement;
		fileExtension?: HTMLElement;
		saveButton?: HTMLButtonElement;
		error?: HTMLElement;
	} = {};

	constructor(options: ExportDialogOptions) {
		this.options = options;
		this.state = { ...options.state };
		this.idPrefix = `${options.cssPrefix}-export-${++dialogCount}`;
		this.pageSize = this.readPageSize() ?? [297, 210];
		// the page starts at the scale of the map on the screen
		const center = options.map.getCenter();
		this.view = {
			center: [center.lng, center.lat],
			zoom: options.map.getZoom(),
			bearing: options.map.getBearing(),
			pitch: options.map.getPitch()
		};
	}

	/** Build the dialog, show it as a modal and render the preview */
	public open() {
		this.dialog = this.createDialog();
		document.body.appendChild(this.dialog);
		this.dialog.showModal();
		this.resizeObserver = new ResizeObserver(() => this.onFrameResize());
		this.resizeObserver.observe(this.page);
		this.requestRender(0);
	}

	/** Close the dialog. It is ignored while the map is being exported */
	public close() {
		if (this.saving || !this.dialog?.open) return;
		this.dialog.close();
	}

	private get prefix() {
		return this.options.cssPrefix;
	}

	private get t() {
		return this.options.translation;
	}

	private cls(name: string) {
		return `${this.prefix}-export-${name}`;
	}

	/**
	 * Create a Lucide icon (https://lucide.dev/icons/).
	 *
	 * The SVG is wrapped in `<span class="{prefix}-export-icon {prefix}-export-icon--{name}">`
	 * so that an icon can be restyled or replaced from CSS (see the SCSS file).
	 * @param icon Lucide icon
	 * @param name used in the class name of the icon
	 */
	private createIcon(icon: IconNode, name: string): HTMLSpanElement {
		const span = this.el('span', `${this.cls('icon')} ${this.cls(`icon--${name}`)}`);
		span.setAttribute('aria-hidden', 'true');
		span.appendChild(createElement(icon, { 'aria-hidden': 'true' }));
		return span;
	}

	private el<K extends keyof HTMLElementTagNameMap>(
		tag: K,
		className?: string,
		text?: string
	): HTMLElementTagNameMap[K] {
		const element = document.createElement(tag);
		if (className) element.className = className;
		if (text !== undefined) element.textContent = text;
		return element;
	}

	private createDialog() {
		const dialog = this.el('dialog', this.cls('dialog'));
		dialog.setAttribute('aria-labelledby', `${this.idPrefix}-title`);

		const container = this.el('div', this.cls('dialog__container'));
		container.append(this.createHeader(), this.createBody(), this.createFooter());
		dialog.appendChild(container);

		// a click on the backdrop is dispatched to the dialog itself, while the content fills the
		// container. Both the press and the release must be on the backdrop, so that a drag which
		// ends outside the dialog does not close it.
		dialog.addEventListener('pointerdown', (event) => {
			this.pointerDownOnBackdrop = event.target === dialog;
		});
		dialog.addEventListener('click', (event) => {
			if (event.target === dialog && this.pointerDownOnBackdrop) this.close();
			this.pointerDownOnBackdrop = false;
		});
		// Esc
		dialog.addEventListener('cancel', (event) => {
			event.preventDefault();
			this.close();
		});
		// the dialog is also closed (hidden) while the area is adjusted on the map
		dialog.addEventListener('close', () => {
			if (!this.adjusting) this.destroy();
		});
		return dialog;
	}

	private createHeader() {
		const header = this.el('header', this.cls('dialog__header'));
		const title = this.el('h2', this.cls('dialog__title'));
		title.id = `${this.idPrefix}-title`;
		title.append(this.createIcon(Printer, 'title'), this.el('span', undefined, this.t.Title));

		const closeButton = this.el('button', this.cls('dialog__close'));
		closeButton.type = 'button';
		closeButton.setAttribute('aria-label', this.t.Close);
		closeButton.title = this.t.Close;
		closeButton.appendChild(this.createIcon(X, 'close'));
		closeButton.addEventListener('click', () => this.close());

		header.append(title, closeButton);
		return header;
	}

	private createBody() {
		const body = this.el('div', this.cls('dialog__body'));

		const preview = this.el('div', this.cls('dialog__preview'));
		this.frame = this.el('div', this.cls('dialog__frame'));
		this.page = this.createPage();
		this.frame.appendChild(this.page);
		this.updateFrameRatio();
		this.setupPreviewDrag();

		// zoom buttons above the preview, adjust area button below it
		preview.append(this.createZoomControl(), this.frame, this.createAdjustButton());

		const settings = this.el('form', this.cls('dialog__settings'));
		settings.addEventListener('submit', (event) => event.preventDefault());
		settings.append(...this.createSettingFields());

		body.append(preview, settings);
		return body;
	}

	private createFooter() {
		const footer = this.el('footer', this.cls('dialog__footer'));
		const error = this.el('p', this.cls('dialog__error'));
		error.setAttribute('role', 'alert');
		error.hidden = true;
		this.elements.error = error;

		const saveButton = this.el('button', `${this.cls('btn')} ${this.cls('btn--primary')}`);
		saveButton.type = 'button';
		saveButton.append(
			this.createIcon(Download, 'save'),
			this.el('span', this.cls('btn__label'), this.t.Save),
			this.el('span', this.cls('spinner'))
		);
		saveButton.addEventListener('click', () => this.save());
		this.elements.saveButton = saveButton;

		footer.append(error, saveButton);
		return footer;
	}

	/**
	 * Create a settings row: an icon and a label, then the control.
	 * @param name added as `{prefix}-export-field--{name}` and used in the class name of the icon
	 * @param modifier added as `{prefix}-export-field--{modifier}`
	 */
	private createField(
		name: string,
		icon: IconNode,
		label: string,
		control: HTMLElement,
		id?: string,
		modifier?: string
	) {
		const field = this.el('div', this.cls('field'));
		field.classList.add(this.cls(`field--${name}`));
		if (modifier) field.classList.add(this.cls(`field--${modifier}`));
		const labelElement = this.el('label', this.cls('field__label'));
		if (id) labelElement.htmlFor = id;
		labelElement.append(this.createIcon(icon, name), this.el('span', undefined, label));
		const controlWrapper = this.el('div', this.cls('field__control'));
		controlWrapper.appendChild(control);
		field.append(labelElement, controlWrapper);
		return field;
	}

	private createSelect(id: string, options: { label: string; value: string }[], value: string) {
		const select = this.el('select', this.cls('select'));
		select.id = `${this.idPrefix}-${id}`;
		select.name = id;
		options.forEach((option) => {
			const element = this.el('option', undefined, option.label);
			element.value = option.value;
			element.selected = option.value === value;
			select.appendChild(element);
		});
		return select;
	}

	/** Create a checkbox styled as a switch, in a field row */
	private createSwitch(
		name: string,
		icon: IconNode,
		label: string,
		id: string,
		checked: boolean,
		onChange: (checked: boolean) => void
	) {
		const input = this.el('input', this.cls('switch'));
		input.type = 'checkbox';
		input.setAttribute('role', 'switch');
		input.id = `${this.idPrefix}-${id}`;
		input.name = id;
		input.checked = checked;
		input.addEventListener('change', () => onChange(input.checked));
		return this.createField(name, icon, label, input, input.id, 'switch');
	}

	/** Create a number input with a trailing unit, used for the custom page size */
	private createNumberInput(id: string, value: number, onInput: (value: number) => void) {
		const wrapper = this.el('div', this.cls('input-group'));
		const input = this.el('input', this.cls('input'));
		input.type = 'number';
		input.min = '1';
		input.step = '1';
		input.required = true;
		input.inputMode = 'decimal';
		input.id = `${this.idPrefix}-${id}`;
		input.name = id;
		input.value = String(value);
		input.addEventListener('input', () => onInput(Number(input.value)));
		wrapper.append(input, this.el('span', this.cls('input-addon'), 'mm'));
		return { wrapper, input };
	}

	private createSettingFields(): HTMLElement[] {
		const fields: HTMLElement[] = [];

		// page size
		const sizeOptions = Object.entries(this.options.sizes).map(([label, size]) => ({
			label,
			value: JSON.stringify(size)
		}));
		sizeOptions.push({ label: this.t.Custom, value: CUSTOM_SIZE_VALUE });
		const pageSize = this.createSelect('page-size', sizeOptions, this.state.sizeValue);
		pageSize.addEventListener('change', () => this.onPageSizeChange());
		this.elements.pageSize = pageSize;
		fields.push(this.createField('pageSize', File, this.t.PageSize, pageSize, pageSize.id));

		// custom width / height
		const width = this.createNumberInput('custom-width', this.state.customWidth, (value) => {
			this.state.customWidth = value;
			this.onPageLayoutChange();
		});
		const height = this.createNumberInput('custom-height', this.state.customHeight, (value) => {
			this.state.customHeight = value;
			this.onPageLayoutChange();
		});
		this.elements.customWidth = width.input;
		this.elements.customHeight = height.input;
		this.elements.customFields = [
			this.createField(
				'customWidth',
				MoveHorizontal,
				this.t.Width,
				width.wrapper,
				width.input.id,
				'custom-size'
			),
			this.createField(
				'customHeight',
				MoveVertical,
				this.t.Height,
				height.wrapper,
				height.input.id,
				'custom-size'
			)
		];
		fields.push(...this.elements.customFields);

		// orientation
		const orientation = this.createOrientationControl();
		this.elements.orientationField = this.createField(
			'landscape',
			RectangleHorizontal,
			this.t.PageOrientation,
			orientation
		);
		this.elements.orientationField.classList.add(this.cls('field--orientation'));
		fields.push(this.elements.orientationField);

		// format
		const format = this.createSegmented<FormatType>(
			'format',
			this.t.Format,
			Object.entries(Format).map(([label, value]) => ({ label, value })),
			this.state.format,
			(value) => {
				this.state.format = value;
				this.syncFormat();
			}
		);
		format.classList.add(this.cls('segmented--compact'));
		fields.push(this.createField('format', FileImage, this.t.Format, format));

		// vector export, only for SVG and PDF
		this.elements.vectorField = this.createSwitch(
			'vector',
			VectorPolygon,
			this.t.ExportAsVector,
			'vector',
			this.state.vector,
			(checked) => {
				this.state.vector = checked;
				this.syncFormat();
			}
		);
		this.elements.vectorLabelsField = this.createSwitch(
			'vectorLabels',
			Type,
			this.t.ExportLabelsAsVector,
			'vector-labels',
			this.state.vectorLabels,
			(checked) => {
				this.state.vectorLabels = checked;
			}
		);
		fields.push(this.elements.vectorField, this.elements.vectorLabelsField);

		// DPI
		fields.push(this.createDpiField());

		// overlays
		fields.push(
			this.createSwitch(
				'scalebar',
				RulerDimensionLine,
				this.t.Scalebar,
				'scalebar',
				this.state.scalebar,
				(checked) => {
					this.state.scalebar = checked;
					this.requestRender();
				}
			),
			this.createSwitch(
				'northIcon',
				Compass,
				this.t.NorthIcon,
				'north-icon',
				this.state.northIcon,
				(checked) => {
					this.state.northIcon = checked;
					this.requestRender();
				}
			)
		);

		fields.push(this.createFileNameField());

		this.syncPageSizeFields();
		this.syncFormat();
		return fields;
	}

	/**
	 * Radio buttons styled as a segmented control.
	 * @param name used in the name of the radio buttons
	 * @param label accessible name of the group
	 * @param choices options; the value is also used in the class name of the icon
	 * @param value checked option
	 * @param onChange called with the value of the option the user checked
	 */
	private createSegmented<T extends string>(
		name: string,
		label: string,
		choices: { value: T; label: string; icon?: IconNode }[],
		value: T,
		onChange: (value: T) => void
	) {
		const group = this.el('div', this.cls('segmented'));
		group.setAttribute('role', 'radiogroup');
		group.setAttribute('aria-label', label);
		choices.forEach((choice) => {
			const option = this.el('label', this.cls('segmented__option'));
			const input = this.el('input', this.cls('segmented__input'));
			input.type = 'radio';
			input.name = `${this.idPrefix}-${name}`;
			input.value = choice.value;
			input.checked = value === choice.value;
			input.addEventListener('change', () => {
				if (input.checked) onChange(choice.value);
			});
			option.appendChild(input);
			if (choice.icon) option.appendChild(this.createIcon(choice.icon, choice.value));
			option.appendChild(this.el('span', this.cls('segmented__label'), choice.label));
			group.appendChild(option);
		});
		return group;
	}

	/** Landscape / portrait segmented control */
	private createOrientationControl() {
		return this.createSegmented<PageOrientationType>(
			'orientation',
			this.t.PageOrientation,
			[
				{ value: PageOrientation.Landscape, icon: RectangleHorizontal, label: this.t.Landscape },
				{ value: PageOrientation.Portrait, icon: RectangleVertical, label: this.t.Portrait }
			],
			this.state.orientation,
			(value) => {
				this.state.orientation = value;
				this.onPageLayoutChange();
			}
		);
	}

	/**
	 * Slider snapping to the DPI presets, with the value of every preset below it.
	 * The slider holds the index of the preset, so the presets are evenly spaced.
	 */
	private createDpiField() {
		const values: number[] = Object.values(DPI);
		if (!values.includes(this.state.dpi)) values.push(this.state.dpi);
		values.sort((a, b) => a - b);

		const wrapper = this.el('div', this.cls('range'));
		const input = this.el('input', this.cls('range__input'));
		input.type = 'range';
		input.id = `${this.idPrefix}-dpi`;
		input.name = 'dpi';
		input.min = '0';
		input.max = String(values.length - 1);
		input.step = '1';

		const field = this.createField('dpi', Proportions, this.t.DPI, wrapper, input.id);
		const readout = this.el('span', this.cls('field__value'));
		field.querySelector(`.${this.cls('field__label')}`)?.appendChild(readout);

		const ticks = this.el('div', this.cls('range__ticks'));
		const tickButtons = values.map((value, index) => {
			const tick = this.el('button', this.cls('range__tick'), String(value));
			tick.type = 'button';
			// the slider itself is reachable with the keyboard
			tick.tabIndex = -1;
			tick.addEventListener('click', () => {
				input.value = String(index);
				update();
				input.focus();
			});
			return tick;
		});
		ticks.append(...tickButtons);

		const update = () => {
			const index = Number(input.value);
			this.state.dpi = values[index];
			readout.textContent = String(this.state.dpi);
			input.setAttribute('aria-valuetext', `${this.state.dpi} DPI`);
			input.style.setProperty(
				'--gl-export-range-progress',
				`${(index / Math.max(values.length - 1, 1)) * 100}%`
			);
			tickButtons.forEach((tick, i) =>
				tick.classList.toggle(this.cls('range__tick--active'), i === index)
			);
		};
		input.value = String(values.indexOf(this.state.dpi));
		input.addEventListener('input', update);
		update();

		wrapper.append(input, ticks);
		return field;
	}

	/** Zoom out / zoom level (click to reset) / zoom in buttons of the preview image */
	private createZoomControl() {
		const group = this.el('div', this.cls('zoom'));
		group.setAttribute('role', 'group');

		const createButton = (className: string, label: string) => {
			const button = this.el('button', `${this.cls('zoom__button')} ${this.cls(className)}`);
			button.type = 'button';
			button.title = label;
			button.setAttribute('aria-label', label);
			return button;
		};

		const zoomOut = createButton('zoom__out', this.t.ZoomOut);
		zoomOut.appendChild(this.createIcon(Minus, 'zoomOut'));
		zoomOut.addEventListener('click', () =>
			this.setPreviewZoom(stepPreviewZoom(this.previewZoom, -1))
		);

		const reset = createButton('zoom__reset', this.t.ResetZoom);
		reset.addEventListener('click', () => {
			this.previewPan = { x: 0, y: 0 };
			this.setPreviewZoom(1);
		});

		const zoomIn = createButton('zoom__in', this.t.ZoomIn);
		zoomIn.appendChild(this.createIcon(Plus, 'zoomIn'));
		zoomIn.addEventListener('click', () =>
			this.setPreviewZoom(stepPreviewZoom(this.previewZoom, 1))
		);

		this.zoomElements = { zoomOut, zoomIn, reset };
		group.append(zoomOut, reset, zoomIn);
		this.syncPreviewZoom();
		return group;
	}

	private setPreviewZoom(zoom: number) {
		this.previewZoom = Math.min(Math.max(zoom, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX);
		this.syncPreviewZoom();
		// the image may need more pixels to stay sharp
		this.onFrameResize();
	}

	/** Apply the zoom and offset of the preview image and update the zoom buttons */
	private syncPreviewZoom() {
		if (this.page) {
			// the whole page is visible up to 100%, so it is only dragged when zoomed in
			if (this.previewZoom <= 1) this.previewPan = { x: 0, y: 0 };
			this.previewPan = clampPreviewPan(
				this.previewPan,
				[this.page.offsetWidth, this.page.offsetHeight],
				[this.frame.clientWidth, this.frame.clientHeight],
				this.previewZoom
			);
			const { x, y } = this.previewPan;
			this.page.style.transform =
				x === 0 && y === 0 && this.previewZoom === 1
					? ''
					: `translate(${x}px, ${y}px) scale(${this.previewZoom})`;
			// touch drags scroll the dialog on mobile until the preview is zoomed in
			this.frame.classList.toggle(this.cls('dialog__frame--zoomed'), this.previewZoom > 1);
		}
		const { zoomOut, zoomIn, reset } = this.zoomElements;
		if (reset) reset.textContent = `${Math.round(this.previewZoom * 100)}%`;
		if (zoomOut) zoomOut.disabled = this.previewZoom <= PREVIEW_ZOOM_MIN;
		if (zoomIn) zoomIn.disabled = this.previewZoom >= PREVIEW_ZOOM_MAX;
	}

	/** Let the user move the preview image by dragging it */
	private setupPreviewDrag() {
		const frame = this.frame;
		frame.addEventListener('pointerdown', (event) => {
			if (event.button !== 0 || this.drag || this.previewZoom <= 1) return;
			this.drag = {
				pointerId: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				panX: this.previewPan.x,
				panY: this.previewPan.y
			};
			frame.setPointerCapture(event.pointerId);
			frame.classList.add(this.cls('dialog__frame--dragging'));
			event.preventDefault();
		});
		frame.addEventListener('pointermove', (event) => {
			if (!this.drag || event.pointerId !== this.drag.pointerId) return;
			this.previewPan = {
				x: this.drag.panX + event.clientX - this.drag.x,
				y: this.drag.panY + event.clientY - this.drag.y
			};
			this.syncPreviewZoom();
		});
		const endDrag = (event: PointerEvent) => {
			if (!this.drag || event.pointerId !== this.drag.pointerId) return;
			this.drag = undefined;
			frame.classList.remove(this.cls('dialog__frame--dragging'));
		};
		frame.addEventListener('pointerup', endDrag);
		frame.addEventListener('pointercancel', endDrag);
	}

	private createFileNameField() {
		const wrapper = this.el('div', this.cls('input-group'));
		const input = this.el('input', this.cls('input'));
		input.type = 'text';
		input.id = `${this.idPrefix}-file-name`;
		input.name = 'file-name';
		input.value = this.state.fileName;
		input.spellcheck = false;
		input.autocomplete = 'off';
		input.addEventListener('input', () => {
			this.state.fileName = input.value;
		});
		input.addEventListener('change', () => {
			input.value = sanitizeFileName(input.value, this.state.format);
			this.state.fileName = input.value;
		});
		const extension = this.el('span', this.cls('input-addon'));
		this.elements.fileName = input;
		this.elements.fileExtension = extension;
		wrapper.append(input, extension);
		return this.createField('fileName', FilePenLine, this.t.FileName, wrapper, input.id);
	}

	private getSaveFilePicker(): ShowSaveFilePicker | undefined {
		const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
			.showSaveFilePicker;
		return typeof picker === 'function' ? picker.bind(window) : undefined;
	}

	/**
	 * Let the user choose where the file is saved, with the save file picker of the browser.
	 * It must be called before anything is awaited in the click handler, because the browser
	 * only opens the picker in response to a user action.
	 * @returns the chosen file, `undefined` when the file should be downloaded instead
	 * (the picker is unavailable), or `null` when the user closed the picker.
	 */
	private async pickFile(fileName: string): Promise<FileSystemFileHandle | undefined | null> {
		const picker = this.options.useSaveFilePicker ? this.getSaveFilePicker() : undefined;
		if (!picker) return undefined;
		const format = this.state.format;
		try {
			return await picker({
				suggestedName: `${fileName}.${format}`,
				types: [
					{ description: format.toUpperCase(), accept: { [MIME_TYPES[format]]: [`.${format}`] } }
				]
			});
		} catch (err) {
			// the user closed the picker
			if ((err as DOMException)?.name !== 'AbortError') console.warn(err);
			return null;
		}
	}

	/** Show the rows which apply to the selected format */
	private syncFormat() {
		const vectorFormat = isVectorFormat(this.state.format);
		if (this.elements.vectorField) this.elements.vectorField.hidden = !vectorFormat;
		if (this.elements.vectorLabelsField) {
			this.elements.vectorLabelsField.hidden = !vectorFormat || !this.state.vector;
		}
		if (this.elements.fileExtension)
			this.elements.fileExtension.textContent = `.${this.state.format}`;
	}

	private onPageSizeChange() {
		const select = this.elements.pageSize;
		if (!select) return;
		if (select.value === CUSTOM_SIZE_VALUE && this.state.sizeValue !== CUSTOM_SIZE_VALUE) {
			// start from the size the user was just looking at
			const size = this.readPageSize();
			if (size) {
				this.state.customWidth = size[0];
				this.state.customHeight = size[1];
				if (this.elements.customWidth) this.elements.customWidth.value = String(size[0]);
				if (this.elements.customHeight) this.elements.customHeight.value = String(size[1]);
			}
		}
		this.state.sizeValue = select.value;
		this.syncPageSizeFields();
		this.onPageLayoutChange();
	}

	/**
	 * Show the width/height inputs only for the "Custom" entry. Orientation is meaningless then
	 * because the two inputs already define both dimensions, so its row is hidden.
	 */
	private syncPageSizeFields() {
		const isCustom = this.state.sizeValue === CUSTOM_SIZE_VALUE;
		this.elements.customFields?.forEach((field) => (field.hidden = !isCustom));
		if (this.elements.orientationField) this.elements.orientationField.hidden = isCustom;
	}

	/**
	 * Read the selected page size as a `[width, height]` mm tuple, or `null` when the custom
	 * size is not a pair of positive numbers.
	 */
	private readPageSize(): [number, number] | null {
		if (this.state.sizeValue === CUSTOM_SIZE_VALUE) {
			const { customWidth: width, customHeight: height } = this.state;
			if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
				return null;
			}
			return [width, height];
		}
		try {
			return orientSize(JSON.parse(this.state.sizeValue) as SizeType, this.state.orientation);
		} catch {
			return null;
		}
	}

	/** The page size or orientation changed: reshape the page and render it again */
	private onPageLayoutChange() {
		const size = this.readPageSize();
		if (!size) return;
		this.pageSize = size;
		this.updateFrameRatio();
		// the page changed shape: show it centered again
		this.previewPan = { x: 0, y: 0 };
		this.syncPreviewZoom();
		this.requestRender();
	}

	private updateFrameRatio() {
		this.frame.style.setProperty(
			'--gl-export-page-ratio',
			String(this.pageSize[0] / this.pageSize[1])
		);
	}

	/** The page holding the preview image */
	private createPage() {
		const page = this.el('div', this.cls('dialog__page'));
		page.setAttribute('role', 'img');
		page.setAttribute('aria-label', this.t.PreviewHint);

		const loading = this.el('div', this.cls('dialog__loading'));
		loading.appendChild(this.el('span', this.cls('spinner')));

		this.previewError = this.el('p', this.cls('dialog__preview-error'), this.t.PreviewFailed);
		this.previewError.hidden = true;

		page.append(loading, this.previewError);
		return page;
	}

	/** Width in CSS pixels the preview image is shown at, including the zoom of the preview */
	private get previewWidth() {
		return this.page.clientWidth * this.previewZoom;
	}

	/**
	 * Render the preview again when the frame grew, or the preview was zoomed in, enough for the
	 * image to look blurry
	 */
	private onFrameResize() {
		const width = this.previewWidth;
		if (!this.rendered || width > this.rendered.width * RESIZE_RENDER_RATIO) {
			this.requestRender();
		}
	}

	/**
	 * Render the preview after {@link RENDER_DELAY_MS}, restarting the delay on every call so that
	 * several clicks lead to a single render.
	 */
	private requestRender(delay = RENDER_DELAY_MS) {
		if (this.closed) return;
		clearTimeout(this.renderTimer);
		this.setLoading(true);
		this.renderTimer = setTimeout(() => {
			this.renderTimer = undefined;
			this.runRenderLoop();
		}, delay);
	}

	/**
	 * Render until the preview shows the latest settings. Only one map is rendered at a time,
	 * because the generator changes `window.devicePixelRatio` while it renders.
	 */
	private runRenderLoop() {
		if (this.renderLoop) {
			this.renderDirty = true;
			return this.renderLoop;
		}
		this.renderLoop = (async () => {
			do {
				this.renderDirty = false;
				await this.renderPreview();
			} while (this.renderDirty && !this.closed);
		})().finally(() => {
			this.renderLoop = undefined;
			if (!this.renderTimer) this.setLoading(false);
		});
		return this.renderLoop;
	}

	private async renderPreview() {
		const width = this.previewWidth;
		if (this.closed || width <= 0) return;
		const pageSize: [number, number] = [...this.pageSize];
		const view = { ...this.view };
		const dpi = getPreviewDpi(pageSize[0], width, window.devicePixelRatio || 1, this.state.dpi);
		let canvas: HTMLCanvasElement;
		try {
			canvas = await this.options.renderPreview(this.getSettings(pageSize, view), dpi);
		} catch (err) {
			console.error('Failed to render the preview:', err);
			if (!this.closed) this.previewError.hidden = false;
			return;
		}
		if (this.closed) return;
		this.previewError.hidden = true;
		canvas.className = this.cls('dialog__canvas');
		canvas.setAttribute('aria-hidden', 'true');
		if (this.previewCanvas) {
			this.previewCanvas.replaceWith(canvas);
		} else {
			this.page.prepend(canvas);
		}
		this.previewCanvas = canvas;
		this.rendered = { width };
	}

	private setLoading(loading: boolean) {
		this.page?.classList.toggle(this.cls('dialog__page--loading'), loading);
	}

	/** Everything needed to export the map with the current settings */
	private getSettings(
		size: [number, number],
		view: MapView,
		fileHandle?: FileSystemFileHandle
	): ExportSettings {
		return {
			size,
			dpi: this.state.dpi,
			format: this.state.format,
			fileName: sanitizeFileName(this.state.fileName, this.state.format),
			scalebar: this.state.scalebar,
			northIcon: this.state.northIcon,
			vector: isVectorFormat(this.state.format) && this.state.vector,
			vectorLabels: this.state.vectorLabels,
			view,
			fileHandle
		};
	}

	private setSaving(saving: boolean) {
		this.saving = saving;
		this.dialog.classList.toggle(this.cls('dialog--saving'), saving);
		this.dialog.setAttribute('aria-busy', String(saving));
		if (this.elements.saveButton) this.elements.saveButton.disabled = saving;
		if (this.adjustButton) this.adjustButton.disabled = saving;
	}

	private showError(message?: string) {
		const error = this.elements.error;
		if (!error) return;
		error.textContent = message ?? '';
		error.hidden = !message;
	}

	private createAdjustButton() {
		const button = this.el(
			'button',
			`${this.cls('btn')} ${this.cls('btn--secondary')} ${this.cls('adjust-area')}`
		);
		button.type = 'button';
		button.title = this.t.PreviewHint;
		button.append(
			this.createIcon(Move, 'adjustArea'),
			this.el('span', undefined, this.t.AdjustArea)
		);
		button.addEventListener('click', () => this.adjustArea());
		this.adjustButton = button;
		return button;
	}

	/**
	 * Cancel the pending preview render and wait for the running one, before something else
	 * renders the map: the generator changes `window.devicePixelRatio` while it renders.
	 * @returns whether a render was pending, see {@link resumeRendering}
	 */
	private async pauseRendering() {
		const pending = this.renderTimer !== undefined;
		clearTimeout(this.renderTimer);
		this.renderTimer = undefined;
		await this.renderLoop;
		return pending;
	}

	/** Render the preview again if it is out of date, after {@link pauseRendering} */
	private resumeRendering(render: boolean) {
		if (render) this.requestRender(0);
		else this.setLoading(false);
	}

	/**
	 * Hide the dialog and let the user frame the area on the map itself, then come back with it.
	 * The modal dialog makes the rest of the page inert, so it has to be closed meanwhile.
	 */
	private async adjustArea() {
		if (this.saving || this.adjusting) return;
		this.adjusting = true;
		const renderPending = await this.pauseRendering();
		this.dialog.close();
		let view: MapView | null = null;
		try {
			view = await this.options.adjustArea({ ...this.view }, [...this.pageSize]);
		} catch (err) {
			console.error('Failed to adjust the area on the map:', err);
		}
		this.dialog.showModal();
		this.adjusting = false;
		if (view) this.view = view;
		this.resumeRendering(renderPending || !!view);
		this.adjustButton?.focus();
	}

	private async save() {
		if (this.saving) return;
		const size = this.readPageSize();
		if (!size) {
			// the custom size is invalid
			this.elements.customWidth?.reportValidity();
			this.elements.customHeight?.reportValidity();
			return;
		}
		let fileName = sanitizeFileName(this.state.fileName, this.state.format);
		const fileHandle = await this.pickFile(fileName);
		if (fileHandle === null) return;
		// the name may have been changed in the picker
		if (fileHandle) fileName = sanitizeFileName(fileHandle.name, this.state.format);
		this.state.fileName = fileName;
		if (this.elements.fileName) this.elements.fileName.value = fileName;

		this.showError();
		this.setSaving(true);
		// a preview render must not run at the same time as the export
		const renderPending = await this.pauseRendering();
		let exported = false;
		try {
			exported = await this.options.onSave(this.getSettings(size, { ...this.view }, fileHandle));
		} catch (err) {
			console.error('Failed to export the map:', err);
		}
		this.setSaving(false);
		if (exported) {
			this.close();
		} else {
			this.showError(this.t.ExportFailed);
			this.resumeRendering(renderPending);
		}
	}

	private destroy() {
		this.closed = true;
		clearTimeout(this.renderTimer);
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
		this.dialog.remove();
		this.options.onClose?.({ ...this.state });
	}
}
