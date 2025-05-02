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

map.on('load', () => {
	const img = new Image();
	img.src = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAapJREFUWEftllFuwjAMhu1UVFwCFJ4GtygnGZwEdhLYSegtyp5WlUtMRdSTs8LarDRO6YSQyAtIaePPv387RbjzwjvHhyfAYyuQjAYLCIIUANJZ+sW/3stbgUQPIzydVoAY1aIRxQTwDkEQ+8B4ASTjcI0Aq9Y0GSQIllIIMYAo+C9ZSkrNJRAigEQPNRbFZzVzAngDpbYAoKEoIgR4Nf/LxfuzLF+7TCEC2I8Gu2rNy+zi6uEl5K4GodTEpYITwM6+LTO7TES0nB2OrNLVJQGIsCg4M7Oasj/v2bAIsH3J8uVtAJbzqUXW/wEYDRaIuJGYy8yIqloCI7pLYAGUZWg0134ccqd4dYITgAPaB/PoJaW4tmYE80g2bWhNx2mWO893PsAAH+NwQwALV0/bc6K3OVDWln1wkdcF02bW6rsiBfgFn1EsnYJ8rhjgihf+CkEUTw/HuUuh874XQNO4tQKl0yyfSIN7K+AqRduUvAblpcBl5DZ8F/jUvZMJ7QxqrelZ914AjCl/rmntW/feAIwn9FC77vybbkMfR3d5tpMJuwTqtQueAH0q8A0lP84hZyFjzwAAAABJRU5ErkJggg==`;
	img.onload = () => {
		map.addImage("image-test", img, { sdf: true });

		map.addLayer({
			id: "image-symbol-sdf",
			type: 'symbol',
			source: {
				type: 'geojson',
				data: {
					type: 'Point',
					coordinates: [37.80467, -0.15943]
				}
			},
			layout:{
				"icon-image" : "image-test",
				"icon-size" : 1.8
			},
			paint:{
				"icon-color" : "#00ff00"
			}
		});
	}
});