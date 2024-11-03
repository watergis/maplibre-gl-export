<script lang="ts">
	import { onMount } from 'svelte';
	import { CodeBlock, RadioGroup, RadioItem, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import {
		AvailableLanguages,
		Languages,
		defaultAttributionOptions,
		defaultMarkerCirclePaint,
		defaultNorthIconOptions
	} from '@watergis/maplibre-gl-export';

	let tabs = [
		{ label: 'Maplibre GL Export', value: 'maplibre' },
		{ label: 'Mapbox GL Export', value: 'mapbox' }
	];
	let tabSet: string = $state(tabs[0].value);

	let imprtTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = $state(imprtTypeTabs[0].value);

	let maplibreExportVersion = $state('latest');
	let mapboxExportVersion = $state('latest');
	let maplibreCdnExample = $state('');
	let mapboxCdnExample = $state('');

	let selectedLanguage = $state('en');
	let mapboxToken = $state('Your access token');
	let packageManager = $state('npm');

	let styleUrl = $derived(
		tabSet === 'maplibre'
			? 'https://demotiles.maplibre.org/style.json'
			: 'mapbox://styles/mapbox/streets-v11'
	);

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

	const northOptions = defaultNorthIconOptions;
	northOptions.image = 'bring your own SVG string';

	const parameters = [
		{
			name: 'PageSize',
			default: 'A4',
			description: 'You can select from `A2` to `A6` or `B2` to `B6`'
		},
		{
			name: 'PageOrientation',
			default: 'landscape',
			description: 'You can select `landscape` or `portrait`'
		},
		{
			name: 'Format',
			default: 'PDF',
			description: 'You can select it from `jpg`, `png`, `svg` and `pdf`'
		},
		{
			name: 'DPI',
			default: '300',
			description: 'You can select it from `72`, `96`, `200`, `300` and `400`.'
		},
		{
			name: 'Crosshair',
			default: 'false',
			description:
				'Display crosshair on the map. it helps to adjust the map center before printing. It accepts `true` and `false` value'
		},
		{
			name: 'PritableArea',
			default: 'false',
			description:
				'Display printable area on the map it helps to adjust pritable area before printing. . It accepts `true` and `false`'
		},
		{
			name: 'Local',
			default: 'en',
			description: `Available from ${Languages.length} languages: ${AvailableLanguages.join(', ')}`
		},
		{
			name: 'AllowedSizes',
			default: `
[
   "LETTER",
   "A2",
   "A3",
   "A4",
   "A5",
   "A6",
   "B2",
   "B3",
   "B4",
   "B5",
   "B6"
]`,
			description:
				"list of allowed page sizes for export. available values `'LETTER'`, `'A2'`, `'A3'`, `'A4'`, `'A5'`, `'A6'`, `'B2'`, `'B3'`, `'B4'`, `'B5'`, `'B6'`"
		},
		{
			name: 'Filename',
			default: 'map',
			description:
				'file name template, file part. Use default `map`, the file name will be like `map.pdf`'
		},
		{
			name: 'markerCirclePaint',
			default: JSON.stringify(defaultMarkerCirclePaint, null, 2),
			description:
				'The plugin will convert marker SVG to circle layer to be exported. Set your own circle paint property setting. As default, the following paint setting will be applied'
		},
		{
			name: 'attributionOptions',
			default: JSON.stringify(defaultAttributionOptions, null, 2),
			description:
				'This plugin will try to add attribution to the bottom-right or top-right of the image as a maplibre symbol layer. The default style of attribution label can be changed per your preference. For fallbackTextFont property, it will only be used when font information cannot be fetched from style object. If glyphs property is not set to your style object, attribution will not be added. You can hide it if none is set to visibility.'
		},
		{
			name: 'northIconOptions',
			default: JSON.stringify(northOptions, null, 2),
			description:
				'North icon options. It is shown at top-right of corner of exported map as default. The size of north icon is 5% of map width. You can customize icon image and other settings through this option. North icon is not rendered when zoom level is less than 2 and landscape mode since it appears twice.'
		},
		{
			name: 'accessToken',
			default: 'mapboxgl.accessToken is used as default',
			description: 'Mapbox access token is required'
		}
	];

	onMount(() => {
		getMaplibreExportVersion();
		getMapboxExportVersion();
		getMaplibreCdnExample();
		getMapboxCdnExample();
	});
</script>

<div class="px-4">
	<div class="text-center">
		<h2 class="h1 pt-4 pb-6">Welcome to Maplibre/Mapbox GL Export</h2>

		<div class="flex justify-center space-x-2 pb-4">
			Maplibre/Mapbox GL Export is a Maplibre/Mapbox GL JS plugin that can export a map image in
			various image format such as PNG, JPEG, PDF and SVG without any server!
		</div>

		<div class="flex justify-center space-x-2">
			<img
				class=" h-auto max-w-sm md:max-w-lg rounded-lg"
				src="/assets/plugin-overview.webp"
				alt="Overview of Plugin"
			/>
		</div>
	</div>

	<div class="space-y-2">
		<div class="px-2">
			<h3 class="h3 pt-6 pb-4">Select a map library</h3>

			<RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
				{#each tabs as tab}
					<RadioItem bind:group={tabSet} name="justify" value={tab.value}>
						{tab.label}
						{#if tab.value === 'maplibre'}
							({maplibreExportVersion})
						{:else}
							({mapboxExportVersion})
						{/if}
					</RadioItem>
				{/each}
			</RadioGroup>

			<h3 class="h3 pt-6 pb-4">Demo</h3>

			<a
				class="btn variant-filled-primary capitalize"
				href="/{tabSet}?language={selectedLanguage}"
				target="_blank"
				rel="noreferrer"
			>
				Open {tabSet} DEMO
			</a>
		</div>

		<div class="px-2">
			<h3 class="h3 pt-6 pb-4">Language</h3>
			<p>{Languages.length} languages are available in the plugin.</p>
			<br />
			<label class="label">
				<span>Select your language</span>
				<select class="select" bind:value={selectedLanguage}>
					{#each Languages as lang}
						<option value={lang.LanguageCode}>{lang.LanguageName} ({lang.LanguageCode})</option>
					{/each}
				</select>
			</label>
		</div>

		<TabGroup>
			{#each imprtTypeTabs as tab}
				<Tab bind:group={importTypeTabSet} name={tab.value} value={tab.value}>{tab.label}</Tab>
			{/each}
		</TabGroup>

		<div class="px-2" hidden={tabSet !== 'mapbox'}>
			<h3 class="h3 pt-6 pb-4">Mapbox access token</h3>
			<label class="label">
				<span>Paste your mapbox access token here</span>
				<input class="input" type="text" placeholder="Your access token" bind:value={mapboxToken} />
			</label>
		</div>

		<div class="p-2" hidden={importTypeTabSet !== 'npm'}>
			<h3 class="h3 pt-6 pb-4">Install</h3>
			<p>Getting start with installing the package</p>

			<RadioGroup active="variant-filled-primary" hover="hover:variant-soft-primary">
				<RadioItem bind:group={packageManager} name="justify" value={'npm'}>npm</RadioItem>
				<RadioItem bind:group={packageManager} name="justify" value={'yarn'}>yarn</RadioItem>
				<RadioItem bind:group={packageManager} name="justify" value={'pnpm'}>pnpm</RadioItem>
			</RadioGroup>

			<div class="pt-2">
				{#if packageManager === 'npm'}
					<CodeBlock
						language="shell"
						code={`npm install --save-dev @watergis/${tabSet}-gl-export`}
					/>
				{:else if packageManager === 'yarn'}
					<CodeBlock language="shell" code={`yarn add --dev @watergis/${tabSet}-gl-export`} />
				{:else if packageManager === 'pnpm'}
					<CodeBlock language="shell" code={`pnpm add --save-dev @watergis/${tabSet}-gl-export`} />
				{/if}
			</div>

			<h3 class="h3 pt-6 pb-4">Usage</h3>

			<p>Copy and past the below code.</p>

			<CodeBlock
				language="ts"
				lineNumbers
				code={`
import {  ${tabSet === 'mapbox' ? 'mapboxgl, ' : ''}Map } from '${tabSet}-gl';
import '${tabSet}-gl/dist/${tabSet}-gl.css';
import {
	${tabSet === 'maplibre' ? 'Maplibre' : 'Mapbox'}ExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/${tabSet}-gl-export';
import '@watergis/${tabSet}-gl-export/dist/${tabSet}-gl-export.css';

${tabSet === 'mapbox' ? `mapboxgl.accessToken='${mapboxToken}'` : ''}
const map = new Map({
	container: 'map',
	style: '${styleUrl}',
});

const exportControl = new ${tabSet === 'maplibre' ? 'Maplibre' : 'Mapbox'}ExportControl({
	PageSize: Size.A3,
	PageOrientation: PageOrientation.Portrait,
	Format: Format.PNG,
	DPI: DPI[96],
	Crosshair: true,
	PrintableArea: true,
	Local: '${selectedLanguage}',
	${tabSet === 'mapbox' ? `accessToken: '${mapboxToken}',` : ''}
});
map.addControl(exportControl, 'top-right');
			`}
			/>
		</div>

		<div hidden={importTypeTabSet !== 'cdn'}>
			<h3 class="h3 pt-6">Usage</h3>

			<p>Copy and past the below code.</p>

			<CodeBlock
				language="html"
				lineNumbers
				code={`
${
	tabSet === 'mapbox'
		? `${mapboxCdnExample
				.replace(/{mapboxExportVersion}/g, mapboxExportVersion)
				.replace(/{language}/g, selectedLanguage)
				.replace(/{style}/g, styleUrl)
				.replace(/{accesstoken}/g, mapboxToken)}`
		: `${maplibreCdnExample
				.replace(/{maplibreExportVersion}/g, maplibreExportVersion)
				.replace(/{language}/g, selectedLanguage)
				.replace(/{style}/g, styleUrl)}`
}
			`}
			/>
		</div>

		<h3 class="h3 pt-6">Parameters</h3>

		<p>
			The first argument of the constructor can accept the various parameters to customize your own
			settings.
		</p>

		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Parameter</th>
						<th>Default value</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					{#each parameters as param}
						{#if !(tabSet === 'maplibre' && param.name === 'accessToken')}
							<tr>
								<td>{param.name}</td>
								<td>
									{param.default}
								</td>
								<td>{param.description}</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>

		<div class="flex justify-center space-x-2 py-6">
			<a
				class="btn variant-filled-secondary"
				href="https://github.com/watergis/maplibre-gl-export/tree/main/packages/{tabSet}-gl-export#options"
				target="_blank"
				rel="noreferrer">See implementation</a
			>
		</div>
	</div>
</div>

<style lang="postcss">
</style>
