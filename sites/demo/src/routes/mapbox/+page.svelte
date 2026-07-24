<script lang="ts">
	import mapboxgl, { Map, Marker, NavigationControl } from 'mapbox-gl';
	import {
		MapboxExportControl,
		Size,
		PageOrientation,
		Format,
		DPI,
		type Language
	} from '@watergis/mapbox-gl-export';
	import { onMount } from 'svelte';
	import '@watergis/mapbox-gl-export/dist/mapbox-gl-export.css';
	import { PUBLIC_MAPBOX_ACCESSTOKEN } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import LanguageSelector from '$lib/LanguageSelector.svelte';
	import { page } from '$app/stores';

	let map: Map | undefined = $state();
	let language: Language = $state(($page.url.searchParams.get('language') as Language) ?? 'en');
	let mapContainer: HTMLDivElement | undefined = $state();

	let exportControl: MapboxExportControl;
	let onExportControl: MapboxExportControl;

	let exportedImage: { url: string; fileName: string; format: string; size: number } | undefined =
		$state();

	const clearExportedImage = () => {
		if (!exportedImage) return;
		URL.revokeObjectURL(exportedImage.url);
		exportedImage = undefined;
	};

	const initExportControl = () => {
		if (!map) return;
		if (!language) return;
		if (exportControl) {
			map.removeControl(exportControl);
		}
		if (onExportControl) {
			map.removeControl(onExportControl);
		}

		exportControl = new MapboxExportControl({
			PageSize: Size.A3,
			PageOrientation: PageOrientation.Portrait,
			Format: Format.PNG,
			DPI: DPI[96],
			Crosshair: true,
			PrintableArea: true,
			Local: language
			// AllowedSizes: [
			// 	'A4',
			// 	{ name: '16:9', size: [320, 180] },
			// 	{ name: 'Square', size: [200, 200] },
			// 	{ name: '', size: [0, 0] } as never
			// ]
		});

		map.addControl(exportControl, 'top-right');

		// second control to test `onExport`. The image is not downloaded, it is shown in the panel below instead.
		onExportControl = new MapboxExportControl({
			PageSize: Size.A4,
			PageOrientation: PageOrientation.Landscape,
			Format: Format.PNG,
			DPI: DPI[96],
			Crosshair: true,
			PrintableArea: true,
			Local: language,
			download: false,
			onExport: ({ blob, fileName, format }) => {
				clearExportedImage();
				exportedImage = {
					url: URL.createObjectURL(blob),
					fileName,
					format,
					size: blob.size
				};
			}
		});

		map.addControl(onExportControl, 'top-left');
	};

	onMount(() => {
		if (!mapContainer) return;
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESSTOKEN;
		map = new Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/standard',
			// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
			center: [0, 0],
			zoom: 1,
			hash: true,
			accessToken: PUBLIC_MAPBOX_ACCESSTOKEN
		});

		(map as Map).addControl(new NavigationControl(), 'bottom-right');

		new Marker().setLngLat([37.30467, -0.15943]).addTo(map);
		new Marker().setLngLat([30.0824, -1.9385]).addTo(map);

		initExportControl();
	});

	const onLanguageChange = (lang: Language) => {
		language = lang;
		initExportControl();
	};
</script>

<div class="map" bind:this={mapContainer}></div>

{#if map}
	<LanguageSelector {map} bind:language position="bottom-left" change={onLanguageChange} />
{/if}

{#if exportedImage}
	<div class="export-result">
		<div class="export-result-header">
			<span>onExport result</span>
			<button type="button" onclick={clearExportedImage} aria-label="close">✕</button>
		</div>
		<img src={exportedImage.url} alt="exported map" />
		<div class="export-result-meta">
			<div>{exportedImage.fileName}</div>
			<div>{exportedImage.format} / {(exportedImage.size / 1024).toFixed(1)} KB</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.export-result {
		position: absolute;
		bottom: 30px;
		left: 200px;
		z-index: 10;
		width: 260px;
		padding: 8px;
		border-radius: 4px;
		background: #fff;
		color: #000;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

		.export-result-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-weight: bold;
			margin-bottom: 6px;

			button {
				border: none;
				background: none;
				cursor: pointer;
				font-size: 14px;
				line-height: 1;
			}
		}

		img {
			display: block;
			width: 100%;
			height: auto;
			border: 1px solid #ccc;
		}

		.export-result-meta {
			margin-top: 6px;
			font-size: 12px;
			word-break: break-all;
		}
	}
</style>
