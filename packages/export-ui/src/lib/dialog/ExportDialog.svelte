<!--
	Modal dialog of the export control: a preview of the page on the left (see PreviewPane) and the
	export settings on the right (see SettingsPanel).

	Every element has a `gl-export-` class, and the theme is driven by the `--gl-export-*` custom
	properties of `theme.css`.
-->
<script lang="ts">
	import { Download, Printer, X } from '@lucide/svelte';
	import { onMount, untrack } from 'svelte';
	import '../theme.css';
	import Button from '../components/Button.svelte';
	import Icon from '../components/Icon.svelte';
	import type {
		ExportDialogOptions,
		ExportDialogState,
		MapView,
		ShowSaveFilePicker
	} from '../interfaces';
	import { MIME_TYPES, sanitizeFileName } from '../utils/format';
	import { readPageSize, toExportSettings } from '../utils/page-size';
	import PreviewPane from './PreviewPane.svelte';
	import SettingsPanel from './SettingsPanel.svelte';

	interface Props {
		options: ExportDialogOptions;
		/** prefix of the ids of the form elements, unique to the dialog */
		idPrefix: string;
		/** called once the dialog has been closed, with the last state of the form */
		onclosed: (state: ExportDialogState) => void;
	}

	let { options, idPrefix, onclosed }: Props = $props();
	const t = $derived(options.translation);

	let formState = $state<ExportDialogState>(untrack(() => ({ ...options.state })));

	let dialog: HTMLDialogElement;
	let preview: PreviewPane;
	let settings: SettingsPanel;

	/** last valid `[width, height]` of the page, used while the custom size is being typed */
	let pageSize = $state<[number, number]>(untrack(() => readPageSize(formState) ?? [297, 210]));

	/** camera of the exported map, changed by adjusting the area on the map */
	let view: MapView = untrack(() => {
		// the page starts at the scale of the map on the screen
		const center = options.map.getCenter();
		return {
			center: [center.lng, center.lat],
			zoom: options.map.getZoom(),
			bearing: options.map.getBearing(),
			pitch: options.map.getPitch()
		};
	});

	/** set while the dialog is hidden for the user to adjust the area on the map */
	let adjusting = false;

	let saving = $state(false);

	let error = $state<string>();

	let pointerDownOnBackdrop = false;

	onMount(() => {
		dialog.showModal();
		preview.start();
	});

	/** Close the dialog. It is ignored while the map is being exported */
	export const close = () => {
		if (saving || !dialog?.open) return;
		dialog.close();
	};

	const getSaveFilePicker = (): ShowSaveFilePicker | undefined => {
		const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
			.showSaveFilePicker;
		return typeof picker === 'function' ? picker.bind(window) : undefined;
	};

	/**
	 * Let the user choose where the file is saved, with the save file picker of the browser.
	 * It must be called before anything is awaited in the click handler, because the browser
	 * only opens the picker in response to a user action.
	 * @returns the chosen file, `undefined` when the file should be downloaded instead
	 * (the picker is unavailable), or `null` when the user closed the picker.
	 */
	const pickFile = async (fileName: string): Promise<FileSystemFileHandle | undefined | null> => {
		const picker = options.useSaveFilePicker ? getSaveFilePicker() : undefined;
		if (!picker) return undefined;
		const format = formState.format;
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
	};

	/**
	 * Hide the dialog and let the user frame the area on the map itself, then come back with it.
	 * The modal dialog makes the rest of the page inert, so it has to be closed meanwhile.
	 */
	const adjustArea = async () => {
		if (saving || adjusting) return;
		adjusting = true;
		const renderPending = await preview.pause();
		dialog.close();
		let adjusted: MapView | null = null;
		try {
			adjusted = await options.adjustArea({ ...view }, [...pageSize]);
		} catch (err) {
			console.error('Failed to adjust the area on the map:', err);
		}
		dialog.showModal();
		adjusting = false;
		if (adjusted) view = adjusted;
		preview.resume(renderPending || !!adjusted);
		preview.focusAdjustButton();
	};

	const save = async () => {
		if (saving) return;
		const size = readPageSize(formState);
		if (!size) {
			// the custom size is invalid
			settings.reportValidity();
			return;
		}
		const fileHandle = await pickFile(sanitizeFileName(formState.fileName, formState.format));
		if (fileHandle === null) return;
		// the name may have been changed in the picker
		formState.fileName = sanitizeFileName(
			fileHandle ? fileHandle.name : formState.fileName,
			formState.format
		);

		error = undefined;
		saving = true;
		// a preview render must not run at the same time as the export
		const renderPending = await preview.pause();
		let exported = false;
		try {
			exported = await options.onSave(
				toExportSettings($state.snapshot(formState), size, { ...view }, fileHandle)
			);
		} catch (err) {
			console.error('Failed to export the map:', err);
		}
		saving = false;
		if (exported) {
			close();
		} else {
			error = t.ExportFailed;
			preview.resume(renderPending);
		}
	};

	const onPointerDown = (event: PointerEvent) => {
		// a click on the backdrop is dispatched to the dialog itself, while the content fills the
		// container. Both the press and the release must be on the backdrop, so that a drag which
		// ends outside the dialog does not close it.
		pointerDownOnBackdrop = event.target === dialog;
	};

	const onClick = (event: MouseEvent) => {
		if (event.target === dialog && pointerDownOnBackdrop) close();
		pointerDownOnBackdrop = false;
	};

	const onKeyDown = (event: KeyboardEvent) => {
		// Esc. Chrome stops letting `cancel` be prevented when Esc is pressed again without any
		// other user action, so Esc is swallowed at keydown while the map is being exported.
		if (event.key === 'Escape' && saving) event.preventDefault();
	};

	const onCancel = (event: Event) => {
		event.preventDefault();
		close();
	};

	const onClose = () => {
		// the dialog is also closed (hidden) while the area is adjusted on the map
		if (adjusting) return;
		// it must stay open while the map is being exported, whatever closed it
		if (saving) dialog.showModal();
		else onclosed($state.snapshot(formState));
	};
