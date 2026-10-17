import { Download, Printer, X } from 'lucide';
import type {
	ExportDialogOptions,
	ExportDialogState,
	FormatType,
	MapView,
	ShowSaveFilePicker
} from '../../interfaces';
import { cls, createButton, createIcon, createIconButton, el } from '../components';
import PreviewPane from './preview-pane';
import SettingsPanel, { readPageSize, sanitizeFileName } from './settings-panel';

/** Counter making the ids of the form elements unique when the dialog is opened several times */
let dialogCount = 0;

/** MIME type of each export format, offered to the save file picker */
const MIME_TYPES: Record<FormatType, string> = {
	jpg: 'image/jpeg',
	png: 'image/png',
	webp: 'image/webp',
	pdf: 'application/pdf',
	svg: 'image/svg+xml',
	tif: 'image/tiff'
};

/**
 * Modal dialog of the export control: a preview of the page on the left (see {@link PreviewPane})
 * and the export settings on the right (see {@link SettingsPanel}).
 *
 * The area to export is adjusted on the map itself, see {@link adjustArea}.
 *
 * It is built from plain DOM elements. Every element has a class prefixed with
 * `{cssPrefix}-export-` so that the dialog can be fully restyled from CSS.
 */
export default class ExportDialog {
	private options: ExportDialogOptions;

	private state: ExportDialogState;

	private dialog!: HTMLDialogElement;

	private preview!: PreviewPane;

	private settings!: SettingsPanel;

	private saveButton!: HTMLButtonElement;

	private error!: HTMLElement;

	/** camera of the exported map, changed by adjusting the area on the map */
	private view: MapView;

	/** last valid `[width, height]` of the page, used while the custom size is being typed */
	private pageSize: [number, number];

	/** set while the dialog is hidden for the user to adjust the area on the map */
	private adjusting = false;

	private saving = false;

	private pointerDownOnBackdrop = false;

	private idPrefix: string;

	constructor(options: ExportDialogOptions) {
		this.options = options;
		this.state = { ...options.state };
		this.idPrefix = `${options.cssPrefix}-export-${++dialogCount}`;
		this.pageSize = readPageSize(this.state) ?? [297, 210];
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
		this.preview.start();
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
		return cls(this.prefix, name);
	}

	private createDialog() {
		const dialog = el('dialog', this.cls('dialog'));
		dialog.setAttribute('aria-labelledby', `${this.idPrefix}-title`);

		const container = el('div', this.cls('dialog__container'));
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
		const header = el('header', this.cls('dialog__header'));
		const title = el('h2', this.cls('dialog__title'));
		title.id = `${this.idPrefix}-title`;
		title.append(createIcon(this.prefix, Printer, 'title'), el('span', undefined, this.t.Title));

		const closeButton = createIconButton({
			prefix: this.prefix,
			className: this.cls('dialog__close'),
			label: this.t.Close,
			icon: X,
			iconName: 'close',
			onClick: () => this.close()
		});

		header.append(title, closeButton);
		return header;
	}

	private createBody() {
		const body = el('div', this.cls('dialog__body'));

		this.preview = new PreviewPane({
			prefix: this.prefix,
			translation: this.t,
			pageSize: this.pageSize,
			render: (size, dpi) =>
				this.options.renderPreview(this.settings.getSettings(size, { ...this.view }), dpi),
			getMaxDpi: () => this.state.dpi,
			onAdjustArea: () => this.adjustArea()
		});

		this.settings = new SettingsPanel({
			prefix: this.prefix,
			idPrefix: this.idPrefix,
			translation: this.t,
			sizes: this.options.sizes,
			state: this.state,
			onPageLayoutChange: (size) => {
				this.pageSize = size;
				this.preview.setPageSize(size);
			},
			onRenderChange: () => this.preview.requestRender()
		});

		body.append(this.preview.element, this.settings.element);
		return body;
	}

	private createFooter() {
		const footer = el('footer', this.cls('dialog__footer'));
		this.error = el('p', this.cls('dialog__error'));
		this.error.setAttribute('role', 'alert');
		this.error.hidden = true;

		this.saveButton = createButton({
			prefix: this.prefix,
			variant: 'primary',
			icon: Download,
			iconName: 'save',
			label: this.t.Save,
			spinner: true,
			onClick: () => this.save()
		});

		footer.append(this.error, this.saveButton);
		return footer;
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

	private setSaving(saving: boolean) {
		this.saving = saving;
		this.dialog.classList.toggle(this.cls('dialog--saving'), saving);
		this.dialog.setAttribute('aria-busy', String(saving));
		this.saveButton.disabled = saving;
		this.preview.setDisabled(saving);
	}

	private showError(message?: string) {
		this.error.textContent = message ?? '';
		this.error.hidden = !message;
	}

	/**
	 * Hide the dialog and let the user frame the area on the map itself, then come back with it.
	 * The modal dialog makes the rest of the page inert, so it has to be closed meanwhile.
	 */
	private async adjustArea() {
		if (this.saving || this.adjusting) return;
		this.adjusting = true;
		const renderPending = await this.preview.pause();
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
		this.preview.resume(renderPending || !!view);
		this.preview.focusAdjustButton();
	}

	private async save() {
		if (this.saving) return;
		const size = this.settings.readPageSize();
		if (!size) {
			// the custom size is invalid
			this.settings.reportValidity();
			return;
		}
		const fileHandle = await this.pickFile(
			sanitizeFileName(this.state.fileName, this.state.format)
		);
		if (fileHandle === null) return;
		// the name may have been changed in the picker
		this.settings.setFileName(fileHandle ? fileHandle.name : this.state.fileName);

		this.showError();
		this.setSaving(true);
		// a preview render must not run at the same time as the export
		const renderPending = await this.preview.pause();
		let exported = false;
		try {
			exported = await this.options.onSave(
				this.settings.getSettings(size, { ...this.view }, fileHandle)
			);
		} catch (err) {
			console.error('Failed to export the map:', err);
		}
		this.setSaving(false);
		if (exported) {
			this.close();
		} else {
			this.showError(this.t.ExportFailed);
			this.preview.resume(renderPending);
		}
	}

	private destroy() {
		this.preview.destroy();
		this.dialog.remove();
		this.options.onClose?.({ ...this.state });
	}
}
