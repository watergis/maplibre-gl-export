import maplibregl, { Map, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
	MaplibreExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/maplibre-gl-export';
import { Protocol } from 'pmtiles';
import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

const map = new Map({
	container: 'map',
	style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	center: [35.87063, -1.08551],
	zoom: 12,
	hash: true
});
map.addControl(new NavigationControl({}), 'top-right');

const languageOption = document.getElementById('language');
languageOption.value = 'en';

let exportControl = new MaplibreExportControl({
	PageSize: Size.A3,
	PageOrientation: PageOrientation.Portrait,
	Format: Format.PNG,
	DPI: DPI[96],
	Crosshair: true,
	PrintableArea: true,
	Local: languageOption.value
});

map.addControl(exportControl, 'top-right');

languageOption.addEventListener('change', () => {
	if (exportControl) {
		map.removeControl(exportControl);
	}

	const language = document.getElementById('language');
	exportControl = new MaplibreExportControl({
		PageSize: Size.A3,
		PageOrientation: PageOrientation.Portrait,
		Format: Format.PNG,
		DPI: DPI[96],
		Crosshair: true,
		PrintableArea: true,
		Local: language.value
	});

	map.addControl(exportControl, 'top-right');
});
