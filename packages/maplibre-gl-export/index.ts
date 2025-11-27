import {
	addProtocol,
	AttributionControl,
	Map,
	Marker,
	NavigationControl,
	TerrainControl
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreExportControl, Size, PageOrientation, Format, DPI } from './src/lib/index';
import './src/scss/maplibre-gl-export.scss';
import { Protocol } from 'pmtiles';

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
		northIconOptions: {
			position: 'top-right',
			visibility: 'visible'
		}
	}),
	'top-right'
);

map.once('load', () => {
	new Marker().setLngLat([37.30467, -0.15943]).addTo(map);

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

	const img = new Image();
	img.src = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAapJREFUWEftllFuwjAMhu1UVFwCFJ4GtygnGZwEdhLYSegtyp5WlUtMRdSTs8LarDRO6YSQyAtIaePPv387RbjzwjvHhyfAYyuQjAYLCIIUANJZ+sW/3stbgUQPIzydVoAY1aIRxQTwDkEQ+8B4ASTjcI0Aq9Y0GSQIllIIMYAo+C9ZSkrNJRAigEQPNRbFZzVzAngDpbYAoKEoIgR4Nf/LxfuzLF+7TCEC2I8Gu2rNy+zi6uEl5K4GodTEpYITwM6+LTO7TES0nB2OrNLVJQGIsCg4M7Oasj/v2bAIsH3J8uVtAJbzqUXW/wEYDRaIuJGYy8yIqloCI7pLYAGUZWg0134ccqd4dYITgAPaB/PoJaW4tmYE80g2bWhNx2mWO893PsAAH+NwQwALV0/bc6K3OVDWln1wkdcF02bW6rsiBfgFn1EsnYJ8rhjgihf+CkEUTw/HuUuh874XQNO4tQKl0yyfSIN7K+AqRduUvAblpcBl5DZ8F/jUvZMJ7QxqrelZ914AjCl/rmntW/feAIwn9FC77vybbkMfR3d5tpMJuwTqtQueAH0q8A0lP84hZyFjzwAAAABJRU5ErkJggg==`;
	img.onload = () => {
		map.addImage('image-test', img, { sdf: true });
		map.addLayer({
			id: 'image-symbol-sdf',
			type: 'symbol',
			source: {
				type: 'geojson',
				data: {
					type: 'Point',
					coordinates: [37.80467, -0.15943]
				}
			},
			layout: {
				'icon-image': 'image-test',
				'icon-size': 1.8
			},
			paint: {
				'icon-color': '#00ff00'
			}
		});
	};
});
