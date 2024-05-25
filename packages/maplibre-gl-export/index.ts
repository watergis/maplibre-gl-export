import maplibregl, { Map, NavigationControl, TerrainControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from './src/lib/index';
import './src/scss/maplibre-gl-export.scss';
import { Protocol } from 'pmtiles';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const map = new Map({
	container: 'map',
	// narok vector style
	// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	// center: [35.87063, -1.08551],
	// zoom: 12,
	// terrain testing with Bing aerial
	style: 'https://unpkg.com/@undp-data/style@latest/dist/aerialstyle.json',
	center: [0, 0],
	zoom: 1,
	hash: true,
	attributionControl: false
});

map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
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
		northIconOptions: {
			position: 'top-right',
			visibility: 'visible'
		}
	}),
	'top-right'
);

map.once('load', () => {
	new maplibregl.Marker().setLngLat([37.30467, -0.15943]).addTo(map);

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
