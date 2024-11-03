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

	let map: Map | undefined = $state();
	let language: Language = $state('en');
	let mapContainer: HTMLDivElement | undefined = $state();

	let exportControl: MapboxExportControl;

	const initExportControl = () => {
		if (!map) return;
		if (!language) return;
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

	$effect(() => {
		initExportControl();
	});
</script>

<div class="map" bind:this={mapContainer}></div>

{#if map}
	<LanguageSelector {map} bind:language position="bottom-left" />
{/if}

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
