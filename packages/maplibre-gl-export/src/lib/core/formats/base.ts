import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import type { FormatType } from '../../interfaces';
import type { GeoCorners } from '../geopdf';
import type { MapGeneratorConfig } from '../map-generator-base';
import { AttributionOverlay, NorthIconOverlay, ScalebarOverlay } from '../overlays';

/**
 * What is written into the exported PDF or GeoTIFF besides the map. It is read from the
 * hidden map, so it has to be read while the hidden map still exists.
 */
export interface ExportInfo {
	/** geographic coordinates of the corners of the map, which georeference the file */
	corners?: GeoCorners;
	/** attribution of the map, which is written as the author of the file */
	author?: string;
}

/** Settings of the generator, with the defaults filled in, which a format reads */
export type FormatOptions = Required<
	Pick<
		MapGeneratorConfig,
		| 'size'
		| 'dpi'
		| 'unit'
		| 'fileName'
		| 'cssPrefix'
		| 'attributionOptions'
		| 'scalebarOptions'
		| 'northIconOptions'
		| 'svgVectorOptions'
		| 'geoPdf'
	>
> & {
	/** Whether the map can be exported as vectors, which depends on the underlying library */
	isVectorExportSupported: (map: MaplibreMap | MapboxMap) => boolean;
};

/**
 * File format the map is exported as. It is created for the hidden map once it has finished
 * rendering, and composes the exported image from it.
 */
export abstract class BaseFormat {
	/** file extension, which is the value of `Format` as well */
	abstract readonly extension: FormatType;

	/** name of the format used in messages */
	protected abstract readonly name: string;

	private canvas: Promise<HTMLCanvasElement> | undefined;

	/**
	 * @param map hidden Map object which has finished rendering
	 * @param options settings of the generator
	 */
	constructor(
		protected map: MaplibreMap | MapboxMap,
		protected options: FormatOptions
	) {}

	/** Convert the map into a `Blob` of this format */
	abstract toBlob(): Promise<Blob>;

	/**
	 * Source of the SVG holding the map as vectors, which is handed to the `onExport` callback.
	 * Only SVG and PDF have it, when the map was exported as vectors.
	 */
	async getVectorSvg(): Promise<string | undefined> {
		return undefined;
	}

	/** file name including the extension */
	get fileName() {
		return `${this.options.fileName}.${this.extension}`;
	}

	/**
	 * Download the map as a file.
	 * @param blob blob created by `toBlob` already, which is downloaded instead of creating it again
	 */
	async download(blob?: Blob) {
		this.downloadBlob(blob ?? (await this.toBlob()), this.fileName);
	}

	/**
	 * Compose the exported image from the rendered map canvas and the overlays. It is composed
	 * once, and the same canvas is returned afterwards.
	 * @returns 2D canvas containing the final image
	 */
	getCanvas() {
		this.canvas ??= this.composeCanvas();
		return this.canvas;
	}

	protected get width() {
		return this.options.size[0];
	}

	protected get height() {
		return this.options.size[1];
	}

	/** Ratio between the exported resolution and the base 96 DPI layout */
	protected get scaleFactor() {
		return this.options.dpi / 96;
	}

	/** Name of the plugin which is written as the creator of the exported file */
	protected get creatorName() {
		return this.options.cssPrefix === 'mapboxgl'
			? 'Mapbox GL Export Plugin'
			: 'MapLibre GL Export Plugin';
	}

	/** Class name of the attribution control element of the underlying library */
	private get attributionClassName() {
		return `${this.options.cssPrefix}-ctrl-attrib`;
	}

	/** Class name of the scale control element of the underlying library */
	private get scalebarClassName() {
		return `${this.options.cssPrefix}-ctrl-scale`;
	}