</script>

<dialog
	bind:this={dialog}
	class={['gl-export-dialog', saving && 'gl-export-dialog--saving']}
	aria-labelledby="{idPrefix}-title"
	aria-busy={saving}
	onpointerdown={onPointerDown}
	onclick={onClick}
	onkeydown={onKeyDown}
	oncancel={onCancel}
	onclose={onClose}
>
	<div class="gl-export-dialog__container">
		<header class="gl-export-dialog__header">
			<h2 class="gl-export-dialog__title" id="{idPrefix}-title">
				<Icon icon={Printer} name="title" />
				<span>{t.Title}</span>
			</h2>
			<button
				type="button"
				class="gl-export-dialog__close"
				aria-label={t.Close}
				title={t.Close}
				disabled={saving}
				onclick={close}
			>
				<Icon icon={X} name="close" />
			</button>
		</header>

		<div class="gl-export-dialog__body">
			<PreviewPane
				bind:this={preview}
				translation={t}
				{pageSize}
				render={(size, dpi) =>
					options.renderPreview(
						toExportSettings($state.snapshot(formState), size, { ...view }),
						dpi
					)}
				getMaxDpi={() => formState.dpi}
				disabled={saving}
				onadjustarea={adjustArea}
			/>
			<SettingsPanel
				bind:this={settings}
				{idPrefix}
				translation={t}
				sizes={options.sizes}
				bind:formState
				onpagelayoutchange={(size) => {
					pageSize = size;
					preview.setPageSize(size);
				}}
				onrenderchange={() => preview.requestRender()}
			/>
		</div>

		<footer class="gl-export-dialog__footer">
			<p class="gl-export-dialog__error" role="alert" hidden={!error}>{error ?? ''}</p>
			<Button
				variant="primary"
				icon={Download}
				iconName="save"
				label={t.Save}
				busy={saving}
				disabled={saving}
				onclick={save}
			/>
		</footer>
	</div>
</dialog>

<style>
	.gl-export-dialog {
		box-sizing: border-box;
		width: min(var(--gl-export-width), calc(100vw - 32px));
		height: min(var(--gl-export-height), calc(100dvh - 32px));
		max-width: none;
		max-height: none;
		margin: auto;
		padding: 0;
		overflow: hidden;
		border: none;
		border-radius: var(--gl-export-radius);
		background: var(--gl-export-bg);
		color: var(--gl-export-fg);
		box-shadow: var(--gl-export-shadow);
		font-family: var(--gl-export-font);
		font-size: var(--gl-export-font-size);
		line-height: 1.4;
	}

	.gl-export-dialog::backdrop {
		background: var(--gl-export-backdrop);
		backdrop-filter: blur(2px);
	}

	.gl-export-dialog[open] {
		animation: dialog-in 0.18s ease-out;
	}

	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.gl-export-dialog__container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	/* header */

	.gl-export-dialog__header {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 12px 12px 20px;
		border-bottom: 1px solid var(--gl-export-border);
	}

	.gl-export-dialog__title {
		--gl-export-icon-size: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.gl-export-dialog__title :global(.gl-export-icon) {
		color: var(--gl-export-accent);
	}

	.gl-export-dialog__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--gl-export-muted);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.gl-export-dialog__close:hover {
		background: var(--gl-export-surface);
		color: var(--gl-export-fg);
	}

	.gl-export-dialog__close:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px var(--gl-export-focus);
	}

	/* the dialog cannot be closed while the map is being exported */
	.gl-export-dialog--saving .gl-export-dialog__close {
		visibility: hidden;
	}

	/* body: preview on the left, settings on the right */

	.gl-export-dialog__body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	/* footer */

	.gl-export-dialog__footer {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding: 12px 20px;
		border-top: 1px solid var(--gl-export-border);
	}

	.gl-export-dialog__error {
		flex: 1;
		margin: 0;
		color: var(--gl-export-danger);
		font-size: 13px;
	}

	/* mobile: full screen, preview on top and settings below in one scrolling body */
	@media (max-width: 767px) {
		.gl-export-dialog {
			width: 100vw;
			height: 100dvh;
			border-radius: 0;
		}

		.gl-export-dialog__body {
			flex-direction: column;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
			overscroll-behavior: contain;
		}
	}
</style>
