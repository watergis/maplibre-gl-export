<script lang="ts">
	import { addProtocol, Map, NavigationControl } from 'maplibre-gl';
	import {
		MaplibreExportControl,
		Size,
		PageOrientation,
		Format,
		DPI,
		type Language
	} from '@watergis/maplibre-gl-export';
	import { Protocol } from 'pmtiles';
	import { onMount } from 'svelte';
	import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';
	import LanguageSelector from '$lib/LanguageSelector.svelte';

	let map: Map;

	let exportControl: MaplibreExportControl;
	let language: Language = 'en';

	const initExportControl = () => {
		if (exportControl) {
			map.removeControl(exportControl);
		}

		exportControl = new MaplibreExportControl({
			PageSize: Size.A3,
			PageOrientation: PageOrientation.Portrait,
			Format: Format.PNG,
			DPI: DPI[96],
			Crosshair: true,
			PrintableArea: true,
			Local: language
		});

		map.addControl(exportControl, 'top-right');
	};

	onMount(() => {
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);

		map = new Map({
			container: 'map',
			style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
			center: [35.87063, -1.08551],
			zoom: 12,
			hash: true
		});

		map.addControl(new NavigationControl(), 'bottom-right');

		initExportControl();
	});

	const handleLanguageChanged = () => {
		initExportControl();
	};
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" />
</svelte:head>

<div id="map" />

{#if map}
	<LanguageSelector
		bind:map
		bind:language
		on:change={handleLanguageChanged}
		position="bottom-left"
	/>
{/if}

<style lang="scss">
	#map {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		z-index: 10;
	}
</style>
