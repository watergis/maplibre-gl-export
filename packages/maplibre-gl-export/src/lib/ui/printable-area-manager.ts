import { type Map as MaplibreMap } from 'maplibre-gl';
import { type Map as MapboxMap } from 'mapbox-gl';

/** Space kept free around the printable area, leaving room for the toolbar below it */
const PADDING = 72;

/**
 * Size of the largest rectangle with the ratio of the page which fits in the viewport.
 * @param viewportWidth width of the viewport in CSS pixels
 * @param viewportHeight height of the viewport in CSS pixels
 * @param pageWidth width of the page in mm
 * @param pageHeight height of the page in mm
 * @param padding space kept free on every side, in CSS pixels
 */
export const fitPageInViewport = (
	viewportWidth: number,
	viewportHeight: number,
	pageWidth: number,
	pageHeight: number,
	padding = 0
) => {
	const width = Math.max(viewportWidth - padding * 2, 1);
	const height = Math.max(viewportHeight - padding * 2, 1);
	const scale = Math.min(width / pageWidth, height / pageHeight);
	return { width: pageWidth * scale, height: pageHeight * scale };
};

export default class PrintableAreaManager {
	private map: MaplibreMap | MapboxMap | undefined;

	private width!: number;

	private height!: number;

	private svgCanvas: SVGElement | undefined;

	private svgPath: SVGElement | undefined;

	/** width in CSS pixels of the area shown on the map */
	private cutoutWidth = 0;

	constructor(map: MaplibreMap | MapboxMap | undefined) {
		this.map = map;
		if (this.map === undefined) {
			return;
		}
		this.mapResize = this.mapResize.bind(this);
		(this.map as MaplibreMap).on('resize', this.mapResize);
		const clientWidth = this.map?.getCanvas().clientWidth;
		const clientHeight = this.map?.getCanvas().clientHeight;
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.style.position = 'absolute';
		svg.style.top = '0px';
		svg.style.left = '0px';
		svg.setAttribute('width', `${clientWidth}px`);
		svg.setAttribute('height', `${clientHeight}px`);
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('style', 'fill:#888888;stroke-width:0');
		path.setAttribute('fill-opacity', '0.5');
		svg.append(path);
		this.map?.getCanvasContainer().appendChild(svg);
		this.svgCanvas = svg;
		this.svgPath = path;
	}

	private mapResize() {
		this.generateCutOut();
	}

	public updateArea(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.generateCutOut();
	}

	/** Width in CSS pixels of the area shown on the map */
	public getCutoutWidth() {
		return this.cutoutWidth;
	}

	private generateCutOut() {
		if (this.map === undefined || this.svgCanvas === undefined || this.svgPath === undefined) {
			return;
		}
		const clientWidth = this.map?.getCanvas().clientWidth;
		const clientHeight = this.map?.getCanvas().clientHeight;
		// the page is fitted into the map, as it is often larger than the map at 96 DPI
		const { width, height } = fitPageInViewport(
			clientWidth,
			clientHeight,
			this.width,
			this.height,
			PADDING
		);
		this.cutoutWidth = width;
		const startX = clientWidth / 2 - width / 2;
		const endX = startX + width;
		const startY = clientHeight / 2 - height / 2;
		const endY = startY + height;

		this.svgCanvas.setAttribute('width', `${clientWidth}px`);
		this.svgCanvas.setAttribute('height', `${clientHeight}px`);
		this.svgPath.setAttribute(
			'd',
			`M 0 0 L ${clientWidth} 0 L ${clientWidth} ${clientHeight} L 0 ${clientHeight} M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY} L ${endX} ${startY}`
		);
	}

	public destroy() {
		if (this.svgCanvas !== undefined) {
			this.svgCanvas.remove();
			this.svgCanvas = undefined;
		}

		if (this.map !== undefined) {
			(this.map as MaplibreMap).off('resize', this.mapResize);
			this.map = undefined;
		}
	}
}
