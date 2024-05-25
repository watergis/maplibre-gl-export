<script lang="ts">
	import { MapExportControl, MapExportPanel } from '$lib';
	import { Map, addProtocol } from 'maplibre-gl';
	import { Protocol } from 'pmtiles';
	import { onMount } from 'svelte';

	let mapContainer: HTMLDivElement;
	let map: Map;

	onMount(async () => {
		const protocol = new Protocol();
		addProtocol('pmtiles', protocol.tile);
		map = new Map({
			container: mapContainer,
			style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json'
		});
	});
</script>

<sveltekit:head>
	<title>Svelte maplibre export example</title>
</sveltekit:head>

<div class="map" bind:this={mapContainer}>
	<div class="export-container">
		{#if map}
			<MapExportPanel bind:map />
		{/if}
	</div>
</div>
{#if map}
	<MapExportControl bind:map showPrintableArea={true} showCrosshair={true} />
{/if}

<style lang="scss">
	@import 'maplibre-gl/dist/maplibre-gl.css';

	.map {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		z-index: 1;

		.export-container {
			position: absolute;
			top: 10px;
			left: 10px;
			z-index: 10;
		}
	}
</style>
