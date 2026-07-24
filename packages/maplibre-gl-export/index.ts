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
 * Draw a thick ring with a white outline, which stands out on both light and dark imagery.
 * Only the alpha channel is used when the image is added as an SDF icon, so the same shape
 * works for both test icons.
 * @param size length of a side of the bitmap in pixels
 * @param color fill color of the ring. Ignored when the image is used as an SDF icon
 */
const createIconImage = (size: number, color: string) => {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('failed to get 2D context');
	const center = size / 2;
	const disc = (radius: number, fillStyle: string) => {
		ctx.fillStyle = fillStyle;
		ctx.beginPath();
		ctx.arc(center, center, radius, 0, Math.PI * 2);
		ctx.fill();
	};
	// white outline, then the ring itself
	disc(size * 0.5, '#ffffff');
	disc(size * 0.42, color);
	// punch the middle out so the icon reads as a ring
	ctx.globalCompositeOperation = 'destination-out';
	disc(size * 0.2, '#000000');
	return ctx.getImageData(0, 0, size, size);
};

/**
 * Test layers for https://github.com/watergis/maplibre-gl-export/issues/370. `high-res-icon`
 * is rendered at 1/4 of its bitmap size through `pixelRatio`, so it has to come out half as
 * wide as `sdf-icon`, which is in turn tinted green through `icon-color`. Both only work when
 * the image metadata is kept while the images are copied to the map used for exporting, so the
 * exported image has to look the same as the map.
 *
 * They are placed next to the initial center of the map so they are visible without panning.
 */
const addTestIcons = () => {
	map.addImage('high-res-icon', createIconImage(128, '#d63b3b'), { pixelRatio: 4 });
	map.addImage('sdf-icon', createIconImage(64, '#000000'), { sdf: true });

	map.addSource('test-icons', {
		type: 'geojson',
		data: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: { icon: 'high-res-icon' },
					geometry: { type: 'Point', coordinates: [-25, 0] }
				},
				{
					type: 'Feature',
					properties: { icon: 'sdf-icon' },
					geometry: { type: 'Point', coordinates: [25, 0] }
				}
			]
		}
	});

	// SDF and non-SDF icons cannot be mixed in one symbol layer: the layer takes the flag of
	// the first icon it rasterizes, so `icon-color` would silently stop working. They get one
	// layer each.
	map.addLayer({
		id: 'test-icons-high-res',
		type: 'symbol',
		source: 'test-icons',
		filter: ['==', ['get', 'icon'], 'high-res-icon'],
		layout: {
			'icon-image': ['get', 'icon'],
			'icon-allow-overlap': true
		}
	});

	map.addLayer({
		id: 'test-icons-sdf',
		type: 'symbol',
		source: 'test-icons',
		filter: ['==', ['get', 'icon'], 'sdf-icon'],
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
