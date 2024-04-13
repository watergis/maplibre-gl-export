<script lang="ts">
	import { CodeBlock, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import hljs from 'highlight.js/lib/core';
	import shell from 'highlight.js/lib/languages/shell';
	hljs.registerLanguage('shell', shell);

	let tabs = [
		{ label: 'Maplibre GL Export', value: 'maplibre' },
		{ label: 'Mapbox GL Export', value: 'mapbox' }
	];
	let tabSet: string = tabs[0].value;
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-10 flex flex-col items-center px-2">
		<div class="text-center">
			<h2 class="h2 pb-6">Welcome to Maplibre/Mapbox GL Export</h2>

			<div class="flex justify-center space-x-2">
				<p>
					GL Export is a Maplibre/Mapbox GL JS plugin that can export a map image in various image
					format such as PNG, JPEG, PDF and SVG
				</p>
			</div>
		</div>

		<div class="flex justify-center space-x-2">
			<p>Select your map libary</p>
		</div>

		<TabGroup>
			{#each tabs as tab}
				<Tab bind:group={tabSet} name={tab.value} value={tab.value}>{tab.label}</Tab>
			{/each}
		</TabGroup>

		<div class="space-y-2">
			<div class="flex justify-center space-x-2">
				<a class="btn variant-filled" href="/{tabSet}" target="_blank" rel="noreferrer">
					Open DEMO
				</a>
			</div>

			<h3 class="h3 pt-6">Install</h3>
			<p>Getting start with installing the package</p>

			<CodeBlock language="shell" lineNumbers code={`pnpm i -D @watergis/${tabSet}-gl-export`} />

			<h3 class="h3 pt-6">Usage</h3>
			<p>Add Export Control to your map!</p>

			<CodeBlock
				language="ts"
				lineNumbers
				code={`
import {  Map } from '${tabSet}-gl';
import '${tabSet}-gl/dist/${tabSet}-gl.css';
import {
	${tabSet === 'maplibre' ? 'Maplibre' : 'Mapbox'}ExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/${tabSet}-gl-export';
import '@watergis/${tabSet}-gl-export/dist/${tabSet}-gl-export.css';

const map = new Map({
	container: 'map',
	style: 'Your style file',
});

const exportControl = new ${tabSet === 'maplibre' ? 'Maplibre' : 'Mapbox'}ExportControl({
	PageSize: Size.A3,
	PageOrientation: PageOrientation.Portrait,
	Format: Format.PNG,
	DPI: DPI[96],
	Crosshair: true,
	PrintableArea: true,
	Local: 'en'
});
map.addControl(exportControl, 'top-right');
			`}
			/>

			<h3 class="h3 pt-6">API</h3>

			<div class="flex justify-center space-x-2">
				<a
					class="btn variant-filled"
					href="https://github.com/watergis/maplibre-gl-export/tree/main/packages/{tabSet}-gl-export#options"
					target="_blank"
					rel="noreferrer">See documentation</a
				>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
</style>
