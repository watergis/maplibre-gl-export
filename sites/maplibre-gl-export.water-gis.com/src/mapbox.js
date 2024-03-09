import mapboxgl from 'mapbox-gl';
import {
	MapboxExportControl,
	Size,
	PageOrientation,
	Format,
	DPI
} from '@watergis/mapbox-gl-export';
import '@watergis/mapbox-gl-export/dist/mapbox-gl-export.css';

mapboxgl.accessToken =
	'pk.eyJ1IjoiamluLWlnYXJhc2hpIiwiYSI6ImNsdGtldWVleTBlZGUya29ldDRkOGJ3cG0ifQ.IG8hs-1kCdxnPKGoGFjKkQ';
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	// style: 'https://narwassco.github.io/mapbox-stylefiles/unvt/style.json',
	center: [35.87063, -1.08551],
	zoom: 12,
	hash: true
});
map.addControl(new mapboxgl.NavigationControl({}), 'top-right');

const languageOption = document.getElementById('language');
languageOption.value = 'en';

let exportControl = new MapboxExportControl({
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
	exportControl = new MapboxExportControl({
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
