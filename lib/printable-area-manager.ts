import { Map as MaplibreMap } from 'maplibre-gl';
import {
  Unit,
} from './map-generator';

export default class PrintableAreaManager {
    private map: MaplibreMap | undefined;

    private width: number;

    private height: number;

    private unit: string;

    private svgCanvas: SVGElement | undefined;

    private svgPath: SVGElement | undefined;

    constructor(
      map: MaplibreMap | undefined,
    ) {
      this.map = map;
      if (this.map === undefined) {
        return;
      }
      this.mapResize = this.mapResize.bind(this);
      this.map.on('resize', this.mapResize);
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
      this.unit = Unit.mm;
      this.generateCutOut();
    }

    private generateCutOut() {
      if (this.map === undefined
        || this.svgCanvas === undefined
        || this.svgPath === undefined) {
        return;
      }
      const width = this.toPixels(this.width);
      const height = this.toPixels(this.height);
      const clientWidth = this.map?.getCanvas().clientWidth;
      const clientHeight = this.map?.getCanvas().clientHeight;
      const startX = clientWidth / 2 - width / 2;
      const endX = startX + width;
      const startY = clientHeight / 2 - height / 2;
      const endY = startY + height;

      this.svgCanvas.setAttribute('width', `${clientWidth}px`);
      this.svgCanvas.setAttribute('height', `${clientHeight}px`);
      this.svgPath.setAttribute('d', `M 0 0 L ${clientWidth} 0 L ${clientWidth} ${clientHeight} L 0 ${clientHeight} M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY} L ${endX} ${startY}`);
    }

    public destroy() {
      if (this.svgCanvas !== undefined) {
        this.svgCanvas.remove();
        this.svgCanvas = undefined;
      }

      if (this.map !== undefined) {
        this.map = undefined;
      }
    }

    /**
     * Convert mm/inch to pixel
     * @param length mm/inch length
     * @param conversionFactor DPI value. default is 96.
     */
    private toPixels(length:number, conversionFactor = 96) {
      if (this.unit === Unit.mm) {
        conversionFactor /= 25.4;
      }
      return conversionFactor * length;
    }
}
