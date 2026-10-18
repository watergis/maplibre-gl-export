import { maplibre2svg, svgToString } from '@watergis/maplibre2svg';
import { Format, type FormatType } from '../../interfaces';
import { toPixels } from '../units';
import { BaseFormat } from './base';

const svgNs = 'http://www.w3.org/2000/svg';
const xlinkNs = 'http://www.w3.org/1999/xlink';

/**
 * SVG document of the configured page size. It holds the map as vectors when
 * `svgVectorOptions.enabled` is true and the map can be converted, and the composed canvas
 * as an image otherwise.
 */
export class SvgFormat extends BaseFormat {
	readonly extension: FormatType = Format.SVG;

	protected readonly name: string = 'SVG';

	private svg: Promise<{ element: SVGSVGElement; vector: boolean }> | undefined;

	async toBlob() {
		const svg = await this.createSvgElement();
		return new Blob([svgToString(svg)], { type: 'image/svg+xml' });
	}

	async getVectorSvg() {
		const { element, vector } = await this.getSvg();
		return vector ? svgToString(element) : undefined;
	}

	/**
	 * Create the SVG of the map: the vector SVG when it can be created, or the composed canvas
	 * wrapped as an image otherwise. It is created once, and the same SVG is returned afterwards.
	 */
	protected async createSvgElement() {
		return (await this.getSvg()).element;
	}

	private getSvg() {
		this.svg ??= (async () => {
			// the canvas has to be composed first, because the vector SVG hides layers of the
			// map to render the ones which cannot be converted
			const canvas = await this.getCanvas();
			const vector = await this.composeVectorSVG();
			return vector
				? { element: vector, vector: true }
				: { element: this.createRasterSVG(canvas), vector: false };
		})();
		return this.svg;
	}

	/**
	 * Convert the map into an SVG which holds its layers as vectors, with the overlays drawn
	 * on top.
	 * @returns undefined when vectors were not asked for, or when the map cannot be converted
	 */
	private async composeVectorSVG() {
		const { svgVectorOptions, unit, isVectorExportSupported } = this.options;
		if (!svgVectorOptions.enabled) return undefined;
		if (!isVectorExportSupported(this.map)) {
			console.warn('The map cannot be exported as vectors, exporting it as an image instead');
			return undefined;
		}

		try {
			// the conversion is written for MapLibre GL JS. A Mapbox GL JS map is passed as it is,
			// which works for what both libraries have in common.
			const svg = await maplibre2svg(this.map as unknown as Parameters<typeof maplibre2svg>[0], {
				width: this.width,
				height: this.height,
				unit,
				labels: svgVectorOptions.labels
			});
			this.appendVectorOverlays(svg);
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
	private appendVectorOverlays(svg: SVGSVGElement) {
		const layout = {
			width: parseFloat(toPixels(this.width, this.options.unit)),
			height: parseFloat(toPixels(this.height, this.options.unit)),
			scale: 1
		};
		for (const overlay of this.createOverlays().overlays) {
			const element = overlay.create(layout);
			if (element) svg.appendChild(element);
		}
	}

	/**
	 * Wrap the composed canvas in an SVG of the configured page size.
	 * @param canvas composed Canvas element
	 */
	private createRasterSVG(canvas: HTMLCanvasElement) {
		const { unit, dpi } = this.options;
		const pxWidth = String(parseFloat(toPixels(this.width, unit, dpi)));
		const pxHeight = String(parseFloat(toPixels(this.height, unit, dpi)));

		const svg = document.createElementNS(svgNs, 'svg');
		svg.setAttribute('version', '1.1');
		svg.setAttribute('width', pxWidth);
		svg.setAttribute('height', pxHeight);
		svg.setAttribute('viewBox', `0 0 ${pxWidth} ${pxHeight}`);

		const image = document.createElementNS(svgNs, 'image');
		image.setAttributeNS(xlinkNs, 'xlink:href', canvas.toDataURL('image/png'));
		image.setAttribute('width', pxWidth);
		image.setAttribute('height', pxHeight);
		svg.appendChild(image);

		return svg;
	}
}
