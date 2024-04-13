import { type ControlOptions as MaplibreControlOptions } from '@watergis/maplibre-gl-export';

export interface ControlOptions extends MaplibreControlOptions {
	accessToken?: string;
}
