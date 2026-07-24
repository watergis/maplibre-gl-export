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

/**
 * Separator mapbox-gl uses to stringify an image id which belongs to an iconset
 * (`ImageId.toString()` returns `name<US>iconsetId` in that case).
 */
const IMAGE_ID_SEPARATOR = '\x1f';

/** Image of the style together with its metadata. `StyleImage` is not exported by mapbox-gl. */
type StyleImageLike = {
	data?: unknown;
	pixelRatio?: number;
	sdf?: boolean;
	stretchX?: [number, number][];
	stretchY?: [number, number][];
	content?: [number, number, number, number];
};

/**
 * Read the images of the style out of the internal image manager.
 *
 * mapbox-gl v3 keeps them in a `Map<scope, Map<stringifiedImageId, StyleImage>>`, while
 * older versions used a plain `{ [id: string]: StyleImage }` object. Both shapes are
 * flattened into `[id, image]` pairs.
 */
const getStyleImageEntries = (images: unknown): [string, StyleImageLike][] => {
	if (images instanceof Map) {
		return [...images.values()].flatMap((scoped) =>
			scoped instanceof Map ? ([...scoped.entries()] as [string, StyleImageLike][]) : []
		);
	}
	if (images && typeof images === 'object') {
		return Object.entries(images as Record<string, StyleImageLike>);
	}
	return [];
};

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
		const images = (imageManager as unknown as Record<string, unknown>)?.images;
		getStyleImageEntries(images).forEach(([key, image]) => {
			// the id of an image belonging to an iconset is stringified as `name<US>iconsetId`.
			// `addImage` only accepts the name.
			const id = key.split(IMAGE_ID_SEPARATOR)[0];
			if (!id || !image?.data) return;
			// `StyleImage` is `StyleImageData & StyleImageMetadata`, so the image itself carries
			// `pixelRatio`, `sdf`, `stretchX/Y`, `content` and so on. They have to be passed on,
			// otherwise `pixelRatio` falls back to 1 (high resolution icons are exported at their
			// full size) and `sdf` is lost (`icon-color` stops being applied).
			renderMap.addImage(id, image.data as ImageBitmap, image);
		});

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
