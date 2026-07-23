import type { AttributionControlOptions, ControlPosition } from 'maplibre-gl';

/**
 * Attribution options. It extends maplibre's `AttributionControlOptions`
 * (`compact` and `customAttribution`) which are passed to the AttributionControl
 * added to the hidden map. The control element is then rasterized and drawn on the
 * exported canvas, so the attribution keeps maplibre's native styling.
 */
export interface AttributionOptions extends AttributionControlOptions {
	visibility?: 'visible' | 'none';
	position?: ControlPosition;
	/** Distance between the attribution and the edge of the map area at 96 DPI */
	margin?: number;
}
