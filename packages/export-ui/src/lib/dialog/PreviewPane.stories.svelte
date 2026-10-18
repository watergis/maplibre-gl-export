<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { Map } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import MapFrame from '../../stories/MapFrame.svelte';
	import { defaultDialogState, languageArgType } from '../../stories/defaults';
	import { mockRenderPreview } from '../../stories/mock-render';
	import type { Language } from '../interfaces';
	import { getTranslation } from '../local';
	import '../theme.css';
	import { toExportSettings } from '../utils/page-size';
	import PreviewPane from './PreviewPane.svelte';

	interface Args {
		language: Language;
		/** `[width, height]` of the page in mm */
		pageSize: [number, number];
		/** the preview fails to render */
		fail?: boolean;
		onadjustarea: () => void;
	}

	const { Story } = defineMeta({
		title: 'Dialog/PreviewPane',
		// shown over a MapLibre map
		parameters: { layout: 'fullscreen' },
		argTypes: { language: languageArgType },
		args: { language: 'en', pageSize: [297, 210], onadjustarea: fn() } as Args
	});

	const dialogState = defaultDialogState();

	/** Render the preview of the map below the pane with the mock renderer */
	const createRender = (map: Map, fail = false) => {
		const render = mockRenderPreview(map);
		return (size: [number, number], dpi: number) => {
			if (fail) return Promise.reject(new Error('mock failure'));
			const center = map.getCenter();
			const view = {
				center: [center.lng, center.lat] as [number, number],
				zoom: map.getZoom(),
				bearing: 0,
				pitch: 0
			};
			return render(toExportSettings(dialogState, size, view), dpi);
		};
	};
</script>

<script lang="ts">
	let preview = $state<PreviewPane>();

	/** The pane starts rendering once it is in the document */
	const start = () => {
		preview?.start();
	};
</script>

{#snippet template(args: Args)}
	<MapFrame>
		{#snippet children(map)}
			{#key [args.language, ...args.pageSize, args.fail].join()}
				<div class="gl-export-theme demo" {@attach start}>
					<PreviewPane
						bind:this={preview}
						translation={getTranslation(args.language)}
						pageSize={args.pageSize}
						render={createRender(map, args.fail)}
						getMaxDpi={() => dialogState.dpi}
						onadjustarea={args.onadjustarea}
					/>
				</div>
			{/key}
		{/snippet}
	</MapFrame>
{/snippet}

<Story name="Landscape A4" {template} />
<Story name="Portrait A4" {template} args={{ pageSize: [210, 297] }} />
<Story name="Render failed" {template} args={{ fail: true }} />

<style>
	.demo {
		position: absolute;
		top: 16px;
		left: 16px;
		display: flex;
		width: min(640px, calc(100% - 32px));
		height: min(520px, calc(100% - 32px));
		overflow: hidden;
		border-radius: var(--gl-export-radius);
		box-shadow: var(--gl-export-shadow);
		font-family: var(--gl-export-font);
		font-size: var(--gl-export-font-size);
	}
</style>
