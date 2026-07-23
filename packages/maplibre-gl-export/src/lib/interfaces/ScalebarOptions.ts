import type { ControlPosition, ScaleControlOptions } from 'maplibre-gl';

/**
 * Scale bar options. It extends maplibre's `ScaleControlOptions` (`maxWidth` and `unit`)
 * which are passed to the ScaleControl added to the hidden map. The rendered control
 * element is then rasterized and drawn on the exported canvas.
 *
 * Note: `unit` here is the distance unit of the scale bar
 * (`'metric'` / `'imperial'` / `'nautical'`), which is unrelated to the
 * page length unit {@link Unit} (`mm` / `in`) used for the export layout.
 */
export interface ScalebarOptions extends ScaleControlOptions {
	visibility?: 'visible' | 'none';
	position?: ControlPosition;
	/** Distance between the scale bar and the edge of the map area at 96 DPI */
	margin?: number;
}
