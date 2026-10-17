/*
 * mpetroff/print-maps
 * https://github.com/mpetroff/print-maps
 *
 * I used the source code from the above repository. Thanks so much!
 *
 * -----LICENSE------
 * Print Maps - High-resolution maps in the browser, for printing
 * Copyright (c) 2015-2020 Matthew Petroff
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import { CirclePaint, Map as MapboxMap } from 'mapbox-gl';
import {
	AttributionOptions,
	DPIType,
	ExportResult,
	Format,
	FormatType,
	MapView,
	NorthIconOptions,
	ScalebarOptions,
	Size,
	SizeType,
	SvgVectorOptions,
	Unit,
	UnitType
} from '../interfaces';
import { createFormat } from './formats';
import { toPixels } from './units';

// kept exported from here, where it used to be defined
export { stackOverlay } from './overlays';

export const defaultMarkerCirclePaint: CirclePaint = {
	'circle-radius': 8,
	'circle-color': 'red',
	'circle-stroke-width': 1,
	'circle-stroke-color': 'black'
};

export const defaultAttributionOptions: AttributionOptions = {
	visibility: 'visible',
	position: 'bottom-right',
	margin: 10
};

export const defaultScalebarOptions: ScalebarOptions = {
	maxWidth: 100,
	unit: 'metric',
	visibility: 'visible',
	position: 'bottom-left',
	margin: 10
};

export const defaultNorthIconOptions: NorthIconOptions = {
	image: `<svg width="800px" height="800px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--gis" preserveAspectRatio="xMidYMid meet"><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="none" stroke="white" stroke-width="1.5"/><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="#000000" fill-rule="evenodd"></path></svg>`,
	imageName: 'gl-export-north-icon',
	imageSizeFraction: 0.05,
	visibility: 'visible',
	position: 'top-right',
	margin: 10
};

/** The vector export is disabled unless it is asked for, and labels stay an image */
export const defaultSvgVectorOptions: SvgVectorOptions = {
	enabled: false,
	labels: 'raster'
};

/**
 * CSS class prefix of the underlying library. It is used to look up markers and
 * the DOM elements of the scale / attribution controls on the hidden map.
 */
export type CssPrefix = 'maplibregl' | 'mapboxgl';

export interface MapGeneratorConfig {
	/** layout size. default is A4 */
	size?: SizeType;
	/** dpi value. default is 300 */
	dpi?: DPIType;
	/** image format. default is PNG */
	format?: FormatType;
	/** length unit of the page layout. default is mm */
	unit?: UnitType;
	/** file name. default is 'map' */
	fileName?: string;
	/** CSS class prefix of the underlying library. default is 'maplibregl' */
	cssPrefix?: CssPrefix;
	markerCirclePaint?: CirclePaint;
	attributionOptions?: AttributionOptions;
	scalebarOptions?: ScalebarOptions;
	northIconOptions?: NorthIconOptions;
	/** whether the exported image is downloaded as a file. default is true */
	download?: boolean;
	/**
	 * Called with the exported image once it has been generated. Use it to pass the image on
	 * to the rest of the application instead of (or in addition to) downloading it.
	 */
	onExport?: (result: ExportResult) => void | Promise<void>;
	/**
	 * Settings of the vector export of SVG and PDF. Set `enabled` to true to export them as
	 * real vectors instead of an image of the map. It is disabled by default.
	 * @experimental
	 */
	svgVectorOptions?: SvgVectorOptions;
	/**
	 * Whether the exported PDF is georeferenced as a GeoPDF, so that GIS software such as
	 * QGIS or Avenza Maps can place it on the map. default is true.
	 * It is skipped when the map is pitched, has terrain, or uses the globe projection.
	 */
	geoPdf?: boolean;
	/**
	 * Camera of the exported map. The current view of the source map is used when it is not set.
	 * The zoom level is the one of the page laid out at 96 DPI.
	 */
	view?: MapView;
	/**
	 * Whether a loader is shown over the source map while the map is rendered. default is true.
	 * The export dialog turns it off for its previews.
	 */
	showLoader?: boolean;
}

/** Timeout for waiting the `load` event of the hidden map */
const LOAD_TIMEOUT_MS = 30000;

