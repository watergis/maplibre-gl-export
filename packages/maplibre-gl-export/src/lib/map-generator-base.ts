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

import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { maplibre2svg, svgToString } from '@watergis/maplibre2svg';
import type { ControlPosition } from 'maplibre-gl';
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
} from './interfaces';
import {
	createAttributionOverlay,
	createNorthIconOverlay,
	createScalebarOverlay,
	type OverlayBox
} from './vector-overlays';
import { createGeoPdfViewport, type GeoCorners } from './geopdf';
import { createGeoTiff } from './geotiff';

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

/**
 * What is written into the exported PDF or GeoTIFF besides the map. It is read from the
 * hidden map, which is removed before some of the files are created.
 */
interface ExportInfo {
	/** geographic coordinates of the corners of the map, which georeference the file */
	corners?: GeoCorners;
	/** attribution of the map, which is written as the author of the file */
	author?: string;
}

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

	/** Hidden container holding the map used for rendering. Available while generating. */
	protected hiddenContainer: HTMLElement | undefined;

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

	/** Class name of the attribution control element of the underlying library */
	protected get attributionClassName() {
		return `${this.cssPrefix}-ctrl-attrib`;
	}

	/** Class name of the scale control element of the underlying library */
	protected get scalebarClassName() {
		return `${this.cssPrefix}-ctrl-scale`;
	}

	/** Name of the plugin which is written as the creator of the exported PDF */
	protected get creatorName() {
		return this.cssPrefix === 'mapboxgl' ? 'Mapbox GL Export Plugin' : 'MapLibre GL Export Plugin';
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
				const canvas = await this.composeCanvas(renderMap);
				const svg = await this.composeVectorSVG(renderMap);
				const exportInfo = this.getExportInfo(renderMap);
				if (this.download) {
					await this.exportImage(canvas, renderMap, svg, exportInfo);
				}
				if (this.onExport) {
					const blob = await this.toBlobOfFormat(canvas, svg, exportInfo);
					await this.onExport({
						canvas,
						blob,
						fileName: `${this.fileName}.${this.format}`,
						format: this.format,
						svg: svg ? svgToString(svg) : undefined
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
		return this.withRenderedMap((renderMap) => this.composeCanvas(renderMap));
	}

	/**
	 * Generate the Map image and return it as a `Blob` in the configured format instead of
	 * downloading it. PDF and SVG are wrapped around the rendered image just like the
	 * downloaded file is, or hold the map as vectors when `svgVectorOptions.enabled` is true.
	 */
	async toBlob() {
		return this.withRenderedMap(async (renderMap) => {
			const canvas = await this.composeCanvas(renderMap);
			const svg = await this.composeVectorSVG(renderMap);
			return this.toBlobOfFormat(canvas, svg, this.getExportInfo(renderMap));
		});
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
		this.hiddenContainer = hidden;
		const container = document.createElement('div');
		container.style.width = this.toPixels(this.width);
		container.style.height = this.toPixels(this.height);
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
			this.hiddenContainer = undefined;
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
	 * Compose the exported image from the rendered map canvas and the overlays.
	 * @param renderMap hidden Map object which has finished rendering
	 * @returns 2D canvas containing the final image
	 */
	private async composeCanvas(renderMap: MaplibreMap | MapboxMap) {
		const mapCanvas = renderMap.getCanvas();

		const canvas = document.createElement('canvas');
		canvas.width = mapCanvas.width;
		canvas.height = mapCanvas.height;

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context for the export canvas');

		// fill white first, otherwise transparent areas turn black in JPEG
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(mapCanvas, 0, 0);

		// attribution is drawn first because the scale bar is stacked on top of it
		// when both are placed in the same corner.
		const attributionBox = await this.drawAttribution(ctx, canvas);
		await this.drawScalebar(ctx, canvas, attributionBox);
		await this.drawNorthIcon(ctx, canvas, renderMap.getBearing());

		return canvas;
	}

	/**
	 * Calculate the top-left corner where an overlay of the given size is drawn.
	 * @param canvas export canvas
	 * @param position corner of the canvas
	 * @param width overlay width in export pixels
	 * @param height overlay height in export pixels
	 * @param margin distance from the canvas edge in export pixels
	 */
	private getOverlayOrigin(
		canvas: { width: number; height: number },
		position: ControlPosition,
		width: number,
		height: number,
		margin: number
	) {
		const left = ['top-left', 'bottom-left'].includes(position);
		const top = ['top-left', 'top-right'].includes(position);
		return {
			x: left ? margin : canvas.width - width - margin,
			y: top ? margin : canvas.height - height - margin
		};
	}

	/**
	 * Rasterize the attribution control element of the hidden map and draw it on the export canvas.
	 * The native maplibre control element is used as-is, so it keeps its own styling.
	 * @returns the box occupied by the attribution, or undefined when nothing was drawn
	 */
	private async drawAttribution(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
		if (this.attributionOptions.visibility === 'none') return;

		try {
			const element = this.hiddenContainer
				?.getElementsByClassName(this.attributionClassName)
				?.item(0) as HTMLElement | null;
			if (!element || element.offsetWidth === 0) return;

			// `skipFonts` avoids html-to-image walking document.styleSheets to embed @font-face
			// rules, which throws a SecurityError on cross-origin stylesheets. Fonts already
			// loaded in the document still render during rasterization.
			const attributionCanvas = await toCanvas(element, {
				pixelRatio: this.scaleFactor,
				skipFonts: true
			});
			if (attributionCanvas.width === 0 || attributionCanvas.height === 0) return;

			const position = this.attributionOptions.position ?? 'bottom-right';
			const margin = (this.attributionOptions.margin ?? 10) * this.scaleFactor;
			const { x, y } = this.getOverlayOrigin(
				canvas,
				position,
				attributionCanvas.width,
				attributionCanvas.height,
				margin
			);

			ctx.drawImage(attributionCanvas, x, y);

			return { x, y, width: attributionCanvas.width, height: attributionCanvas.height };
		} catch (err) {
			console.warn('Failed to render attribution:', err);
		}
	}

	/**
	 * Rasterize the scale control element of the hidden map and draw it on the export canvas.
	 * @param attributionBox box of the attribution, used to avoid overlapping it
	 */
	private async drawScalebar(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		attributionBox?: { x: number; y: number; width: number; height: number }
	) {
		if (this.scalebarOptions.visibility === 'none') return;

		try {
			const element = this.hiddenContainer
				?.getElementsByClassName(this.scalebarClassName)
				?.item(0) as HTMLElement | null;
			if (!element || element.offsetWidth === 0) return;

			// `skipFonts` avoids html-to-image walking document.styleSheets to embed @font-face
			// rules, which throws a SecurityError on cross-origin stylesheets. Fonts already
			// loaded in the document still render during rasterization.
			const scalebarCanvas = await toCanvas(element, {
				pixelRatio: this.scaleFactor,
				skipFonts: true
			});
			if (scalebarCanvas.width === 0 || scalebarCanvas.height === 0) return;

			const position = this.scalebarOptions.position ?? 'bottom-left';
			const margin = (this.scalebarOptions.margin ?? 10) * this.scaleFactor;
			const origin = this.getOverlayOrigin(
				canvas,
				position,
				scalebarCanvas.width,
				scalebarCanvas.height,
				margin
			);

			// stack the scale bar on top of / below the attribution when they share a corner
			let { y } = origin;
			if (attributionBox && this.attributionOptions.position === position) {
				y = position.startsWith('top')
					? attributionBox.y + attributionBox.height + margin
					: attributionBox.y - scalebarCanvas.height - margin;
			}

			ctx.drawImage(scalebarCanvas, origin.x, y);
		} catch (err) {
			console.warn('Failed to render scale bar:', err);
		}
	}

	/**
	 * Draw the north icon on the export canvas, rotated to match the map bearing.
	 * @param bearing bearing of the rendered map in degrees
	 */
	private async drawNorthIcon(
		ctx: CanvasRenderingContext2D,
		canvas: HTMLCanvasElement,
		bearing: number
	) {
		if (this.northIconOptions.visibility === 'none') return;
		const svg = this.northIconOptions.image;
		if (!svg) return;

		try {
			const size = canvas.width * (this.northIconOptions.imageSizeFraction ?? 0.05);
			const image = await new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image(size, size);
				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error('Failed to load the north icon image'));
				img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
			});

			const margin = (this.northIconOptions.margin ?? 10) * this.scaleFactor;
			const { x, y } = this.getOverlayOrigin(
				canvas,
				this.northIconOptions.position ?? 'top-right',
				size,
				size,
				margin
			);

			ctx.save();
			ctx.translate(x + size / 2, y + size / 2);
			// the map is rotated clockwise by `bearing`, so north sits counter-clockwise by the same angle
			ctx.rotate((-bearing * Math.PI) / 180);
			ctx.drawImage(image, -size / 2, -size / 2, size, size);
			ctx.restore();
		} catch (err) {
			console.warn('Failed to render north icon:', err);
		}
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
	 * Convert the rendered map into an SVG which holds its layers as vectors, with the
	 * overlays drawn on top. It has to run after `composeCanvas`, because it hides layers
	 * of the hidden map to render the ones which cannot be converted.
	 *
	 * @returns undefined when vectors were not asked for, or when the map cannot be
	 * converted. The image of the map is exported in that case.
	 */
	private async composeVectorSVG(renderMap: MaplibreMap | MapboxMap) {
		if (!this.svgVectorOptions.enabled) return undefined;
		if (this.format !== Format.SVG && this.format !== Format.PDF) return undefined;
		if (!this.isVectorExportSupported(renderMap)) {
			console.warn('The map cannot be exported as vectors, exporting it as an image instead');
			return undefined;
		}

		try {
			// the conversion is written for MapLibre GL JS. A Mapbox GL JS map is passed as it is,
			// which works for what both libraries have in common.
			const svg = await maplibre2svg(renderMap as unknown as Parameters<typeof maplibre2svg>[0], {
				width: this.width,
				height: this.height,
				unit: this.unit,
				labels: this.svgVectorOptions.labels
			});
			this.appendVectorOverlays(svg, renderMap.getBearing());
			return svg;
		} catch (err) {
			console.warn('Failed to export the map as vectors, exporting it as an image instead:', err);
			return undefined;
		}
	}

	/**
	 * Draw the attribution, the scale bar and the north icon on the vector SVG. They are
	 * laid out like on the export canvas, but in CSS pixels which the SVG is drawn in.
	 */
	private appendVectorOverlays(svg: SVGSVGElement, bearing: number) {
		const page = {
			width: parseFloat(this.toPixels(this.width)),
			height: parseFloat(this.toPixels(this.height))
		};
		const boxOf = (
			className: string,
			options: { visibility?: string; position?: ControlPosition; margin?: number },
			fallback: ControlPosition
		) => {
			if (options.visibility === 'none') return undefined;
			const element = this.hiddenContainer
				?.getElementsByClassName(className)
				?.item(0) as HTMLElement | null;
			if (!element || element.offsetWidth === 0) return undefined;
			const size = { width: element.offsetWidth, height: element.offsetHeight };
			const origin = this.getOverlayOrigin(
				page,
				options.position ?? fallback,
				size.width,
				size.height,
				options.margin ?? 10
			);
			return { element, box: { ...origin, ...size } as OverlayBox };
		};

		const attributionPosition = this.attributionOptions.position ?? 'bottom-right';
		const attribution = boxOf(
			this.attributionClassName,
			this.attributionOptions,
			attributionPosition
		);
		const text = attribution?.element.textContent?.trim();
		if (attribution && text) svg.appendChild(createAttributionOverlay(text, attribution.box));

		const scalebar = boxOf(this.scalebarClassName, this.scalebarOptions, 'bottom-left');
		if (scalebar) {
			const { box } = scalebar;
			const position = this.scalebarOptions.position ?? 'bottom-left';
			const margin = this.scalebarOptions.margin ?? 10;
			// stack the scale bar on top of / below the attribution when they share a corner
			if (attribution && text && attributionPosition === position) {
				box.y = position.startsWith('top')
					? attribution.box.y + attribution.box.height + margin
					: attribution.box.y - box.height - margin;
			}
			svg.appendChild(createScalebarOverlay(scalebar.element.textContent?.trim() ?? '', box));
		}

		const icon = this.northIconOptions.image;
		if (this.northIconOptions.visibility !== 'none' && icon) {
			const size = page.width * (this.northIconOptions.imageSizeFraction ?? 0.05);
			const origin = this.getOverlayOrigin(
				page,
				this.northIconOptions.position ?? 'top-right',
				size,
				size,
				this.northIconOptions.margin ?? 10
			);
			const overlay = createNorthIconOverlay(
				icon,
				{ ...origin, width: size, height: size },
				bearing
			);
			if (overlay) svg.appendChild(overlay);
		}
	}

	/**
	 * Whether the hidden map can be georeferenced by the geographic coordinates of its four
	 * corners, which needs a flat Web Mercator map seen from straight above.
	 * @param renderMap hidden Map object which has finished rendering
	 */
	protected isGeoreferenceSupported(renderMap: MaplibreMap | MapboxMap) {
		if (renderMap.getPitch() !== 0) return false;
		const map = renderMap as unknown as {
			getTerrain?: () => unknown;
			getProjection?: () => { type?: unknown; name?: unknown } | undefined | null;
		};
		if (map.getTerrain?.()) return false;
		const projection = map.getProjection?.();
		// MapLibre names it `type`, Mapbox names it `name`
		const name = projection?.type ?? projection?.name;
		return name === undefined || name === null || name === 'mercator';
	}

	/**
	 * Read the geographic coordinates of the corners of the hidden map, which georeference
	 * the exported PDF or GeoTIFF. They have to be read while the hidden map still exists.
	 * @returns undefined when the map cannot be georeferenced
	 */
	private getGeoCorners(renderMap: MaplibreMap | MapboxMap): GeoCorners | undefined {
		if (!this.isGeoreferenceSupported(renderMap)) {
			console.warn(
				`The map cannot be georeferenced, exporting the ${this.format.toUpperCase()} without its location`
			);
			return undefined;
		}
		const container = renderMap.getContainer();
		const width = container.clientWidth;
		const height = container.clientHeight;
		const corner = (x: number, y: number): [number, number] => {
			const { lng, lat } = renderMap.unproject([x, y]);
			return [lng, lat];
		};
		return {
			topLeft: corner(0, 0),
			topRight: corner(width, 0),
			bottomRight: corner(width, height),
			bottomLeft: corner(0, height)
		};
	}

	/**
	 * Read the attribution of the hidden map as plain text, as it is shown on the map.
	 * The sources of the style are used when the attribution control is hidden.
	 */
	private getAttributionText(renderMap: MaplibreMap | MapboxMap) {
		const element = this.hiddenContainer
			?.getElementsByClassName(`${this.attributionClassName}-inner`)
			?.item(0);
		const fromElement = (() => {
			if (!element) return undefined;
			const clone = element.cloneNode(true) as HTMLElement;
			// Mapbox appends a link to its map feedback page, which is no attribution
			clone.querySelectorAll(`.mapbox-improve-map`).forEach((link) => link.remove());
			return clone.textContent;
		})();
		const text =
			fromElement ??
			Object.values(renderMap.getStyle()?.sources ?? {})
				.map((source) => (source as { attribution?: string }).attribution)
				.filter((attribution): attribution is string => !!attribution)
				.map((html) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '')
				.filter((attribution, i, all) => attribution && all.indexOf(attribution) === i)
				.join(' | ');
		return text.replace(/\s+/g, ' ').trim() || undefined;
	}

	/**
	 * Read what is written into the exported PDF or GeoTIFF from the hidden map, while it
	 * still exists. A GeoTIFF is always georeferenced, a PDF only when `geoPdf` is true.
	 * @param renderMap hidden Map object which has finished rendering
	 */
	private getExportInfo(renderMap: MaplibreMap | MapboxMap): ExportInfo {
		if (this.format !== Format.PDF && this.format !== Format.GEOTIFF) return {};
		const georeference = this.format === Format.GEOTIFF || this.geoPdf;
		return {
			corners: georeference ? this.getGeoCorners(renderMap) : undefined,
			author: this.getAttributionText(renderMap)
		};
	}

	private async exportImage(
		canvas: HTMLCanvasElement,
		renderMap: MaplibreMap | MapboxMap,
		svg?: SVGSVGElement,
		exportInfo: ExportInfo = {}
	) {
		const fileName = `${this.fileName}.${this.format}`;
		switch (this.format) {
			case Format.PNG:
				this.toPNG(canvas, fileName);
				break;
			case Format.JPEG:
				this.toJPEG(canvas, fileName);
				break;
			case Format.WEBP:
				this.downloadBlob(await this.createWebpBlob(canvas), fileName);
				break;
			case Format.PDF:
				if (svg) (await this.createVectorPDF(svg, renderMap, exportInfo)).save(fileName);
				else this.toPDF(canvas, renderMap, fileName, exportInfo);
				break;
			case Format.SVG:
				if (svg) this.downloadBlob(this.createVectorSVGBlob(svg), fileName);
				else this.toSVG(canvas, fileName);
				break;
			case Format.GEOTIFF:
				this.downloadBlob(await this.createGeoTiffBlob(canvas, renderMap, exportInfo), fileName);
				break;
			default:
				console.error(`Invalid file format: ${this.format}`);
				break;
		}
	}

	/**
	 * Convert canvas to PNG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toPNG(canvas: HTMLCanvasElement, fileName: string) {
		const a = document.createElement('a');
		a.href = canvas.toDataURL();
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Convert canvas to JPEG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toJPEG(canvas: HTMLCanvasElement, fileName: string) {
		const uri = canvas.toDataURL('image/jpeg', 0.85);
		const a = document.createElement('a');
		a.href = uri;
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Encode the composed canvas as WebP. Browsers which cannot encode WebP, such as Safari,
	 * return a PNG instead, which is warned about in the console.
	 * @param canvas composed Canvas element
	 */
	private async createWebpBlob(canvas: HTMLCanvasElement) {
		const blob = await this.canvasToBlob(canvas, 'image/webp', 0.9);
		if (blob.type !== 'image/webp') {
			console.warn(`This browser cannot encode WebP, the map is exported as ${blob.type} instead`);
		}
		return blob;
	}

	/**
	 * Convert canvas to PDF
	 * @param canvas composed Canvas element
	 * @param map Map object used to read the document properties
	 * @param fileName file name
	 * @param exportInfo what is written into the PDF besides the map
	 */
	private toPDF(
		canvas: HTMLCanvasElement,
		map: MaplibreMap | MapboxMap,
		fileName: string,
		exportInfo: ExportInfo = {}
	) {
		this.createPDF(canvas, map, exportInfo).save(fileName);
	}

	/**
	 * Wrap the composed canvas in a PDF document of the configured page size.
	 * @param canvas composed Canvas element
	 * @param map Map object used to read the document properties
	 * @param exportInfo what is written into the PDF besides the map
	 */
	private createPDF(
		canvas: HTMLCanvasElement,
		map: MaplibreMap | MapboxMap,
		exportInfo: ExportInfo = {}
	) {
		const pdf = this.createPDFDocument(map, exportInfo);

		pdf.addImage(
			canvas.toDataURL('image/png'),
			'png',
			0,
			0,
			this.width,
			this.height,
			undefined,
			'FAST'
		);

		return pdf;
	}

	/**
	 * Create an empty PDF document of the configured page size.
	 * @param map Map object used to read the document properties
	 * @param exportInfo what is written into the PDF besides the map
	 */
	private createPDFDocument(map: MaplibreMap | MapboxMap, { corners, author }: ExportInfo = {}) {
		const pdf = new jsPDF({
			orientation: this.width > this.height ? 'l' : 'p',
			unit: this.unit,
			compress: true,
			format: [this.width, this.height]
		});

		const { lng, lat } = map.getCenter();
		pdf.setProperties({
			title: map.getStyle().name,
			subject: `center: [${lng}, ${lat}], zoom: ${map.getZoom()}`,
			creator: this.creatorName,
			author: author ?? ''
		});

		if (corners) {
			// jsPDF has no API for page dictionary entries, but it publishes `putPage` while it
			// writes the page dictionary, which is where the viewport has to go.
			const k = pdf.internal.scaleFactor;
			const viewport = createGeoPdfViewport(corners, this.width * k, this.height * k);
			// `write` exists on `internal` but is missing from the typings of jsPDF
			const internal = pdf.internal as typeof pdf.internal & { write: (value: string) => void };
			internal.events.subscribe('putPage', () => internal.write(viewport));
		}

		return pdf;
	}

	/**
	 * Draw the vector SVG on a PDF document of the configured page size, as vectors.
	 * @param svg SVG holding the map as vectors
	 * @param map Map object used to read the document properties
	 * @param exportInfo what is written into the PDF besides the map
	 */
	private async createVectorPDF(
		svg: SVGSVGElement,
		map: MaplibreMap | MapboxMap,
		exportInfo: ExportInfo = {}
	) {
		const pdf = this.createPDFDocument(map, exportInfo);
		const clone = svg.cloneNode(true) as SVGSVGElement;
		const objectUrls = await this.replaceDataUrlImages(clone);
		try {
			await pdf.svg(clone, { x: 0, y: 0, width: this.width, height: this.height });
		} finally {
			objectUrls.forEach((url) => URL.revokeObjectURL(url));
		}
		return pdf;
	}

	/**
	 * Replace the data URLs of the images in the SVG by object URLs.
	 *
	 * svg2pdf.js parses a data URL by a regular expression which overflows the call stack for
	 * a large image, such as a layer rendered as an image for a large page or a high DPI. Any
	 * other URL is loaded as it is, and its format is read from the extension, which is given
	 * by the fragment of the object URL.
	 * @param svg SVG whose images are replaced
	 * @returns object URLs which have to be revoked after the SVG was drawn
	 */
	private async replaceDataUrlImages(svg: SVGSVGElement) {
		const xlinkNs = 'http://www.w3.org/1999/xlink';
		const objectUrls: string[] = [];
		for (const image of Array.from(svg.getElementsByTagName('image'))) {
			const href = image.getAttributeNS(xlinkNs, 'href') || image.getAttribute('href');
			// SVG images are parsed as text by svg2pdf.js, which an object URL would break
			if (!href?.startsWith('data:image/') || href.startsWith('data:image/svg')) continue;
			const blob = await (await fetch(href)).blob();
			const objectUrl = URL.createObjectURL(blob);
			objectUrls.push(objectUrl);
			const url = `${objectUrl}#image.${blob.type.split('/')[1] ?? 'png'}`;
			image.setAttributeNS(xlinkNs, 'xlink:href', url);
			image.setAttribute('href', url);
		}
		return objectUrls;
	}

	/**
	 * Write the composed canvas as a GeoTIFF placed on the map in EPSG:3857.
	 * @param canvas composed Canvas element
	 * @param map Map object used to read the description of the image
	 * @param exportInfo what is written into the GeoTIFF besides the map
	 */
	private createGeoTiffBlob(
		canvas: HTMLCanvasElement,
		map: MaplibreMap | MapboxMap,
		{ corners, author }: ExportInfo = {}
	) {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context for the export canvas');
		const { lng, lat } = map.getCenter();
		return createGeoTiff(
			{
				width: canvas.width,
				height: canvas.height,
				read: (y, rows) => ctx.getImageData(0, y, canvas.width, rows).data
			},
			{
				corners,
				dpi: this.dpi,
				description: `${map.getStyle().name ?? 'map'}, center: [${lng}, ${lat}], zoom: ${map.getZoom()}`,
				software: this.creatorName,
				artist: author
			}
		);
	}

	/** Serialize the vector SVG as a file */
	private createVectorSVGBlob(svg: SVGSVGElement) {
		return new Blob([svgToString(svg)], { type: 'image/svg+xml' });
	}

	/** Download a blob as a file */
	private downloadBlob(blob: Blob, fileName: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	/**
	 * Convert canvas to SVG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toSVG(canvas: HTMLCanvasElement, fileName: string) {
		const a = document.createElement('a');
		a.href = `data:application/xml,${encodeURIComponent(this.createSVG(canvas))}`;
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Wrap the composed canvas in an SVG document of the configured page size.
	 * @param canvas Canvas element
	 */
	private createSVG(canvas: HTMLCanvasElement) {
		const uri = canvas.toDataURL('image/png');

		const pxWidth = Number(this.toPixels(this.width, this.dpi).replace('px', ''));
		const pxHeight = Number(this.toPixels(this.height, this.dpi).replace('px', ''));

		const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
      width="${pxWidth}"
      height="${pxHeight}"
      viewBox="0 0 ${pxWidth} ${pxHeight}"
      xml:space="preserve">
        <image style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;"
      xlink:href="${uri}" width="${pxWidth}" height="${pxHeight}"></image>
    </svg>`;

		return svg;
	}

	/**
	 * Convert the composed canvas into a `Blob` of the configured format.
	 * @param canvas composed Canvas element
	 * @param svg SVG holding the map as vectors, which SVG and PDF are made of when given
	 * @param exportInfo what is written into the PDF besides the map
	 */
	private async toBlobOfFormat(
		canvas: HTMLCanvasElement,
		svg?: SVGSVGElement,
		exportInfo: ExportInfo = {}
	): Promise<Blob> {
		switch (this.format) {
			case Format.JPEG:
				return this.canvasToBlob(canvas, 'image/jpeg', 0.85);
			case Format.WEBP:
				return this.createWebpBlob(canvas);
			case Format.PDF:
				// the source map is used for the document properties. The map which was rendered
				// shares its center, zoom and style, and it is already removed at this point.
				if (svg) return (await this.createVectorPDF(svg, this.map, exportInfo)).output('blob');
				return this.createPDF(canvas, this.map, exportInfo).output('blob');
			case Format.SVG:
				if (svg) return this.createVectorSVGBlob(svg);
				return new Blob([this.createSVG(canvas)], { type: 'image/svg+xml' });
			case Format.GEOTIFF:
				return this.createGeoTiffBlob(canvas, this.map, exportInfo);
			case Format.PNG:
				return this.canvasToBlob(canvas, 'image/png');
			default:
				throw new Error(`Invalid file format: ${this.format}`);
		}
	}

	/** Promisified `HTMLCanvasElement.toBlob` */
	private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
		return new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
					else reject(new Error(`Failed to convert the map image to ${type}`));
				},
				type,
				quality
			);
		});
	}

	/**
	 * Convert mm/inch to pixel
	 * @param length mm/inch length
	 * @param conversionFactor DPI value. default is 96.
	 */
	private toPixels(length: number, conversionFactor = 96) {
		if (this.unit === Unit.mm) {
			conversionFactor /= 25.4;
		}
		return `${conversionFactor * length}px`;
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
