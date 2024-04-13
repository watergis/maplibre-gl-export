import { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import 'js-loading-overlay';
import { DPIType, Format, FormatType, Size, SizeType, Unit, UnitType } from './interfaces';
import { MapGeneratorBase } from './map-generator-base';

export default class MapGenerator extends MapGeneratorBase {
	/**
	 * Constructor
	 * @param map MaplibreMap object
	 * @param size layout size. default is A4
	 * @param dpi dpi value. deafult is 300
	 * @param format image format. default is PNG
	 * @param unit length unit. default is mm
	 * @param fileName file name. default is 'map'
	 */
	constructor(
		map: MaplibreMap,
		size: SizeType = Size.A4,
		dpi: DPIType = 300,
		format: FormatType = Format.PNG,
		unit: UnitType = Unit.mm,
		fileName = 'map'
	) {
		super(map, size, dpi, format, unit, fileName);
	}

	protected getRenderedMap(container: HTMLElement, style: StyleSpecification) {
		// Render map
		const renderMap = new MaplibreMap({
			container,
			style,
			center: this.map.getCenter(),
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch(),
			interactive: false,
			preserveDrawingBuffer: true,
			fadeDuration: 0,
			attributionControl: false,
			// hack to read transfrom request callback function
			// eslint-disable-next-line
			// @ts-ignore
			transformRequest: (this.map as unknown)._requestManager._transformRequestFn
		});

		// comment this statement because an error is occured since maplibre v3. images[key].data has no value (null)
		// it looks working well in my style. let's see how it works without this code
		// the below code was added by https://github.com/watergis/maplibre-gl-export/pull/18.
		// const images = (this.map.style.imageManager || {}).images || [];
		// Object.keys(images).forEach((key) => {
		// 	renderMap.addImage(key, images[key].data);
		// });

		return renderMap;
	}
}