/** Timeout for waiting the `idle` event of the hidden map */
const IDLE_TIMEOUT_MS = 5000;

export abstract class MapGeneratorBase {
	protected map: MaplibreMap | MapboxMap;

	protected width: number;

	protected height: number;

	protected dpi: number;

	protected format: FormatType;

	protected unit: UnitType;

	protected fileName: string;

	protected cssPrefix: CssPrefix;

	protected markerCirclePaint: CirclePaint;

	protected attributionOptions: AttributionOptions;

	protected scalebarOptions: ScalebarOptions;

	protected northIconOptions: NorthIconOptions;

	protected download: boolean;

	protected onExport: ((result: ExportResult) => void | Promise<void>) | undefined;

	protected svgVectorOptions: SvgVectorOptions;

	protected geoPdf: boolean;

	protected view: MapView | undefined;

	/** whether the loader is shown over the source map while rendering */
	protected useLoader: boolean;

	/**
	 * Constructor
	 * @param map MaplibreMap or MapboxMap object
	 * @param config generator settings. See {@link MapGeneratorConfig}
	 */
	constructor(map: MaplibreMap | MapboxMap, config: MapGeneratorConfig = {}) {
		const size = config.size ?? Size.A4;
		this.map = map;
		this.width = size[0];
		this.height = size[1];
		this.dpi = config.dpi ?? 300;
		this.format = config.format ?? Format.PNG;
		this.unit = config.unit ?? Unit.mm;
		this.fileName = config.fileName ?? 'map';
		this.cssPrefix = config.cssPrefix ?? 'maplibregl';
		this.markerCirclePaint = config.markerCirclePaint ?? defaultMarkerCirclePaint;
		this.attributionOptions = { ...defaultAttributionOptions, ...config.attributionOptions };
		this.scalebarOptions = { ...defaultScalebarOptions, ...config.scalebarOptions };
		this.northIconOptions = { ...defaultNorthIconOptions, ...config.northIconOptions };
		this.download = config.download ?? true;
		this.onExport = config.onExport;
		this.svgVectorOptions = { ...defaultSvgVectorOptions, ...config.svgVectorOptions };
		this.geoPdf = config.geoPdf ?? true;
		this.useLoader = config.showLoader ?? true;
		this.view = config.view;
	}

	/** Camera of the exported map: the configured `view`, or the current view of the source map */
	protected get renderView(): MapView {
		if (this.view) return this.view;
		const center = this.map.getCenter();
		return {
			center: [center.lng, center.lat],
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch()
		};
	}

	/** Class name of markers of the underlying library */
	protected get markerClassName() {
		return `${this.cssPrefix}-marker`;
	}

	/** Ratio between the exported resolution and the base 96 DPI layout */
	protected get scaleFactor() {
		return this.dpi / 96;
	}

	protected abstract getRenderedMap(
		container: HTMLElement,
		style: StyleSpecification | mapboxgl.Style
	): MaplibreMap | MapboxMap;

	/**
	 * Add a scale control to the hidden map. The control element is rasterized and
	 * drawn on the exported canvas afterwards, so it only has to exist in the DOM.
	 */
	protected abstract addScaleControl(
		renderMap: MaplibreMap | MapboxMap,
		options: ScalebarOptions
	): void;

	/**
	 * Add an attribution control to the hidden map. Its text is read from the DOM and
	 * drawn on the exported canvas afterwards.
	 */
	protected abstract addAttributionControl(
		renderMap: MaplibreMap | MapboxMap,
		options: AttributionOptions
	): void;

	protected renderMapPost(renderMap: MaplibreMap | MapboxMap) {
		return renderMap;
	}

	private getMarkers() {
		return this.map.getCanvasContainer().getElementsByClassName(this.markerClassName);
	}

	/** Whether the marker is the default pin of the library, a 27x41 SVG */
	private isDefaultMarker(marker: Element) {
		return marker.firstElementChild?.getAttribute('viewBox') === '0 0 27 41';
	}

