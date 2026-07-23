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
import type { ControlPosition } from 'maplibre-gl';
import { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';
import { CirclePaint, Map as MapboxMap } from 'mapbox-gl';
import {
	AttributionOptions,
	DPIType,
	Format,
	FormatType,
	NorthIconOptions,
	ScalebarOptions,
	Size,
	SizeType,
	Unit,
	UnitType
} from './interfaces';

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
			const translateY = parseInt(match[2]);

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
	 * Generate and download Map image.
	 *
	 * The map is rendered on a hidden map object at the requested page size and DPI,
	 * then its canvas is composed with the scale bar, north icon and attribution
	 * onto a 2D canvas which is what actually gets exported.
	 */
	async generate() {
		this.addLoader();
		this.showLoader();

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

			const canvas = await this.composeCanvas(renderMap);
			this.exportImage(canvas, renderMap);

			renderMap.remove();
		} catch (err) {
			console.error('Failed to generate map image:', err);
		} finally {
			hidden.parentNode?.removeChild(hidden);
			hidden.remove();
			this.hiddenContainer = undefined;
			Object.defineProperty(window, 'devicePixelRatio', {
				get: () => actualPixelRatio,
				configurable: true
			});
			this.hideLoader();
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
		canvas: HTMLCanvasElement,
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

	private exportImage(canvas: HTMLCanvasElement, renderMap: MaplibreMap | MapboxMap) {
		const fileName = `${this.fileName}.${this.format}`;
		switch (this.format) {
			case Format.PNG:
				this.toPNG(canvas, fileName);
				break;
			case Format.JPEG:
				this.toJPEG(canvas, fileName);
				break;
			case Format.PDF:
				this.toPDF(canvas, renderMap, fileName);
				break;
			case Format.SVG:
				this.toSVG(canvas, fileName);
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
	 * Convert canvas to PDF
	 * @param canvas composed Canvas element
	 * @param map Map object used to read the document properties
	 * @param fileName file name
	 */
	private toPDF(canvas: HTMLCanvasElement, map: MaplibreMap | MapboxMap, fileName: string) {
		const pdf = new jsPDF({
			orientation: this.width > this.height ? 'l' : 'p',
			unit: this.unit,
			compress: true,
			format: [this.width, this.height]
		});

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

		const { lng, lat } = map.getCenter();
		pdf.setProperties({
			title: map.getStyle().name,
			subject: `center: [${lng}, ${lat}], zoom: ${map.getZoom()}`,
			creator: 'Mapbox GL Export Plugin',
			author: '(c)Mapbox, (c)OpenStreetMap'
		});

		pdf.save(fileName);
	}

	/**
	 * Convert canvas to SVG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toSVG(canvas: HTMLCanvasElement, fileName: string) {
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

		const a = document.createElement('a');
		a.href = `data:application/xml,${encodeURIComponent(svg)}`;
		a.download = fileName;
		a.click();
		a.remove();
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
