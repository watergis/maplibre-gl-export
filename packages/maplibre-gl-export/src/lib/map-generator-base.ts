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
import {
	Map as MaplibreMap,
	PointLike,
	SourceSpecification,
	StyleSpecification,
	SymbolLayerSpecification
} from 'maplibre-gl';
import { CirclePaint, Map as MapboxMap } from 'mapbox-gl';
import 'js-loading-overlay';
import {
	AttributionOptions,
	AttributionStyle,
	DPIType,
	Format,
	FormatType,
	NorthIconOptions,
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
	style: {
		textSize: 16,
		textHaloColor: '#FFFFFF',
		textHaloWidth: 0.8,
		textColor: '#000000',
		fallbackTextFont: ['Open Sans Regular']
	},
	visibility: 'visible',
	position: 'bottom-right'
};

export const defaultNorthIconOptions: NorthIconOptions = {
	image: `<svg width="800px" height="800px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--gis" preserveAspectRatio="xMidYMid meet"><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="none" stroke="white" stroke-width="1.5"/><path d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z" fill="#000000" fill-rule="evenodd"></path></svg>`,
	imageName: 'gl-export-north-icon',
	imageSizeFraction: 0.05,
	visibility: 'visible',
	position: 'top-right'
};

export abstract class MapGeneratorBase {
	protected map: MaplibreMap | MapboxMap;

	protected width: number;

	protected height: number;

	protected dpi: number;

	protected format: FormatType;

	protected unit: UnitType;

	protected fileName: string;

	protected markerClassName: string;

	protected markerCirclePaint: CirclePaint;

	protected attributionClassName: string;

	protected attributionOptions: AttributionOptions;

