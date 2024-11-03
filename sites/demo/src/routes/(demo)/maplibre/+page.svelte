<script lang="ts">
	import { addProtocol, Map, Marker, NavigationControl, TerrainControl } from 'maplibre-gl';
	import {
		MaplibreExportControl,
		Size,
		PageOrientation,
		Format,
		DPI
	} from '@watergis/maplibre-gl-export';
	import { Protocol } from 'pmtiles';
	import { getContext, onMount } from 'svelte';
	import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		MAPSTORE_CONTEXT_KEY,
		type LanguageStore,
		type MapStore,
		LANGUAGE_CONTEXT_KEY
	} from '$lib/stores';

	const mapStore: MapStore = getContext(MAPSTORE_CONTEXT_KEY);
	const languageStore: LanguageStore = getContext(LANGUAGE_CONTEXT_KEY);

	let exportControl: MaplibreExportControl;

	const initExportControl = () => {
		if (!$mapStore) return;
		if (!$languageStore) return;
		if (exportControl) {
			$mapStore.removeControl(exportControl);
		}

		exportControl = new MaplibreExportControl({
			PageSize: Size.A3,
			PageOrientation: PageOrientation.Portrait,
			Format: Format.PNG,
			DPI: DPI[96],
			Crosshair: true,
			PrintableArea: true,
			Local: $languageStore
		});

		$mapStore.addControl(exportControl, 'top-right');
	};

	onMount(() => {
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);

		$mapStore = new Map({
			container: 'map',
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

		$mapStore.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');

		new Marker().setLngLat([37.30467, -0.15943]).addTo($mapStore);
		new Marker().setLngLat([30.0824, -1.9385]).addTo($mapStore);

		$mapStore.once('load', () => {
			if ($mapStore.getSource('terrarium')) {
				($mapStore as Map).addControl(
					new TerrainControl({
						source: 'terrarium',
						exaggeration: 1
					}),
					'bottom-right'
				);

				$mapStore.setMaxPitch(85);
			}
		});

		initExportControl();

		languageStore.subscribe(() => {
			initExportControl();
		});
	});
</script>

<div id="map"></div>

<style lang="scss">
	#map {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		z-index: 10;
	}
</style>
