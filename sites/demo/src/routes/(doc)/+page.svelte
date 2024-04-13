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

	let imprtTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = imprtTypeTabs[0].value;
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
			<p>Select your map library</p>
		</div>

		<TabGroup>
			{#each tabs as tab}
				<Tab bind:group={tabSet} name={tab.value} value={tab.value}>{tab.label}</Tab>
			{/each}
		</TabGroup>

		<div class="space-y-2">
			<div class="flex justify-center space-x-2">
				<a
					class="btn variant-filled-primary capitalize"
					href="/{tabSet}"
					target="_blank"
					rel="noreferrer"
				>
					Open {tabSet} DEMO
				</a>
			</div>

			<TabGroup>
				{#each imprtTypeTabs as tab}
					<Tab bind:group={importTypeTabSet} name={tab.value} value={tab.value}>{tab.label}</Tab>
				{/each}
			</TabGroup>

			<div hidden={importTypeTabSet !== 'npm'}>
				<h3 class="h3 pt-6 pb-4">Install</h3>
				<p>Getting start with installing the package</p>

				<p class="pt-6 pb-4">npm</p>
				<CodeBlock
					language="shell"
					lineNumbers
					code={`npm install --save-dev @watergis/${tabSet}-gl-export`}
				/>

				<p class="pt-6 pb-4">yarn</p>
				<CodeBlock
					language="shell"
					lineNumbers
					code={`yarn add --dev @watergis/${tabSet}-gl-export`}
				/>

				<p class="pt-6 pb-4">pnpm</p>
				<CodeBlock
					language="shell"
					lineNumbers
					code={`pnpm add --save-dev @watergis/${tabSet}-gl-export`}
				/>

				<h3 class="h3 pt-6 pb-4">Usage</h3>

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
			</div>

			<div hidden={importTypeTabSet !== 'cdn'}>
				<h3 class="h3 pt-6">Usage</h3>

				<CodeBlock
					language="html"
					lineNumbers
					code={`
${
	tabSet === 'mapbox'
		? `
<script src='https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js'></script>
<link href='https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css' rel='stylesheet' />

<link href="https://cdn.jsdelivr.net/npm/@watergis/mapbox-gl-export@3.0.4/dist/mapbox-gl-export.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/@watergis/mapbox-gl-export@3.0.4/dist/mapbox-gl-export.umd.js"></script>

<script>
	mapboxgl.accessToken = 'Your access token'
	const map = new mapboxgl.Map({
		container: 'map',
		style: 'Your style file',
	});
	map.addControl(new MapboxExportControl.MapboxExportControl({
		PageSize: MapboxExportControl.Size.A4,
		PageOrientation: MapboxExportControl.PageOrientation.Landscape,
		Format: MapboxExportControl.Format.PNG,
		DPI: MapboxExportControl.DPI[300],
		Crosshair: true,
		PrintableArea: true,
		Local: 'fr',
		accessToken: mapboxgl.accessToken
	}), 'top-right');
</script>
`
		: `
<script src='https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js'></script>
<link href='https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css' rel='stylesheet' />

<link href="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-export@3.2.4/dist/maplibre-gl-export.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/@watergis/maplibre-gl-export@3.2.4/dist/maplibre-gl-export.umd.js"></script>

<script>
	const map = new maplibregl.Map({
		container: 'map',
		style: 'Your style file',
	});
	map.addControl(new MaplibreExportControl.MaplibreExportControl({
		PageSize: MaplibreExportControl.Size.A4,
		PageOrientation: MaplibreExportControl.PageOrientation.Landscape,
		Format: MaplibreExportControl.Format.PNG,
		DPI: MaplibreExportControl.DPI[300],
		Crosshair: true,
		PrintableArea: true,
		Local: 'fr'
	}), 'top-right');
</script>
`
}
			`}
				/>
			</div>

			<div class="flex justify-center space-x-2 py-6">
				<a
					class="btn variant-filled-secondary"
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
