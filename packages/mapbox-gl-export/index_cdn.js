mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESSTOKEN;
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [35.87063, -1.08551],
	zoom: 9
});

map.addControl(
	new MapboxExportControl.MapboxExportControl({
		PageSize: MapboxExportControl.Size.A4,
		PageOrientation: MapboxExportControl.PageOrientation.Landscape,
		Format: MapboxExportControl.Format.PNG,
		DPI: MapboxExportControl.DPI[300],
		Crosshair: true,
		PrintableArea: true,
		Local: 'fr',
		accessToken: mapboxgl.accessToken
	}),
	'top-right'
);
