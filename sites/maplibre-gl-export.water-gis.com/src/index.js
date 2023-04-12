import { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
	MaplibreExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/maplibre-gl-export';

const map = new Map({
	container: 'map',
	style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	center: [35.87063, -1.08551],
	zoom: 12,
	hash: true
});
map.addControl(new NavigationControl({}), 'top-right');
map.addControl(
	new MaplibreExportControl({
		PageSize: Size.A3,
		PageOrientation: PageOrientation.Portrait,
		Format: Format.PNG,
		DPI: DPI[96],
		Crosshair: true,
		PrintableArea: true,
		Local: 'en'
	}),
	'top-right'
);
