<script lang="ts">
	import { onMount } from 'svelte';
	import { CodeBlock, Tab, TabGroup } from '@skeletonlabs/skeleton';

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

	let maplibreExportVersion = 'latest';
	let mapboxExportVersion = 'latest';
	let maplibreCdnExample = '';
	let mapboxCdnExample = '';

	const getMaplibreExportVersion = async () => {
		const res = await fetch('https://registry.npmjs.org/@watergis/maplibre-gl-export/latest');
		if (!res.ok) {
			return;
		}
		const json = await res.json();
		maplibreExportVersion = json.version;
	};

	const getMapboxExportVersion = async () => {
		const res = await fetch('https://registry.npmjs.org/@watergis/mapbox-gl-export/latest');
		if (!res.ok) {
			return;
		}
		const json = await res.json();
		mapboxExportVersion = json.version;
	};

	const getMaplibreCdnExample = async () => {
		const res = await fetch('/assets/maplibre-cdn-example.txt');
		if (!res.ok) {
			return;
		}
		maplibreCdnExample = await res.text();
	};

	const getMapboxCdnExample = async () => {
		const res = await fetch('/assets/mapbox-cdn-example.txt');
		if (!res.ok) {
			return;
		}
		mapboxCdnExample = await res.text();
	};

	onMount(() => {
		getMaplibreExportVersion();
		getMapboxExportVersion();
		getMaplibreCdnExample();
		getMapboxCdnExample();
	});
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-10 flex flex-col items-center px-2">
		<div class="text-center">
			<h2 class="h1 pt-4 pb-6">Welcome to Maplibre/Mapbox GL Export</h2>

			<div class="flex justify-center space-x-2 pb-4">
				<p>
					Maplibre/Mapbox GL Export is a Maplibre/Mapbox GL JS plugin that can export a map image in
					various image format such as PNG, JPEG, PDF and SVG without any server!
				</p>
			</div>

			<div class="flex justify-center space-x-2">
				<img
					class=" h-auto max-w-xl rounded-lg"
					src="/assets/plugin-overview.webp"
					alt="Overview of Plugin"
				/>
			</div>
		</div>

		<div class="flex justify-center space-x-2">
			<p>Select your map library</p>
		</div>

		<TabGroup>
			{#each tabs as tab}
				<Tab bind:group={tabSet} name={tab.value} value={tab.value}>
					{tab.label}
					{#if tab.value === 'maplibre'}
						({maplibreExportVersion})
					{:else}
						({mapboxExportVersion})
					{/if}
				</Tab>
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

				<h4 class="h4 pt-6 pb-4">npm</h4>
				<CodeBlock language="shell" code={`npm install --save-dev @watergis/${tabSet}-gl-export`} />

				<h4 class="h4 pt-6 pb-4">yarn</h4>
				<CodeBlock language="shell" code={`yarn add --dev @watergis/${tabSet}-gl-export`} />

				<h4 class="h4 pt-6 pb-4">pnpm</h4>
				<CodeBlock language="shell" code={`pnpm add --save-dev @watergis/${tabSet}-gl-export`} />

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
		? `${mapboxCdnExample.replace(/{mapboxExportVersion}/g, mapboxExportVersion)}`
		: `${maplibreCdnExample.replace(/{maplibreExportVersion}/g, maplibreExportVersion)}`
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
