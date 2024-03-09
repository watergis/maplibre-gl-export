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

import { jsPDF } from 'jspdf';
import { Map as MaplibreMap } from 'maplibre-gl';
import 'js-loading-overlay';

export const Format = {
	JPEG: 'jpg',
	PNG: 'png',
	PDF: 'pdf',
	SVG: 'svg'
} as const;
type Format = (typeof Format)[keyof typeof Format];

export const Unit = {
	// don't use inch unit. because page size setting is using mm unit.
	in: 'in',
	mm: 'mm'
} as const;
type Unit = (typeof Unit)[keyof typeof Unit];

export const Size = {
	// A0, A1, B0, B1 are not working well.
	// A0: [1189, 841],
	// A1: [841, 594],
	LETTER: [279, 216], // 8.5x11 - works
	//TABLOID: [432,279] // 11x17 - not working currently prints to 11.68x8.27 in landscape
	A2: [594, 420],
	A3: [420, 297],
	A4: [297, 210],
	A5: [210, 148],
	A6: [148, 105],
	// B0: [1414, 1000],
	// B1: [1000, 707],
	B2: [707, 500],
	B3: [500, 353],
	B4: [353, 250],
	B5: [250, 176],
	B6: [176, 125]
} as const;
type Size = (typeof Size)[keyof typeof Size];

export const PageOrientation = {
	Landscape: 'landscape',
	Portrait: 'portrait'
} as const;
type PageOrientation = (typeof PageOrientation)[keyof typeof PageOrientation];

export const DPI = {
	72: 72,
	96: 96,
	200: 200,
	300: 300,
	400: 400
} as const;
type DPI = (typeof DPI)[keyof typeof DPI];

export default class MapGenerator {
	private map: MaplibreMap;

	private width: number;

	private height: number;

	private dpi: number;

	private format: string;

	private unit: Unit;

	private fileName: string;

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
		size: Size = Size.A4,
		dpi = 300,
		format: string = Format.PNG.toString(),
		unit: Unit = Unit.mm,
		fileName = 'map'
	) {
		this.map = map;
		this.width = size[0];
		this.height = size[1];
		this.dpi = dpi;
		this.format = format;
		this.unit = unit;
		this.fileName = fileName;
	}

	/**
	 * Generate and download Map image
	 */
	generate() {
		// eslint-disable-next-line
		const this_ = this;

		// see documentation for JS Loading Overray library
		// https://js-loading-overlay.muhdfaiz.com
		// eslint-disable-next-line
		// @ts-ignore
		JsLoadingOverlay.show({
			overlayBackgroundColor: '#5D5959',
			overlayOpacity: '0.6',
			spinnerIcon: 'ball-spin',
			spinnerColor: '#2400FD',
			spinnerSize: '2x',
			overlayIDName: 'overlay',
			spinnerIDName: 'spinner',
			offsetX: 0,
			offsetY: 0,
			containerID: null,
			lockScroll: false,
			overlayZIndex: 9998,
			spinnerZIndex: 9999
		});

		// Calculate pixel ratio
		const actualPixelRatio: number = window.devicePixelRatio;
		Object.defineProperty(window, 'devicePixelRatio', {
			get() {
				return this_.dpi / 96;
			}
		});
		// Create map container
		const hidden = document.createElement('div');
		hidden.className = 'hidden-map';
		document.body.appendChild(hidden);
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
					if (!src[key]) delete src[key];
				});
			});
		}

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
			transformRequest: (this.map as any)._requestManager._transformRequestFn
		});

		// comment this statement because an error is occured since maplibre v3. images[key].data has no value (null)
		// it looks working well in my style. let's see how it works without this code
		// the below code was added by https://github.com/watergis/maplibre-gl-export/pull/18.
		// const images = (this.map.style.imageManager || {}).images || [];
		// Object.keys(images).forEach((key) => {
		// 	renderMap.addImage(key, images[key].data);
		// });

		renderMap.once('idle', () => {
			const canvas = renderMap.getCanvas();
			const fileName = `${this.fileName}.${this_.format}`;
			switch (this_.format) {
				case Format.PNG:
					this_.toPNG(canvas, fileName);
					break;
				case Format.JPEG:
					this_.toJPEG(canvas, fileName);
					break;
				case Format.PDF:
					this_.toPDF(renderMap, fileName);
					break;
				case Format.SVG:
					this_.toSVG(canvas, fileName);
					break;
				default:
					console.error(`Invalid file format: ${this_.format}`);
					break;
			}

			renderMap.remove();
			hidden.parentNode?.removeChild(hidden);
			Object.defineProperty(window, 'devicePixelRatio', {
				get() {
					return actualPixelRatio;
				}
			});
			hidden.remove();

			// eslint-disable-next-line
			// @ts-ignore
			JsLoadingOverlay.hide();
		});
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
		// eslint-disable-next-line
		// @ts-ignore
		if (canvas.msToBlob) {
			// for IE11
			const blob = this.toBlob(uri);
			(window.navigator as any).msSaveBlob(blob, fileName);
		} else {
			// for other browsers except IE11
			const a = document.createElement('a');
			a.href = uri;
			a.download = fileName;
			a.click();
			a.remove();
		}
	}

	/**
	 * Convert Map object to PDF
	 * @param map Map object
	 * @param fileName file name
	 */
	private toPDF(map: MaplibreMap, fileName: string) {
		const canvas = map.getCanvas();
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
	 * Convert base64 to Blob
	 * @param base64 string value for base64
	 */
	private toBlob(base64: string): Blob {
		const bin = atob(base64.replace(/^.*,/, ''));
		const buffer = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i += 1) {
			buffer[i] = bin.charCodeAt(i);
		}
		const blob = new Blob([buffer.buffer], { type: 'image/png' });
		return blob;
	}
}
