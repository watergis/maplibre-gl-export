import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import { Format, type FormatType } from '../../interfaces';
import { BaseFormat, type FormatOptions } from './base';
import { GeoTiffFormat } from './geotiff';
import { JpegFormat } from './jpeg';
import { PdfFormat } from './pdf';
import { PngFormat } from './png';
import { SvgFormat } from './svg';
import { WebpFormat } from './webp';

export * from './base';
export * from './png';
export * from './jpeg';
export * from './webp';
export * from './svg';
export * from './pdf';
export * from './geotiff';

type FormatClass = new (map: MaplibreMap | MapboxMap, options: FormatOptions) => BaseFormat;

const formatClasses: Record<FormatType, FormatClass> = {
	[Format.PNG]: PngFormat,
	[Format.JPEG]: JpegFormat,
	[Format.WEBP]: WebpFormat,
	[Format.PDF]: PdfFormat,
	[Format.SVG]: SvgFormat,
	[Format.GEOTIFF]: GeoTiffFormat
};

/**
 * Create the class which exports the map as a file of the format.
 * @param format file format
 * @param map hidden Map object which has finished rendering
 * @param options settings of the generator
 */
export function createFormat(
	format: FormatType,
	map: MaplibreMap | MapboxMap,
	options: FormatOptions
): BaseFormat {
	const FormatClass = formatClasses[format];
	if (!FormatClass) throw new Error(`Invalid file format: ${format}`);
	return new FormatClass(map, options);
}
