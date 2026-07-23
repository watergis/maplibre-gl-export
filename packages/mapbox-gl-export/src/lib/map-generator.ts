import mapboxgl, {
	AttributionControl,
	ControlPosition,
	Map as MapboxMap,
	ScaleControl
} from 'mapbox-gl';
import {
	AttributionOptions,
	MapGeneratorBase,
	MapGeneratorConfig,
	ScalebarOptions
} from '@watergis/maplibre-gl-export';

export interface MapboxMapGeneratorConfig extends MapGeneratorConfig {
	/** Mapbox access token. `mapboxgl.accessToken` is used when it is not set */
	accessToken?: string;
}

export default class MapGenerator extends MapGeneratorBase {
	private accesstoken: string | undefined;

	/**
	 * Constructor
	 * @param map MapboxMap object
	 * @param config generator settings. See {@link MapboxMapGeneratorConfig}
	 */
	constructor(map: MapboxMap, config: MapboxMapGeneratorConfig = {}) {
		super(
			// eslint-disable-next-line
			// @ts-ignore
			map,
			{ ...config, cssPrefix: 'mapboxgl' }
		);
		this.accesstoken = config.accessToken;
	}

	/**
	 * This function is required to solve an error of Converting circular structure to JSON in mapbox
	 */
	private stringify(obj: unknown) {
		let cache: object[] | null = [];
		const str = JSON.stringify(obj, function (key, value) {
			if (typeof value === 'object' && value !== null) {
				if (cache!.indexOf(value) !== -1) {
					// Circular reference found, discard key
					return;
				}
				// Store value in our collection
				cache!.push(value);
			}
			return value;
		});
		cache = null; // reset the cache
		return str;
	}

	// eslint-disable-next-line
	// @ts-ignore
	protected getRenderedMap(container: HTMLElement, style: mapboxgl.Style) {
		const s = this.stringify(style);
		// Render map
		const renderMap = new MapboxMap({
			accessToken: this.accesstoken || (mapboxgl.accessToken as string),
			container,
			style: JSON.parse(s),
			center: this.map.getCenter(),
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch(),
			interactive: false,
			preserveDrawingBuffer: true,
			fadeDuration: 0,
			// the attribution control is added explicitly below so that its options can be controlled
			attributionControl: false,
			// hack to read transform request callback function
			// eslint-disable-next-line
			// @ts-ignore
			transformRequest: (this.map as unknown)._requestManager._transformRequestFn
		});

		// eslint-disable-next-line
		// @ts-ignore
		const imageManager = this.map.style.imageManager;
		const images =
			((imageManager as unknown as Record<string, unknown>)?.images as Record<
				string,
				{ data: unknown }
			>) ?? {};
		if (images && Object.keys(images)?.length > 0) {
			Object.keys(images).forEach((key) => {
				if (!key) return;
				if (!images[key].data) return;
				renderMap.addImage(key, images[key].data as ImageBitmap);
			});
		}

		this.addScaleControl(renderMap, this.scalebarOptions);
		this.addAttributionControl(renderMap, this.attributionOptions);

		return renderMap;
	}

	protected addScaleControl(renderMap: MapboxMap, options: ScalebarOptions) {
		if (options.visibility === 'none') return;
		const control = new ScaleControl({
			maxWidth: options.maxWidth,
			unit: options.unit
		});
		renderMap.addControl(control, (options.position ?? 'bottom-left') as ControlPosition);
	}

	protected addAttributionControl(renderMap: MapboxMap, options: AttributionOptions) {
		if (options.visibility === 'none') return;
		const control = new AttributionControl({
			customAttribution: options.customAttribution,
			// never collapse. the responsive default hides the text on maps narrower than 640px,
			// which happens for smaller page sizes.
			compact: false
		});
		renderMap.addControl(control, (options.position ?? 'bottom-right') as ControlPosition);
	}
}