	protected renderMarkers(renderMap: MaplibreMap | MapboxMap) {
		const markers = this.getMarkers();
		for (let i = 0; i < markers.length; i++) {
			const marker = markers.item(i);
			if (!marker) continue;
			const style = marker.getAttribute('style');
			if (!style) continue;
			const translateRegex = /translate\(([^,]+)px,\s*([^,]+)px\)/;
			const match = style.match(translateRegex);
			if (!match) continue;
			const translateX = parseInt(match[1]);
			// the default pin is offset by [0, -14] so that its tip, not its center, is on the point
			const translateY = parseInt(match[2]) + (this.isDefaultMarker(marker) ? 14 : 0);

			const lngLat = this.map.unproject([translateX, translateY]);

			const markerId = `point${i}`;
			renderMap.addSource(markerId, {
				type: 'geojson',
				data: {
					type: 'Point',
					coordinates: [lngLat.lng, lngLat.lat]
				}
			});

			(renderMap as MapboxMap).addLayer({
				id: markerId,
				source: markerId,
				type: 'circle',
				paint: this.markerCirclePaint
			});
		}
		return renderMap;
	}

	/**
	 * Generate the Map image, then download it and/or hand it to the `onExport` callback.
	 *
	 * The map is rendered on a hidden map object at the requested page size and DPI,
	 * then its canvas is composed with the scale bar, north icon and attribution
	 * onto a 2D canvas which is what actually gets exported.
	 * @returns whether the map was exported. Errors are logged rather than thrown.
	 */
	async generate(): Promise<boolean> {
		try {
			await this.withRenderedMap(async (renderMap) => {
				if (!this.download && !this.onExport) return;
				const format = this.getFormat(renderMap);
				// the file is created once, and handed to both the download and the callback
				const blob = await format.toBlob();
				if (this.download) {
					await format.download(blob);
				}
				if (this.onExport) {
					await this.onExport({
						canvas: await format.getCanvas(),
						blob,
						fileName: format.fileName,
						format: this.format,
						svg: await format.getVectorSvg()
					});
				}
			});
			return true;
		} catch (err) {
			// `generate` is called from the export button, so there is nobody to hand the
			// error to. `toCanvas` / `toBlob` let the caller handle it instead.
			console.error('Failed to generate map image:', err);
			return false;
		}
	}

	/**
	 * Generate the Map image and return it as a canvas instead of downloading it.
	 *
	 * The canvas holds the composed image at the requested page size and DPI, exactly as it
	 * would be written to the exported file.
	 */
	async toCanvas() {
		return this.withRenderedMap((renderMap) => this.getFormat(renderMap).getCanvas());
	}

	/**
	 * Generate the Map image and return it as a `Blob` in the configured format instead of
	 * downloading it. PDF and SVG are wrapped around the rendered image just like the
	 * downloaded file is, or hold the map as vectors when `svgVectorOptions.enabled` is true.
	 */
	async toBlob() {
		return this.withRenderedMap((renderMap) => this.getFormat(renderMap).toBlob());
	}

	/**
	 * Render the map on a hidden map object and run `fn` on it once it has finished rendering.
	 *
	 * The loader of the source map is shown while rendering, `window.devicePixelRatio` is
	 * temporarily raised to the export scale factor so that the map is rendered at the
	 * requested DPI, and everything is cleaned up again afterwards.
	 */
	private async withRenderedMap<T>(fn: (renderMap: MaplibreMap) => T | Promise<T>) {
		if (this.useLoader) {
			this.addLoader();
			this.showLoader();
		}

		// Calculate pixel ratio
		const actualPixelRatio: number = window.devicePixelRatio;
		Object.defineProperty(window, 'devicePixelRatio', {
			get: () => this.scaleFactor,
			configurable: true
		});

		// Create map container
		const hidden = document.createElement('div');
		hidden.className = 'hidden-map';
		document.body.appendChild(hidden);
		const container = document.createElement('div');
		container.style.width = toPixels(this.width, this.unit);
		container.style.height = toPixels(this.height, this.unit);
		hidden.appendChild(container);

		const style = this.map.getStyle();
		if (style && style.sources) {
			const sources = style.sources;
			Object.keys(sources).forEach((name) => {
				const src = sources[name];
				Object.keys(src).forEach((key) => {
					// delete properties if value is undefined.
					// for instance, raster-dem might has undefined value in "url" and "bounds"
					if (!(src as Record<string, unknown>)[key]) delete (src as Record<string, unknown>)[key];
				});
			});
		}

		try {
			// Render map
			let renderMap = this.getRenderedMap(container, style) as MaplibreMap;

			await this.waitForEvent(renderMap, 'load', LOAD_TIMEOUT_MS);

			renderMap = this.renderMapPost(renderMap) as MaplibreMap;

			if (this.getMarkers().length > 0) {
				renderMap = this.renderMarkers(renderMap) as MaplibreMap;
			}

			await this.waitForEvent(renderMap, 'idle', IDLE_TIMEOUT_MS);

			const result = await fn(renderMap);

			renderMap.remove();

			return result;
		} finally {
			hidden.parentNode?.removeChild(hidden);
			hidden.remove();
			Object.defineProperty(window, 'devicePixelRatio', {
				get: () => actualPixelRatio,
				configurable: true
			});
			if (this.useLoader) this.hideLoader();
		}
	}

