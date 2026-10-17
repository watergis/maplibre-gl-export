import type { ControlPosition } from 'maplibre-gl';
import { CirclePaint } from 'mapbox-gl';
import type {
	AllowedSize,
	FormatType,
	Language,
	PageOrientationType,
	SizeType
} from '@watergis/export-ui';
import { AttributionOptions } from './AttributionStyle';
import { ExportResult } from './ExportResult';
import { ScalebarOptions } from './ScalebarOptions';

export interface NorthIconOptions {
	image?: string;
	imageName?: string;
	imageSizeFraction?: number;
	visibility?: 'visible' | 'none';
	position?: ControlPosition;
	/** Distance between the north icon and the edge of the map area at 96 DPI */
	margin?: number;
}

/**
 * Settings of the vector export of SVG and PDF.
 *
 * @experimental This feature is experimental. The output may differ from the map, and
 * the options may change in a minor release.
 */
export interface SvgVectorOptions {
	/**
	 * Whether SVG and PDF are exported as real vectors. default is false, which wraps an
	 * image of the map in the SVG / PDF file.
	 *
	 * When it is true, the plugin tries to draw the fill, line and point layers of the map
	 * as vector paths. Layers which have no vector counterpart (raster, hillshade, heatmap,
	 * fill-extrusion, ...) are still embedded as images, and the whole map is exported as an
	 * image when it cannot be converted at all (terrain, globe projection, Mapbox Standard).
	 */
	enabled?: boolean;
	/**
	 * How symbol layers (labels and icons) are written.
	 * - `raster` (default): they are laid over the vector layers as one transparent image,
	 *   so labels look exactly as they do on the map.
	 * - `vector`: labels become editable text. Their position is approximated, because the map
	 *   does not expose where it placed them, and the text is drawn in a font of the viewer.
	 */
	labels?: 'raster' | 'vector';
}

export interface ControlOptions {
	PageSize?: SizeType;
	PageOrientation?: PageOrientationType;
	Format?: FormatType;
	DPI?: number;
	Local?: Language;
	/**
	 * List of page sizes offered in the export dialog. An entry is either the name of one of
	 * the presets (`'A4'`, `'LETTER'`, ...) or a developer-defined `{ name, size }` pair such
	 * as `{ name: '16:9', size: [320, 180] }`.
	 */
	AllowedSizes?: AllowedSize[];
	Filename?: string;
	markerCirclePaint?: CirclePaint;
	attributionOptions?: AttributionOptions;
	scalebarOptions?: ScalebarOptions;
	northIconOptions?: NorthIconOptions;
	/** whether the exported image is downloaded as a file. default is true */
	download?: boolean;
	/**
	 * Called with the exported image once the save button of the dialog has produced it. Use it to pass
	 * the image on to the rest of the application instead of (or in addition to) downloading it.
	 */
	onExport?: (result: ExportResult) => void | Promise<void>;
	/**
	 * Settings of the vector export of SVG and PDF. Set `enabled` to true to export them as
	 * real vectors instead of an image of the map. It is disabled by default.
	 *
	 * `enabled` and `labels` are the initial states of the "Export as vector" and "Export
	 * labels as vector" switches, which the export dialog shows while SVG or PDF is selected.
	 * @experimental
	 */
	svgVectorOptions?: SvgVectorOptions;
	/**
	 * Whether the exported PDF is georeferenced as a GeoPDF, so that GIS software such as
	 * QGIS or Avenza Maps can place it on the map. default is true.
	 * It is skipped when the map is pitched, has terrain, or uses the globe projection.
	 */
	geoPdf?: boolean;
}
