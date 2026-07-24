import mapboxgl from 'mapbox-gl';
import { MapboxExportControl, Size, PageOrientation, Format, DPI } from './src/lib/index';
import './src/scss/mapbox-gl-export.scss';
import { IControl } from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESSTOKEN;
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/standard',
	// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	center: [35.87063, -1.08551],
	zoom: 12,
	hash: true
});
map.addControl(
	new MapboxExportControl({
		PageSize: Size.A3,
		PageOrientation: PageOrientation.Portrait,
		Format: Format.PNG,
		DPI: DPI[96],
		Crosshair: true,
		PrintableArea: true,
		Local: 'en'
	}) as unknown as IControl,
	'top-right'
);

new mapboxgl.Marker().setLngLat([37.30467, -0.15943]).addTo(map);

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
map.once('load', () => {
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
					geometry: { type: 'Point', coordinates: [35.86063, -1.08551] }
				},
				{
					type: 'Feature',
					properties: { icon: 'sdf-icon' },
					geometry: { type: 'Point', coordinates: [35.88063, -1.08551] }
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
});
