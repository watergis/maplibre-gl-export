import { IControl, Map as MapboxMap } from 'mapbox-gl';
import {
	SizeType,
	DPIType,
	FormatType,
	MaplibreExportControl,
	UnitType,
	ControlOptions as MaplibreControlOptions
} from '@watergis/maplibre-gl-export';
import { ControlOptions } from './interfaces';
import MapGenerator from './map-generator';

/**
 * Mapbox GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MapboxExportControl extends MaplibreExportControl implements IControl {
	private accessToken: string | undefined;

	constructor(options: ControlOptions) {
		super(options as MaplibreControlOptions);
		this.MAPLIB_CSS_PREFIX = 'mapboxgl';
		this.accessToken = options.accessToken;
	}

	protected generateMap(
		map: MapboxMap,
		size: SizeType,
		dpi: DPIType,
		format: FormatType,
		unit: UnitType,
		filename?: string
	) {
		const mapGenerator = new MapGenerator(
			map as MapboxMap,
			size,
			dpi,
			format,
			unit,
			filename,
			this.options.markerCirclePaint,
			this.options.attributionOptions,
			this.options.northIconOptions,
			this.accessToken
		);
		mapGenerator.generate();
	}
}
