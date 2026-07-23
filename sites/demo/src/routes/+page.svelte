<script lang="ts">
	import { onMount } from 'svelte';
	import { SegmentedControl, Tabs } from '@skeletonlabs/skeleton-svelte';
	import {
		AvailableLanguages,
		Languages,
		defaultAttributionOptions,
		defaultMarkerCirclePaint,
		defaultNorthIconOptions,
		defaultScalebarOptions
	} from '@watergis/maplibre-gl-export';
	import type { PageData } from './$types';
	import CodeBlock from '$lib/CodeBlock.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let tabs = [
		{ label: 'MapLibre GL Export', value: 'maplibre' },
		{ label: 'Mapbox GL Export', value: 'mapbox' }
	];
	let tabSet: string = $state(tabs[0].value);
	let maplibreVersionTabs = [
		{ label: 'v6 (stable)', value: 'v6' },
		{ label: 'v5', value: 'v5' }
	];
	let maplibreVersion = $state('v6');

	let imprtTypeTabs = [
		{ label: 'NPM', value: 'npm' },
		{ label: 'CDN', value: 'cdn' }
	];
	let importTypeTabSet: string = $state(imprtTypeTabs[0].value);

	let maplibreExportVersion = $state('latest');
	let mapboxExportVersion = $state('latest');
	let maplibreV5CdnExample = $state('');
	let maplibreV6CdnExample = $state('');
	let mapboxCdnExample = $state('');

	let selectedLanguage = $state('en');
	let mapboxToken = $state('Your access token');
	let packageManager = $state('npm');
	let maplibreDependencyVersion = $derived(maplibreVersion === 'v6' ? '^6.0.0' : '^5.21.1');
	let maplibreInstallSuffix = $derived(
		tabSet === 'maplibre' ? ` maplibre-gl@${maplibreDependencyVersion}` : ''
	);

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

	const getMaplibreV5CdnExample = async () => {
		const res = await fetch('/assets/maplibre-v5-cdn-example.txt');
		if (!res.ok) {
			return;
		}
		maplibreV5CdnExample = await res.text();
	};

	const getMaplibreV6CdnExample = async () => {
		const res = await fetch('/assets/maplibre-v6-cdn-example.txt');
		if (!res.ok) {
			return;
		}
		maplibreV6CdnExample = await res.text();
	};

	const getMapboxCdnExample = async () => {
		const res = await fetch('/assets/mapbox-cdn-example.txt');
		if (!res.ok) {
			return;
		}
		mapboxCdnExample = await res.text();
	};

	const northOptions = { ...defaultNorthIconOptions, image: 'bring your own SVG string' };

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
				"An `AttributionControl` is added to the hidden map used for rendering, and its element is drawn onto the exported image keeping maplibre's native styling. `compact` and `customAttribution` of maplibre's `AttributionControlOptions` can be set here, in addition to `position` and `margin`. It can be placed in any of the four corners. Set `visibility` to `none` to hide it."
		},
		{
			name: 'scalebarOptions',
			default: JSON.stringify(defaultScalebarOptions, null, 2),
			description:
				"A `ScaleControl` is added to the hidden map used for rendering, and its element is drawn onto the exported image. `maxWidth` and `unit` of maplibre's `ScaleControlOptions` can be set here, in addition to `position` and `margin`. Set `visibility` to `none` to hide it. It can also be toggled from the export panel."
		},
		{
			name: 'northIconOptions',
			default: JSON.stringify(northOptions, null, 2),
			description:
				'North icon options. It is drawn onto the exported image at the top-right corner as default, rotated to match the map bearing. The size of north icon is 5% of map width. You can customize icon image and other settings through this option. It can also be toggled from the export panel.'
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
		getMaplibreV5CdnExample();
		getMaplibreV6CdnExample();
		getMapboxCdnExample();
	});
</script>

