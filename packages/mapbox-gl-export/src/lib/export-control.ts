import { IControl, Map as MapboxMap } from 'mapbox-gl';
import {
	MaplibreExportControl,
	type ControlOptions as MaplibreControlOptions,
	type MapGeneratorBase,
	type MapGeneratorConfig
} from '@watergis/maplibre-gl-export';
import { ControlOptions } from './interfaces';
import MapGenerator from './map-generator';

/**
 * Mapbox GL Export Control.
 *
 * It adds a print button to the map, which opens a dialog with a preview of the page and the
 * export settings. Both the preview and the export are rendered by the Mapbox generator.
 */
// eslint-disable-next-line
// @ts-ignore
export default class MapboxExportControl extends MaplibreExportControl implements IControl {
	private accessToken: string | undefined;

	constructor(options: ControlOptions) {
		super(options as MaplibreControlOptions);
		this.MAPLIB_CSS_PREFIX = 'mapboxgl';
		this.accessToken = options.accessToken;
	}

	// eslint-disable-next-line
	// @ts-ignore
	protected createGenerator(map: MapboxMap, config: MapGeneratorConfig): MapGeneratorBase {
		return new MapGenerator(map, { ...config, accessToken: this.accessToken });
	}
}
