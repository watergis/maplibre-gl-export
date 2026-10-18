<!--
	MapLibre map filling the story, with the story content shown over it.
	`children` receives the map once its style is loaded.
-->
<script lang="ts">
	import { Map, setWorkerUrl } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import { onMount, type Snippet } from 'svelte';

	// the worker is not found once Vite has pre-bundled maplibre-gl
	setWorkerUrl(workerUrl);

	interface Props {
		/** content shown over the map */
		children?: Snippet<[Map]>;
	}

	let { children }: Props = $props();

	let container: HTMLDivElement;
	let map = $state.raw<Map>();

	onMount(() => {
		const instance = new Map({
			container,
			style: 'https://demotiles.maplibre.org/style.json',
			center: [138.2, 36.2],
			zoom: 4,
			// the mock preview copies the canvas of the map
			canvasContextAttributes: { preserveDrawingBuffer: true }
		});
		instance.once('load', () => (map = instance));
		return () => instance.remove();
	});
</script>

<div class="map-frame">
	<div class="map-frame__map" bind:this={container}></div>
	{#if map && children}
		{@render children(map)}
	{/if}
</div>

<style>
	.map-frame {
		position: relative;
		width: 100%;
		height: 100vh;
	}

	.map-frame__map {
		position: absolute;
		inset: 0;
	}
</style>