<div class="px-4">
	<div class="text-center">
		<h2 class="h1 pt-4 pb-6">Welcome to {data.metadata.title}</h2>

		<div class="flex justify-center space-x-2 pb-4">
			{data.metadata.description}
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

			<SegmentedControl
				value={tabSet}
				onValueChange={(details) => (tabSet = details.value)}
				class="w-fit"
			>
				<SegmentedControl.Control>
					<SegmentedControl.Indicator />
					{#each tabs as tab (tab.value)}
						<SegmentedControl.Item value={tab.value}>
							<SegmentedControl.ItemText>
								{tab.label}
								{#if tab.value === 'maplibre'}
									({maplibreExportVersion})
								{:else}
									({mapboxExportVersion})
								{/if}
							</SegmentedControl.ItemText>
							<SegmentedControl.ItemHiddenInput />
						</SegmentedControl.Item>
					{/each}
				</SegmentedControl.Control>
			</SegmentedControl>

			{#if tabSet === 'maplibre'}
				<h3 class="h3 pt-6 pb-4">Select a MapLibre GL JS version</h3>
				<SegmentedControl
					value={maplibreVersion}
					onValueChange={(details) => (maplibreVersion = details.value)}
					class="w-fit"
				>
					<SegmentedControl.Control>
						<SegmentedControl.Indicator />
						{#each maplibreVersionTabs as tab (tab.value)}
							<SegmentedControl.Item value={tab.value}>
								<SegmentedControl.ItemText>{tab.label}</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
						{/each}
					</SegmentedControl.Control>
				</SegmentedControl>
			{/if}

			<h3 class="h3 pt-6 pb-4">Demo</h3>
			{#if tabSet === 'maplibre'}
				<p class="pb-3 text-sm">
					MapLibre GL JS {maplibreVersion === 'v6' ? 'v6 (stable)' : 'v5'}.
				</p>
			{/if}

			{#if tabSet === 'maplibre'}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="btn preset-filled-primary-500 btn-lg"
					href="/maplibre{maplibreVersion === 'v5' ? '-v5' : ''}?language={selectedLanguage}"
					>Open MapLibre GL JS {maplibreVersion === 'v6' ? 'v6' : 'v5'} DEMO</a
				>
			{:else}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					class="btn preset-filled-primary-500 btn-lg"
					href="/{tabSet}?language={selectedLanguage}"
				>
					Open Mapbox DEMO
				</a>
			{/if}
		</div>

		<div class="px-2">
			<h3 class="h3 pt-6 pb-4">Language</h3>
			<p>{Languages.length} languages are available in the plugin.</p>
			<br />
			<label class="label">
				<span>Select your language</span>
				<select class="select" bind:value={selectedLanguage}>
					{#each Languages as lang (lang)}
						<option value={lang.LanguageCode}>{lang.LanguageName} ({lang.LanguageCode})</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="px-2" hidden={tabSet !== 'mapbox'}>
			<h3 class="h3 pt-6 pb-4">Mapbox access token</h3>
			<label class="label">
				<span>Paste your mapbox access token here</span>
				<input class="input" type="text" placeholder="Your access token" bind:value={mapboxToken} />
			</label>
		</div>

		<Tabs
			value={importTypeTabSet}
			orientation="horizontal"
			onValueChange={(details) => {
				importTypeTabSet = details.value;
			}}
		>
			<Tabs.List>
				{#each imprtTypeTabs as tab (tab.value)}
					<Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
				{/each}
				<Tabs.Indicator />
			</Tabs.List>

			<Tabs.Content value="npm">
				<div class="p-2">
					<h3 class="h3 pt-6 pb-4">Install</h3>
					<p>Getting start with installing the package</p>

					<SegmentedControl
						value={packageManager}
						onValueChange={(details) => (packageManager = details.value)}
						class="w-fit"
					>
						<SegmentedControl.Control>
							<SegmentedControl.Indicator />
							<SegmentedControl.Item value="npm">
								<SegmentedControl.ItemText>npm</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
							<SegmentedControl.Item value="yarn">
								<SegmentedControl.ItemText>yarn</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
							<SegmentedControl.Item value="pnpm">
								<SegmentedControl.ItemText>pnpm</SegmentedControl.ItemText>
								<SegmentedControl.ItemHiddenInput />
							</SegmentedControl.Item>
						</SegmentedControl.Control>
					</SegmentedControl>

					<div class="pt-2">
						{#if packageManager === 'npm'}
							<CodeBlock
								lang="console"
								code={`npm install --save-dev @watergis/${tabSet}-gl-export${maplibreInstallSuffix}`}
							/>
						{:else if packageManager === 'yarn'}
							<CodeBlock
								lang="console"
								code={`yarn add --dev @watergis/${tabSet}-gl-export${maplibreInstallSuffix}`}
							/>
						{:else if packageManager === 'pnpm'}
							<CodeBlock
								lang="console"
								code={`pnpm add --save-dev @watergis/${tabSet}-gl-export${maplibreInstallSuffix}`}
							/>
						{/if}
					</div>

					<h3 class="h3 pt-6 pb-4">Usage</h3>

					<p>Copy and past the below code.</p>

					<CodeBlock
						lang="js"
						showLineNumber
						code={`
import { ${
							tabSet === 'mapbox'
								? 'mapboxgl, Map'
								: maplibreVersion === 'v6'
									? 'Map, setWorkerUrl'
									: 'Map'
						} } from '${tabSet}-gl';
import '${tabSet}-gl/dist/${tabSet}-gl.css';
${tabSet === 'maplibre' && maplibreVersion === 'v6' ? `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';` : ''}
import {
	${tabSet === 'maplibre' ? 'Maplibre' : 'Mapbox'}ExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/${tabSet}-gl-export';
import '@watergis/${tabSet}-gl-export/dist/${tabSet}-gl-export.css';

${
	tabSet === 'mapbox'
		? `mapboxgl.accessToken = '${mapboxToken}';`
		: maplibreVersion === 'v6'
			? 'setWorkerUrl(workerUrl);'
			: ''
}
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
			</Tabs.Content>

			<Tabs.Content value="cdn">
				<div>
					<h3 class="h3 pt-6">Usage</h3>

					<p>Copy and past the below code.</p>

					<CodeBlock
						lang="js"
						showLineNumber
						code={`
${
	tabSet === 'mapbox'
		? `${mapboxCdnExample
				.replace(/{mapboxExportVersion}/g, mapboxExportVersion)
				.replace(/{language}/g, selectedLanguage)
				.replace(/{style}/g, styleUrl)
				.replace(/{accesstoken}/g, mapboxToken)}`
		: `${(maplibreVersion === 'v6' ? maplibreV6CdnExample : maplibreV5CdnExample)
				.replace(/{maplibreExportVersion}/g, maplibreExportVersion)
				.replace(/{language}/g, selectedLanguage)
				.replace(/{style}/g, styleUrl)}`
}
			`}
					/>
				</div>
			</Tabs.Content>
		</Tabs>

		<h3 class="h3 pt-6">Parameters</h3>

		<p>
			The first argument of the constructor can accept the various parameters to customize your own
			settings.
		</p>

		<div class="table-wrap">
			<table class="table caption-bottom">
				<thead>
					<tr>
						<th>Parameter</th>
						<th>Default value</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each parameters as param (parameters.indexOf(param))}
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
				class="btn preset-outlined-surface-500"
				href="https://github.com/watergis/maplibre-gl-export/tree/main/packages/{tabSet}-gl-export#options"
				target="_blank"
				rel="noreferrer">See implementation</a
			>
		</div>
	</div>
	<hr />
	<div class="space-y-2 py-4">
		{#each data.metadata.licenses as license (data.metadata.licenses.indexOf(license))}
			<p class="space-x-2">{license}</p>
		{/each}
	</div>
</div>
