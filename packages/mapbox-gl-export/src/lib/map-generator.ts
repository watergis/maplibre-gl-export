import mapboxgl, { accessToken, Map as MapboxMap } from 'mapbox-gl';
import 'js-loading-overlay';
import {
	defaultAttributionOptions,
	defaultMarkerCirclePaint,
	defaultNorthIconOptions,
	DPIType,
	Format,
	FormatType,
	MapGeneratorBase,
	Size,
	SizeType,
	Unit,
	UnitType
} from '@watergis/maplibre-gl-export';

export default class MapGenerator extends MapGeneratorBase {
	private accesstoken: string | undefined;

	/**
	 * Constructor
	 * @param map MapboxMap object
	 * @param size layout size. default is A4
	 * @param dpi dpi value. deafult is 300
	 * @param format image format. default is PNG
	 * @param unit length unit. default is mm
	 * @param fileName file name. default is 'map'
	 */
	constructor(
		map: MapboxMap,
		size: SizeType = Size.A4,
		dpi: DPIType = 300,
		format: FormatType = Format.PNG,
		unit: UnitType = Unit.mm,
		fileName = 'map',
		markerCirclePaint = defaultMarkerCirclePaint,
		attributionOptions = defaultAttributionOptions,
		northIconOptions = defaultNorthIconOptions,
		accesstoken?: string
	) {
		super(
			map,
			size,
			dpi,
			format,
			unit,
			fileName,
			'mapboxgl-marker',
			markerCirclePaint,
			'mapboxgl-ctrl-attrib-inner',
			attributionOptions,
			northIconOptions
		);
		this.accesstoken = accesstoken;
	}

	protected getRenderedMap(container: HTMLElement, style: mapboxgl.Style) {
		// Render map
		const renderMap = new MapboxMap({
			accessToken: this.accesstoken || accessToken,
			container,
			style,
			center: this.map.getCenter(),
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch(),
			interactive: false,
			preserveDrawingBuffer: true,
			fadeDuration: 0,
			// attributionControl: false,
			// hack to read transfrom request callback function
			// eslint-disable-next-line
			// @ts-ignore
			transformRequest: (this.map as unknown)._requestManager._transformRequestFn
		});

		// eslint-disable-next-line
		// @ts-ignore
		const images = (this.map.style.imageManager || {}).images || [];
		if (images && Object.keys(images)?.length > 0) {
			Object.keys(images).forEach((key) => {
				if (!key) return;
				if (!images[key].data) return;
				renderMap.addImage(key, images[key].data);
			});
		}

		return renderMap;
	}
}
