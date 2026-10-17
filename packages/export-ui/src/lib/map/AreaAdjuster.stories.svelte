<!-- The tools shown on the map while the exported area is adjusted -->
<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { Map } from 'maplibre-gl';
	import { fn } from 'storybook/test';
	import MapFrame from '../../stories/MapFrame.svelte';
	import { languageArgType } from '../../stories/defaults';
	import Button from '../components/Button.svelte';
	import type { Language, MapView } from '../interfaces';
	import { getTranslation } from '../local';
	import '../theme.css';
	import AreaAdjuster from './area-adjuster';

	interface Args {
		language: Language;
		/** `[width, height]` of the page in mm */
		pageSize: [number, number];
		ondone: (view: MapView | null) => void;
	}

	const { Story } = defineMeta({
		title: 'Map/AreaAdjuster',
		// shown over a MapLibre map
		parameters: { layout: 'fullscreen' },
		argTypes: { language: languageArgType },
		args: { language: 'en', pageSize: [297, 210], ondone: fn() } as Args
	});
</script>

<script lang="ts">
	let adjusting = $state(false);

	/** Show the tools on the map, starting two zoom levels in, and log the adjusted view */
	const adjust = async (map: Map, args: Args) => {
		adjusting = true;
		const center = map.getCenter();
		const view = await new AreaAdjuster({
			map,
			translation: getTranslation(args.language)
		}).adjust(
			{
				center: [center.lng, center.lat],
				zoom: map.getZoom() + 2,
				bearing: map.getBearing(),
				pitch: map.getPitch()
			},
			args.pageSize
		);
		adjusting = false;
		args.ondone(view);
	};
</script>

{#snippet template(args: Args)}
	<MapFrame>
		{#snippet children(map)}
			{#if !adjusting}
				<div class="gl-export-theme start">
					<Button
						variant="primary"
						label={getTranslation(args.language).AdjustArea}
						onclick={() => adjust(map, args)}
					/>
				</div>
			{/if}
		{/snippet}
	</MapFrame>
{/snippet}

<Story name="Landscape A4" {template} />
<Story name="Portrait A4" {template} args={{ pageSize: [210, 297] }} />

<style>
	.start {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
	}
</style>
