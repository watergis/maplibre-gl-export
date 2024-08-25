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