	/**
	 * Wait for an event of the hidden map, giving up after `timeoutMs`.
	 *
	 * Neither `load` nor `idle` is guaranteed to fire: a source which never finishes
	 * loading keeps the style from being reported as loaded, and `idle` does not fire
	 * when nothing has to be re-rendered. Exporting a partially rendered map is far
	 * better than hanging forever, so the wait is always bounded.
	 */
	private waitForEvent(
		renderMap: MaplibreMap | MapboxMap,
		type: 'load' | 'idle',
		timeoutMs: number
	) {
		return new Promise<void>((resolve) => {
			let settled = false;
			const finish = (timedOut = false) => {
				if (settled) return;
				settled = true;
				if (timedOut) {
					console.warn(`Timed out waiting for the '${type}' event of the map to be exported`);
				}
				resolve();
			};
			(renderMap as MaplibreMap).once(type, () => finish());
			setTimeout(() => finish(true), timeoutMs);
		});
	}

	/**
	 * Whether the hidden map can be exported as vectors. The image of the map is exported
	 * when it cannot. Terrain and the globe projection are refused by the conversion itself,
	 * so this only has to tell what is specific to the underlying library.
	 * @param renderMap hidden Map object which has finished rendering
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected isVectorExportSupported(renderMap: MaplibreMap | MapboxMap) {
		return true;
	}

	/**
	 * Create the class which exports the hidden map as a file of the configured format.
	 * @param renderMap hidden Map object which has finished rendering
	 */
	private getFormat(renderMap: MaplibreMap | MapboxMap) {
		return createFormat(this.format, renderMap, {
			size: [this.width, this.height],
			dpi: this.dpi as DPIType,
			unit: this.unit,
			fileName: this.fileName,
			cssPrefix: this.cssPrefix,
			attributionOptions: this.attributionOptions,
			scalebarOptions: this.scalebarOptions,
			northIconOptions: this.northIconOptions,
			svgVectorOptions: this.svgVectorOptions,
			geoPdf: this.geoPdf,
			isVectorExportSupported: (map) => this.isVectorExportSupported(map)
		});
	}

	/**
	 * Add loader in the parent element of maplibre map.
	 */
	private addLoader() {
		const canvas = this.map.getCanvas();
		const grandParent = canvas.parentElement?.parentElement;
		if (!grandParent) return;
		const loaderElements = grandParent.getElementsByClassName('map-export-loader');
		if (loaderElements.length > 0) return;
		const loader = document.createElement('span');
		loader.classList.add('map-export-loader');
		loader.classList.add('loader-default');
		grandParent.appendChild(loader);
	}

	/**
	 * Show loader
	 */
	private showLoader() {
		const canvas = this.map.getCanvas();
		const grandParent = canvas.parentElement?.parentElement;
		if (!grandParent) return;
		const loaderElements = grandParent.getElementsByClassName('map-export-loader');
		if (loaderElements && loaderElements.length > 0) {
			loaderElements.item(0)?.classList.add('is-active');
		}
	}

	/**
	 * Hide loader
	 */
	private hideLoader() {
		const canvas = this.map.getCanvas();
		const grandParent = canvas.parentElement?.parentElement;
		if (!grandParent) return;
		const loaderElements = grandParent.getElementsByClassName('map-export-loader');
		if (loaderElements && loaderElements.length > 0) {
			loaderElements.item(0)?.classList.remove('is-active');
		}
	}
}
