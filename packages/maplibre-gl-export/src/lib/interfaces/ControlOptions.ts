import type { ControlPosition } from 'maplibre-gl';
import { CirclePaint } from 'mapbox-gl';
import { FormatType } from './Format';
import { Language } from './Language';
import { PageOrientationType } from './PageOrientation';
import { AllowedSize, SizeType } from './Size';
import { AttributionOptions } from './AttributionStyle';
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

export interface ControlOptions {
	PageSize?: SizeType;
	PageOrientation?: PageOrientationType;
	Format?: FormatType;
	DPI?: number;
	Crosshair?: boolean;
	PrintableArea?: boolean;
	Local?: Language;
	/**
	 * List of page sizes offered in the export panel. An entry is either the name of one of
	 * the presets (`'A4'`, `'LETTER'`, ...) or a developer-defined `{ name, size }` pair such
	 * as `{ name: '16:9', size: [320, 180] }`.
	 */
	AllowedSizes?: AllowedSize[];
	Filename?: string;
	markerCirclePaint?: CirclePaint;
	attributionOptions?: AttributionOptions;
	scalebarOptions?: ScalebarOptions;
	northIconOptions?: NorthIconOptions;
}
