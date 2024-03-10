<script lang="ts">
	import mapboxgl, { Map, NavigationControl } from 'mapbox-gl';
	import {
		MapboxExportControl,
		Size,
		PageOrientation,
		Format,
		DPI,
		type Language
	} from '@watergis/mapbox-gl-export';
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@watergis/mapbox-gl-export/dist/mapbox-gl-export.css';
	import LanguageSelector from '$lib/LanguageSelector.svelte';
	import { PUBLIC_MAPBOX_ACCESSTOKEN } from '$env/static/public';

	let map: Map;

	let exportControl: MapboxExportControl;
	let language: Language = 'en';

	const handleLanguageChanged = () => {
		initExportControl();
	};

	const initExportControl = () => {
		if (exportControl) {
			map.removeControl(exportControl);
		}

		exportControl = new MapboxExportControl({
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
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESSTOKEN;
		map = new Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
			center: [35.87063, -1.08551],
			zoom: 12,
			hash: true
		});
		map.addControl(new NavigationControl({}), 'top-right');

		initExportControl();
	});
</script>

<div id="map"></div>

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
