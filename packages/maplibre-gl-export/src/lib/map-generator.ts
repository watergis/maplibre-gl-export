import {
	AttributionControl,
	ControlPosition,
	Map as MaplibreMap,
	ScaleControl,
	StyleSpecification
} from 'maplibre-gl';
import { AttributionOptions, ScalebarOptions } from './interfaces';
import { MapGeneratorBase, MapGeneratorConfig } from './map-generator-base';

export default class MapGenerator extends MapGeneratorBase {
	/**
	 * Constructor
	 * @param map MaplibreMap object
	 * @param config generator settings. See {@link MapGeneratorConfig}
	 */
	constructor(map: MaplibreMap, config: MapGeneratorConfig = {}) {
		super(map, { ...config, cssPrefix: 'maplibregl' });
	}

	protected getRenderedMap(container: HTMLElement, style: StyleSpecification) {
		// Render map
		const renderMap: MaplibreMap = new MaplibreMap({
			container,
			style,
			center: this.map.getCenter(),
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch(),
			interactive: false,
			canvasContextAttributes: {
				preserveDrawingBuffer: true
			},
			fadeDuration: 0,
			// the attribution control is added explicitly below so that its options can be controlled
			attributionControl: false,
			// hack to read transform request callback function
			// eslint-disable-next-line
			// @ts-ignore
			transformRequest: (this.map as unknown)._requestManager._transformRequestFn
		});

		const terrain = (this.map as MaplibreMap).getTerrain();
		if (terrain) {
			// if terrain is enabled, restore pitch correctly
			renderMap.setMaxPitch(85);
			renderMap.setPitch(this.map.getPitch());
		}

		// the below code was added by https://github.com/watergis/maplibre-gl-export/pull/18.
		const images = ((this.map as MaplibreMap).style.imageManager || {}).images || [];
		Object.keys(images).forEach((key) => {
			const image = images[key];
			if (!image?.data) return;
			// `StyleImage` is `StyleImageData & StyleImageMetadata`, so the image itself carries
			// `pixelRatio`, `sdf`, `stretchX/Y`, `content` and so on. They have to be passed on,
			// otherwise `pixelRatio` falls back to 1 (high resolution icons are exported at their
			// full size) and `sdf` is lost (`icon-color` stops being applied).
			renderMap.addImage(key, image.data, image);
		});

		this.addScaleControl(renderMap, this.scalebarOptions);
		this.addAttributionControl(renderMap, this.attributionOptions);

		return renderMap;
	}

	protected addScaleControl(renderMap: MaplibreMap, options: ScalebarOptions) {
		if (options.visibility === 'none') return;
		const control = new ScaleControl({ maxWidth: options.maxWidth, unit: options.unit });
		renderMap.addControl(control, (options.position ?? 'bottom-left') as ControlPosition);
	}

	protected addAttributionControl(renderMap: MaplibreMap, options: AttributionOptions) {
		if (options.visibility === 'none') return;
		const control = new AttributionControl({
			customAttribution: options.customAttribution,
			// never collapse. the responsive default hides the text on maps narrower than 640px,
			// which happens for smaller page sizes.
			compact: false
		});
		renderMap.addControl(control, (options.position ?? 'bottom-right') as ControlPosition);
	}

	protected renderMapPost(renderMap: MaplibreMap) {
		const terrain = (this.map as MaplibreMap).getTerrain();
		if (terrain) {
			// if terrain is enabled, set terrain for rendered map object
			renderMap.setTerrain({
				source: terrain.source,
				exaggeration: terrain.exaggeration
			});
		}

		return renderMap;
	}
}
