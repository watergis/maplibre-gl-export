<!--
	The export dialog as the plugin opens it, over a MapLibre map. The preview and the export are
	stand-ins (see `src/stories/mock-render.ts`); the area is adjusted on the map with the real
	AreaAdjuster.
-->
<script module lang="ts">
	import { Printer } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { Map } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import MapFrame from '../../stories/MapFrame.svelte';
	import { defaultDialogState, languageArgType } from '../../stories/defaults';
	import { mockRenderPreview, mockSave } from '../../stories/mock-render';
	import ExportDialog from '../export-dialog';
	import type { ExportDialogState, ExportSettings, Language } from '../interfaces';
	import { getTranslation } from '../local';
	import AreaAdjuster from '../map/area-adjuster';
	import { resolveAllowedSizes } from '../utils/page-size';

	interface Args {
		language: Language;
		/** use the save file picker of the browser, where it is available */
		useSaveFilePicker?: boolean;
		/** the export fails */
		fail?: boolean;
		onsave: (settings: ExportSettings) => void;
		onclose: (state: ExportDialogState) => void;
	}

	const { Story } = defineMeta({
		title: 'Dialog/ExportDialog',
		parameters: {
			// shown over a MapLibre map
			layout: 'fullscreen',
			docs: {
				description: {
					component:
						'The dialog opens over the map. Close it and use the print button at the top right to open it again.'
				}
			}
		},
		argTypes: { language: languageArgType },
		args: { language: 'en', onsave: fn(), onclose: fn() } as Args
	});

	/**
	 * Open the dialog as the export control does: the print button opens it, and the state of the
	 * form is kept so that reopening the dialog restores it.
	 */
	const createControl = (map: Map, args: Args) => {
		let state = defaultDialogState();
		let dialog: ExportDialog | undefined;
		let button: HTMLButtonElement | undefined;

		const open = () => {
			if (dialog) return;
			const translation = getTranslation(args.language);
			dialog = new ExportDialog({
				map,
				translation,
				sizes: resolveAllowedSizes(),
				state,
				renderPreview: mockRenderPreview(map),
				adjustArea: (view, pageSize) =>
					new AreaAdjuster({ map, translation }).adjust(view, pageSize),
				useSaveFilePicker: args.useSaveFilePicker ?? false,
				onSave: args.fail ? () => Promise.resolve(false) : mockSave(args.onsave),
				onClose: (last) => {
					state = last;
					dialog = undefined;
					args.onclose(last);
					button?.focus();
				}
			});
			dialog.open();
		};

		/** Attachment of the print button: the dialog is open when the story is shown */
		const attach = (element: HTMLButtonElement) => {
			button = element;
			open();
			return () => dialog?.close();
		};

		return { open, attach };
	};
</script>

{#snippet template(args: Args)}
	<MapFrame>
		{#snippet children(map)}
			{#key [args.language, args.fail, args.useSaveFilePicker].join()}
				{@const control = createControl(map, args)}
				<div class="maplibregl-ctrl-top-right">
					<div class="maplibregl-ctrl maplibregl-ctrl-group">
						<button
							type="button"
							class="maplibregl-ctrl-icon print"
							title="Export map"
							aria-label="Export map"
							aria-haspopup="dialog"
							onclick={control.open}
							{@attach control.attach}
						>
							<Printer size={18} />
						</button>
					</div>
				</div>
			{/key}
		{/snippet}
	</MapFrame>
{/snippet}

<Story name="Default" {template} />
<Story name="Japanese" {template} args={{ language: 'ja' }} />
<Story name="Export failed" {template} args={{ fail: true }} />
<Story name="Save file picker" {template} args={{ useSaveFilePicker: true }} />

<style>
	/* the print button of the plugins is styled by their own CSS */
	.print {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