	private async composeCanvas() {
		const mapCanvas = this.map.getCanvas();

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

		const { attribution, scalebar, overlays } = this.createOverlays();
		// it has to run before the controls are measured, which the vector SVG does as well
		attribution.fitWidth(this.map.getContainer().clientWidth, scalebar);
		const layout = { width: canvas.width, height: canvas.height, scale: this.scaleFactor };
		for (const overlay of overlays) await overlay.draw(ctx, layout);

		return canvas;
	}

	/** Look up a control element of the hidden map by its class name */
	private getControlElement(className: string) {
		const element = this.map
			.getContainer()
			.getElementsByClassName(className)
			.item(0) as HTMLElement | null;
		return element && element.offsetWidth > 0 ? element : undefined;
	}

	/**
	 * Create the overlays drawn over the map, in the order they are drawn. The attribution comes
	 * first because the scale bar is stacked over it when they overlap. They keep the box they
	 * were drawn in, so new ones are created for the canvas and for the vector SVG.
	 */
	protected createOverlays() {
		const attribution = new AttributionOverlay(
			this.options.attributionOptions,
			this.getControlElement(this.attributionClassName)
		);
		const scalebar = new ScalebarOverlay(
			this.options.scalebarOptions,
			this.getControlElement(this.scalebarClassName),
			attribution
		);
		const northIcon = new NorthIconOverlay(this.options.northIconOptions, this.map.getBearing());
		return { attribution, scalebar, overlays: [attribution, scalebar, northIcon] };
	}

	/**
	 * Read what is written into the exported PDF or GeoTIFF besides the map.
	 * @param georeference whether the geographic coordinates of the corners are read
	 */
	protected getExportInfo(georeference: boolean): ExportInfo {
		return {
			corners: georeference ? this.getGeoCorners() : undefined,
			author: this.getAttributionText()
		};
	}

	/**
	 * Whether the map can be georeferenced by the geographic coordinates of its four corners,
	 * which needs a flat Web Mercator map seen from straight above.
	 */
	protected isGeoreferenceSupported() {
		if (this.map.getPitch() !== 0) return false;
		const map = this.map as unknown as {
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
	 * Read the geographic coordinates of the corners of the map, which georeference the file.
	 * @returns undefined when the map cannot be georeferenced
	 */
	private getGeoCorners(): GeoCorners | undefined {
		if (!this.isGeoreferenceSupported()) {
			console.warn(
				`The map cannot be georeferenced, exporting the ${this.name} without its location`
			);
			return undefined;
		}
		const container = this.map.getContainer();
		const width = container.clientWidth;
		const height = container.clientHeight;
		const corner = (x: number, y: number): [number, number] => {
			const { lng, lat } = this.map.unproject([x, y]);
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
	 * Read the attribution of the map as plain text, as it is shown on the map.
	 * The sources of the style are used when the attribution control is hidden.
	 */
	private getAttributionText() {
		const element = this.map
			.getContainer()
			.getElementsByClassName(`${this.attributionClassName}-inner`)
			.item(0);
		const fromElement = (() => {
			if (!element) return undefined;
			const clone = element.cloneNode(true) as HTMLElement;
			// Mapbox appends a link to its map feedback page, which is no attribution
			clone.querySelectorAll(`.mapbox-improve-map`).forEach((link) => link.remove());
			return clone.textContent;
		})();
		const text =
			fromElement ??
			Object.values(this.map.getStyle()?.sources ?? {})
				.map((source) => (source as { attribution?: string }).attribution)
				.filter((attribution): attribution is string => !!attribution)
				.map((html) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '')
				.filter((attribution, i, all) => attribution && all.indexOf(attribution) === i)
				.join(' | ');
		return text.replace(/\s+/g, ' ').trim() || undefined;
	}

	/** Promisified `HTMLCanvasElement.toBlob` of the composed canvas */
	protected async canvasToBlob(type: string, quality?: number) {
		const canvas = await this.getCanvas();
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

	/** Download a blob as a file */
	protected downloadBlob(blob: Blob, fileName: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}
}
