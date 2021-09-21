import { Map as MaplibreMap } from 'maplibre-gl';

export default class CrosshairManager {
    private map: MaplibreMap | undefined;

    private width: number | undefined;

    private height: number | undefined;

    private svgCanvas: SVGElement | undefined;

    private xLine: SVGElement | undefined;

    private yLine: SVGElement | undefined;

    private color = '#535353';

    constructor(
      map: MaplibreMap | undefined,
    ) {
      this.map = map;
      this.mapResize = this.mapResize.bind(this);
    }

    public create() {
      this.updateValues();
      if (this.map !== undefined) {
        this.map.on('resize', this.mapResize);
        this.createCanvas(this.map.getCanvasContainer());
      } else {
        console.error('map object is null');
      }
    }

    private updateValues() {
      this.width = this.map?.getCanvas().clientWidth;
      this.height = this.map?.getCanvas().clientHeight;
    }

    private mapResize() {
      this.updateValues();
      this.updateCanvas();
    }

    private updateCanvas() {
      if (
        this.svgCanvas !== undefined
            && this.yLine !== undefined
            && this.xLine !== undefined
            && this.width !== undefined
            && this.height !== undefined) {
        this.svgCanvas.setAttribute('width', `${this.width}px`);
        this.svgCanvas.setAttribute('height', `${this.height}px`);
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        this.yLine.setAttribute('x1', `${halfWidth}px`);
        this.yLine.setAttribute('y1', '0px');
        this.yLine.setAttribute('x2', `${halfWidth}px`);
        this.yLine.setAttribute('y2', `${this.height}px`);

        this.xLine.setAttribute('x1', `${0}px`);
        this.xLine.setAttribute('y1', `${halfHeight}px`);
        this.xLine.setAttribute('x2', `${this.width}px`);
        this.xLine.setAttribute('y2', `${halfHeight}px`);
      } else {
        console.error('element value is null');
      }
    }

    private createCanvas(container) {
      if (
        this.width !== undefined
            && this.height !== undefined) {
        const canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        canvas.style.position = 'relative';
        canvas.setAttribute('width', `${this.width}px`);
        canvas.setAttribute('height', `${this.height}px`);
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        this.yLine = canvas.appendChild(this.createLine(halfWidth, 0, halfWidth, this.height, this.color, '2px'));
        this.xLine = canvas.appendChild(this.createLine(0, halfHeight, this.width, halfHeight, this.color, '2px'));
        container?.appendChild(canvas);
        this.svgCanvas = canvas;
      }
    }

    private createLine(x1, y1, x2, y2, color, w) {
      const aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      aLine.setAttribute('x1', x1);
      aLine.setAttribute('y1', y1);
      aLine.setAttribute('x2', x2);
      aLine.setAttribute('y2', y2);
      aLine.setAttribute('stroke-dasharray', '5,5');
      aLine.setAttribute('stroke', color);
      aLine.setAttribute('stroke-width', w);
      return aLine;
    }

    public destroy() {
      if (this.xLine !== undefined) {
        this.xLine.remove();
        this.xLine = undefined;
      }

      if (this.yLine !== undefined) {
        this.yLine.remove();
        this.yLine = undefined;
      }

      if (this.svgCanvas !== undefined) {
        this.svgCanvas.remove();
        this.svgCanvas = undefined;
      }

      if (this.map !== undefined) {
        this.map.off('resize', this.mapResize);
        this.map = undefined;
      }
    }
}
