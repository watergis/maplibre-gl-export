<script lang="ts">
	import { addProtocol, Map, Marker, NavigationControl, TerrainControl } from 'maplibre-gl';
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
	import 'maplibre-gl/dist/maplibre-gl.css';
	import LanguageSelector from '$lib/LanguageSelector.svelte';

	let map: Map | undefined = $state();
	let language: Language = $state('en');
	let mapContainer: HTMLDivElement | undefined = $state();

	let exportControl: MaplibreExportControl;

	const initExportControl = () => {
		if (!map) return;
		if (!language) return;
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
		if (!mapContainer) return;
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);

		map = new Map({
			container: mapContainer,
			// narok vector style
			// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
			// center: [35.87063, -1.08551],
			// zoom: 12,
			// terrain testing with Bing aerial
			style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style-aerial.json',
			center: [0, 0],
			zoom: 1,
			hash: true
		});

		map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');

		new Marker().setLngLat([37.30467, -0.15943]).addTo(map);
		new Marker().setLngLat([30.0824, -1.9385]).addTo(map);

		map.once('load', () => {
			if (map?.getSource('terrarium')) {
				(map as Map).addControl(
					new TerrainControl({
						source: 'terrarium',
						exaggeration: 1
					}),
					'bottom-right'
				);

				map.setMaxPitch(85);
			}
		});

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