	protected northIconOptions: NorthIconOptions;

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
		map: MaplibreMap | MapboxMap,
		size: SizeType = Size.A4,
		dpi: DPIType = 300,
		format: FormatType = Format.PNG,
		unit: UnitType = Unit.mm,
		fileName = 'map',
		markerClassName = 'maplibregl-marker',
		markerCirclePaint = defaultMarkerCirclePaint,
		attributionClassName = 'maplibregl-ctrl-attrib-inner',
		attributionOptions = defaultAttributionOptions,
		northIconOptions = defaultNorthIconOptions
	) {
		this.map = map;
		this.width = size[0];
		this.height = size[1];
		this.dpi = dpi;
		this.format = format;
		this.unit = unit;
		this.fileName = fileName;
		this.markerClassName = markerClassName;
		this.markerCirclePaint = markerCirclePaint;
		this.attributionClassName = attributionClassName;
		this.attributionOptions = attributionOptions;
		this.northIconOptions = northIconOptions;
	}

	protected abstract getRenderedMap(
		container: HTMLElement,
		style: StyleSpecification | mapboxgl.Style
	): MaplibreMap | MapboxMap;

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
		let renderMap = this.getRenderedMap(container, style);

		renderMap.on('load', () => {
			this.addNorthIconToMap(renderMap).then(() => {
				renderMap.once('idle', () => {
					const isAttributionAdded = this.addAttributions(renderMap);
					if (isAttributionAdded) {
						renderMap.once('idle', () => {
							renderMap = this.renderMapPost(renderMap);
							const markers = this.getMarkers();
							if (markers.length === 0) {
								this.exportImage(renderMap, hidden, actualPixelRatio);
							} else {
								renderMap = this.renderMarkers(renderMap);
								renderMap.once('idle', () => {
									this.exportImage(renderMap, hidden, actualPixelRatio);
								});
							}
						});
					} else {
						renderMap = this.renderMapPost(renderMap);
						const markers = this.getMarkers();
						if (markers.length === 0) {
							this.exportImage(renderMap, hidden, actualPixelRatio);
						} else {
							renderMap = this.renderMarkers(renderMap);
							renderMap.once('idle', () => {
								this.exportImage(renderMap, hidden, actualPixelRatio);
							});
						}
					}
				});
			});
		});
	}

	private stripHtml(htmlString: string) {
		const tempElement = document.createElement('div');
		tempElement.innerHTML = htmlString;
		return tempElement.textContent || tempElement.innerText || '';
	}

	/**
	 * Get icon width against exported map size by using fraction rate
	 * @param renderMap Map object
	 * @param fraction adjust icon size by using this fraction rate. Default is 8%
	 * @returns Icon width calculated
	 */
	private getIconWidth(renderMap: MaplibreMap | MapboxMap, fraction: number) {
		const containerDiv = renderMap.getContainer();
		const width = parseInt(containerDiv.style.width.replace('px', ''));
		return parseInt(`${width * fraction}`);
	}

	/**
	 * Get element position's pixel values based on selected position setting
	 * @param renderMap Map object
	 * @param position Position of element inserted
	 * @param offset Offset value to adjust position
	 * @returns Pixels [width, height]
	 */
	private getElementPosition(
		renderMap: MaplibreMap | MapboxMap,
		position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
		offset = 0
	) {
		const containerDiv = renderMap.getContainer();
		let width = 0;
		let height = 0;

		switch (position) {
			case 'top-left':
				width = 0 + offset;
				height = 0 + offset;
				break;
			case 'top-right':
				width = parseInt(containerDiv.style.width.replace('px', '')) - offset;
				height = 0 + offset;
				break;
			case 'bottom-left':
				width = 0 + offset;
				height = parseInt(containerDiv.style.height.replace('px', '')) - offset;
				break;
			case 'bottom-right':
				width = parseInt(containerDiv.style.width.replace('px', '')) - offset;
				height = parseInt(containerDiv.style.height.replace('px', '')) - offset;
				break;
			default:
				break;
		}

		const pixels = [width, height] as PointLike;
		return pixels;
	}

	/**
	 * Add North Icon SVG to map object
	 * @param renderMap Map object
	 * @returns void
	 */
	private addNorthIconImage(renderMap: MaplibreMap | MapboxMap) {
		const iconSize = this.getIconWidth(renderMap, this.northIconOptions.imageSizeFraction ?? 0.08);
		return new Promise<void>((resolve) => {
			const svgImage = new Image(iconSize, iconSize);
			svgImage.onload = () => {
				if (this.northIconOptions.imageName) {
					renderMap.addImage(this.northIconOptions.imageName, svgImage);
				}
				resolve();
			};
			function svgStringToImageSrc(svgString: string) {
				return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
			}
			if (this.northIconOptions.image) {
				svgImage.src = svgStringToImageSrc(this.northIconOptions.image);
			}
		});
	}

	/**
	 * Add North Icon Symbol layer to renderMap object
	 * @param renderMap Map object
	 * @returns
	 */
	private addNorthIconToMap(renderMap: MaplibreMap | MapboxMap) {
		let visibility: 'visible' | 'none' = this.northIconOptions.visibility ?? 'visible';
		if (renderMap.getZoom() < 2 && this.width > this.height) {
			// if zoom level is less than 2, it will appear twice.
			visibility = 'none';
		}
		return new Promise<void>((resolve) => {
			this.addNorthIconImage(renderMap).then(() => {
				const iconSize = this.getIconWidth(
					renderMap,
					this.northIconOptions.imageSizeFraction ?? 0.08
				);
				const iconOffset = iconSize * 0.8;
				const pixels = this.getElementPosition(
					renderMap,
					this.northIconOptions.position ?? 'top-right',
					iconOffset
				);
				const lngLat = (renderMap as MaplibreMap).unproject(pixels);

				const layerId = this.northIconOptions.imageName ?? 'gl-export-north-icon';
				renderMap.addSource(layerId, {
					type: 'geojson',
					data: {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [lngLat.lng, lngLat.lat]
						},
						properties: {}
					}
				});

				(renderMap as MapboxMap).addLayer({
					id: layerId,
					source: layerId,
					type: 'symbol',
					layout: {
						'icon-image': layerId,
						'icon-size': 1.0,
						'icon-rotate': renderMap.getBearing() * -1,
						'icon-allow-overlap': true,
						'icon-ignore-placement': true,
						visibility: visibility
					},
					paint: {}
				});
				resolve();
			});
		});
	}

	private addAttributions(renderMap: MaplibreMap | MapboxMap) {
		const glyphs = this.map.getStyle().glyphs;
		// skip if glyphs is not available in style.
		if (!glyphs) return false;

		const containerDiv = renderMap.getContainer();
		const elementPosition = this.attributionOptions.position ?? 'bottom-right';
		const pixels = this.getElementPosition(renderMap, elementPosition, 5);
		const width = pixels[0];
		const lngLat = (renderMap as MaplibreMap).unproject(pixels);

		const attrElements = containerDiv.getElementsByClassName(this.attributionClassName);
		const attributions: string[] = [];
		if (attrElements?.length > 0) {
			// try getting attribution from html elements
			const attrs = attrElements.item(0);
			if (attrs) {
				for (let i = 0; i < attrs.children.length; i++) {
					const child = attrs.children.item(i);
					if (!child) continue;
					attributions.push(this.stripHtml(child.outerHTML));
				}
			}
		} else {
			// if not, try to make attribution from style
			const sources = this.map.getStyle().sources;
			Object.keys(sources).forEach((key) => {
				const src: SourceSpecification = sources[key] as SourceSpecification;
				if ('attribution' in src) {
					const attribution = src.attribution as string;
					attributions.push(this.stripHtml(attribution));
				}
			});
		}

		if (attributions.length === 0) return false;

		const attributionText = attributions.join(' | ');

		const attributionId = `attribution`;
		renderMap.addSource(attributionId, {
			type: 'geojson',
			data: {
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [lngLat.lng, lngLat.lat]
				},
				properties: {
					attribution: attributionText
				}
			}
		});

		const fontLayers = this.map
			.getStyle()
			.layers.filter(
				(l) => l.type === 'symbol' && l.layout && 'text-font' in l.layout
			) as SymbolLayerSpecification[];
		const font: string[] =
			fontLayers.length > 0 && fontLayers[0].layout
				? (fontLayers[0].layout['text-font'] as string[])
				: (this.attributionOptions.style?.fallbackTextFont as string[]);

		let visibility: 'visible' | 'none' = this.attributionOptions.visibility ?? 'visible';
		if (renderMap.getZoom() < 2 && this.width > this.height) {
			// if zoom level is less than 2, it will appear twice.
			visibility = 'none';
		}

		const attrStyle = this.attributionOptions.style as AttributionStyle;

		(renderMap as MapboxMap).addLayer({
			id: attributionId,
			source: attributionId,
			type: 'symbol',
			layout: {
				'text-field': ['get', 'attribution'],
				'text-font': font,
				'text-max-width': parseInt(`${width / attrStyle.textSize}`),
				'text-anchor': elementPosition,
				'text-justify': ['top-right', 'bottom-right'].includes(elementPosition) ? 'right' : 'left',
				'text-size': attrStyle.textSize,
				'text-allow-overlap': true,
				visibility: visibility
			},
			paint: {
				'text-halo-color': attrStyle.textHaloColor,
				'text-halo-width': attrStyle.textHaloWidth,
				'text-color': attrStyle.textColor
			}
		});

		return true;
	}

	private exportImage(
		renderMap: MaplibreMap | MapboxMap,
		hiddenDiv: HTMLElement,
		actualPixelRatio: number
	) {
		const canvas = renderMap.getCanvas();

		const fileName = `${this.fileName}.${this.format}`;
		switch (this.format) {
			case Format.PNG:
				this.toPNG(canvas, fileName);
				break;
			case Format.JPEG:
				this.toJPEG(canvas, fileName);
				break;
			case Format.PDF:
				this.toPDF(renderMap, fileName);
				break;
			case Format.SVG:
				this.toSVG(canvas, fileName);
				break;
			default:
				console.error(`Invalid file format: ${this.format}`);
				break;
		}

		renderMap.remove();
		hiddenDiv.parentNode?.removeChild(hiddenDiv);
		Object.defineProperty(window, 'devicePixelRatio', {
			get() {
				return actualPixelRatio;
			}
		});
		hiddenDiv.remove();

		// eslint-disable-next-line
		// @ts-ignore
		JsLoadingOverlay.hide();
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
	 * Convert Map object to PDF
	 * @param map Map object
	 * @param fileName file name
	 */
	private toPDF(map: MaplibreMap | MapboxMap, fileName: string) {
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
}
