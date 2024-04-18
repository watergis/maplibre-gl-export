<script lang="ts">
	import mapboxgl, { Map, Marker, NavigationControl } from 'mapbox-gl';
	import {
		MapboxExportControl,
		Size,
		PageOrientation,
		Format,
		DPI
	} from '@watergis/mapbox-gl-export';
	import { getContext, onMount } from 'svelte';
	import '@watergis/mapbox-gl-export/dist/mapbox-gl-export.css';
	import { PUBLIC_MAPBOX_ACCESSTOKEN } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import {
		MAPSTORE_CONTEXT_KEY,
		type LanguageStore,
		type MapStore,
		LANGUAGE_CONTEXT_KEY
	} from '$lib/stores';

	const mapStore: MapStore = getContext(MAPSTORE_CONTEXT_KEY);
	const languageStore: LanguageStore = getContext(LANGUAGE_CONTEXT_KEY);

	let exportControl: MapboxExportControl;

	const initExportControl = () => {
		if (!$mapStore) return;
		if (!$languageStore) return;
		if (exportControl) {
			$mapStore.removeControl(exportControl);
		}

		exportControl = new MapboxExportControl({
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
		mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESSTOKEN;
		$mapStore = new Map({
			container: 'map',
			style: 'mapbox://styles/mapbox/streets-v11',
			// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
			center: [0, 0],
			zoom: 1,
			hash: true,
			accessToken: PUBLIC_MAPBOX_ACCESSTOKEN
		});

		($mapStore as Map).addControl(new NavigationControl(), 'bottom-right');

		new Marker().setLngLat([37.30467, -0.15943]).addTo($mapStore);
		new Marker().setLngLat([30.0824, -1.9385]).addTo($mapStore);

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
