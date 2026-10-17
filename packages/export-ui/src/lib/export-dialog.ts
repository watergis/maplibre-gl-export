import { mount, unmount } from 'svelte';
import ExportDialogComponent from './dialog/ExportDialog.svelte';
import type { ExportDialogOptions } from './interfaces';

/** Counter making the ids of the form elements unique when the dialog is opened several times */
let dialogCount = 0;

/**
 * Modal dialog of the export control, see `dialog/ExportDialog.svelte`.
 *
 * It mounts the Svelte component at the end of the document when it is opened, and removes it
 * once the dialog has been closed.
 */
export default class ExportDialog {
	private options: ExportDialogOptions;

	/** exports of the mounted component, set while the dialog is open */
	private component: { close: () => void } | undefined;

	constructor(options: ExportDialogOptions) {
		this.options = options;
	}

	/** Build the dialog, show it as a modal and render the preview */
	public open() {
		if (this.component) return;
		this.component = mount(ExportDialogComponent, {
			target: document.body,
			props: {
				options: this.options,
				idPrefix: `gl-export-${++dialogCount}`,
				onclosed: (state) => {
					if (this.component) unmount(this.component);
					this.component = undefined;
					this.options.onClose?.(state);
				}
			}
		});
	}

	/** Close the dialog. It is ignored while the map is being exported */
	public close() {
		this.component?.close();
	}
}
