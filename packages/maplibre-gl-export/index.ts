import {
	addProtocol,
	AttributionControl,
	Map,
	Marker,
	NavigationControl,
	setWorkerUrl,
	TerrainControl
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from './src/lib/index';
import './src/scss/maplibre-gl-export.scss';
import { Protocol } from 'pmtiles';

setWorkerUrl(workerUrl);

const protocol = new Protocol();
addProtocol('pmtiles', protocol.tile);

const map = new Map({
	container: 'map',
	// narok vector style
	// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	// center: [35.87063, -1.08551],
	// zoom: 12,
	// terrain testing with Bing aerial
	style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style-aerial.json',
	center: [0, 0],
	zoom: 1,
	hash: true,
	attributionControl: false
});

map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
map.addControl(new AttributionControl({ compact: false }), 'bottom-right');
map.addControl(
	new MaplibreExportControl({
		PageSize: Size.A3,
		PageOrientation: PageOrientation.Portrait,
		Format: Format.PNG,
		DPI: DPI[96],
		Crosshair: true,
		PrintableArea: true,
		Local: 'en',
		attributionOptions: {
			position: 'bottom-right',
			visibility: 'visible'
		},
		scalebarOptions: {
			position: 'bottom-left',
			unit: 'metric',
			visibility: 'visible'
		},
		northIconOptions: {
			position: 'top-right',
			visibility: 'visible'
		}
	}),
	'top-right'
);

// eslint-disable-next-line
// @ts-ignore
window.__map = map;

/**
 * Draw a filled disc whose alpha fades towards the edge. It is used both as a plain high
 * resolution icon and as a (crude) SDF icon by the test layers below.
 */
const createIconImage = (size: number) => {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('failed to get 2D context');
	const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);
	return ctx.getImageData(0, 0, size, size);
};

/**
 * Test layers for https://github.com/watergis/maplibre-gl-export/issues/370. `high-res-icon`
 * is rendered at 1/4 of its bitmap size through `pixelRatio`, and `sdf-icon` is tinted through
 * `icon-color`. Both only work when the image metadata is kept while the images are copied to
 * the map used for exporting, so the exported image has to look the same as the map.
 */
const addTestIcons = () => {
	map.addImage('high-res-icon', createIconImage(128), { pixelRatio: 4 });
	map.addImage('sdf-icon', createIconImage(64), { sdf: true });

	map.addSource('test-icons', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: { icon: 'high-res-icon' },
					geometry: { type: 'Point', coordinates: [37.29467, -0.15943] }
				},
				{
					type: 'Feature',
					properties: { icon: 'sdf-icon' },
					geometry: { type: 'Point', coordinates: [37.31467, -0.15943] }
				}
			]
		}
	});

	map.addLayer({
		id: 'test-icons',
		type: 'symbol',
		source: 'test-icons',
		layout: {
			'icon-image': ['get', 'icon'],
			'icon-allow-overlap': true
		},
		paint: {
			'icon-color': '#00b300'
		}
	});
};

map.once('load', () => {
	new Marker().setLngLat([37.30467, -0.15943]).addTo(map);

	addTestIcons();

	if (map.getSource('terrarium')) {
		map.addControl(
			new TerrainControl({
				source: 'terrarium',
				exaggeration: 1
			}),
			'top-right'
		);

		map.setMaxPitch(85);
	}
});
