<script lang="ts">
	import {
		addProtocol,
		GlobeControl,
		Map,
		Marker,
		NavigationControl,
		setWorkerUrl,
		TerrainControl
	} from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
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
	import LanguageSelector from '#lib/LanguageSelector.svelte';
	import { page } from '$app/state';
	import mlcontour from 'maplibre-contour';

	let map: Map | undefined = $state();
	let language: Language = $state((page.url.searchParams.get('language') as Language) ?? 'en');
	let mapContainer: HTMLDivElement | undefined = $state();

	let exportControl: MaplibreExportControl;
	let onExportControl: MaplibreExportControl;

	let exportedImage: { url: string; fileName: string; format: string; size: number } | undefined =
		$state();

	setWorkerUrl(workerUrl);

	// Mapterhorn terrain tiles in Terrarium encoding. See https://mapterhorn.com
	const demSource = new mlcontour.DemSource({
		url: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
		encoding: 'terrarium',
		maxzoom: 12,
		worker: true
	});
	// registers the `dem-contour` and `dem-shared` protocols
	demSource.setupMaplibre({ addProtocol });

	const addContourLayers = (map: Map) => {
		const attribution = "<a href='https://mapterhorn.com/attribution'>© Mapterhorn</a>";

		map.addSource('terrarium', {
			type: 'raster-dem',
			tiles: [demSource.sharedDemProtocolUrl],
			encoding: 'terrarium',
			tileSize: 512,
			maxzoom: 12,
			attribution
		});

		map.addSource('contour-source', {
			type: 'vector',
			tiles: [
				demSource.contourProtocolUrl({
					thresholds: {
						// zoom: [minor, major]
						11: [200, 1000],
						12: [100, 500],
						14: [50, 200],
						15: [20, 100]
					},
					// optional, override vector tile parameters:
					contourLayer: 'contours',
					elevationKey: 'ele',
					levelKey: 'level',
					extent: 4096,
					buffer: 1
				})
			],
			maxzoom: 15,
			attribution
		});

		map.addLayer({
			id: 'contour-lines',
			type: 'line',
			source: 'contour-source',
			'source-layer': 'contours',
			paint: {
				'line-color': 'rgba(255,255,255, 50%)',
				// level = highest index in thresholds array the elevation is a multiple of
				'line-width': ['match', ['get', 'level'], 1, 1, 0.5]
			}
		});

		map.addLayer({
			id: 'contour-labels',
			type: 'symbol',
			source: 'contour-source',
			'source-layer': 'contours',
			filter: ['>', ['get', 'level'], 0],
			layout: {
				'symbol-placement': 'line',
				'text-size': 10,
				'text-field': ['concat', ['number-format', ['get', 'ele'], {}], 'm'],
				'text-font': ['sans-serif']
			},
			paint: {
				'text-halo-color': 'white',
				'text-halo-width': 1
			}
		});
	};

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

		exportControl = new MaplibreExportControl({
			PageSize: Size.A3,
			PageOrientation: PageOrientation.Portrait,
			Format: Format.PNG,
			DPI: DPI[96],
			Local: language,
			// georeference exported PDF as GeoPDF (default is true)
			geoPdf: true
			// AllowedSizes: [
			// 	'A4',
			// 	{ name: '16:9', size: [320, 180] },
			// 	{ name: 'Square', size: [200, 200] },
			// 	{ name: '', size: [0, 0] } as never
			// ]
		});

		map.addControl(exportControl, 'top-right');

		// second control to test `onExport`. The image is not downloaded, it is shown in the panel below instead.
		onExportControl = new MaplibreExportControl({
			PageSize: Size.A4,
			PageOrientation: PageOrientation.Landscape,
			Format: Format.PNG,
			DPI: DPI[96],
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
		map.addControl(new GlobeControl(), 'bottom-right');

		new Marker().setLngLat([37.30467, -0.15943]).addTo(map);
		new Marker().setLngLat([30.0824, -1.9385]).addTo(map);

		map.once('load', () => {
			if (map) {
				addContourLayers(map);
			}
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
