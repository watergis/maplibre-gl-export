import { Format } from '../../interfaces';
import { createGeoTiff } from '../geotiff';
import { BaseFormat } from './base';

/** GeoTIFF of the composed canvas, placed on the map in EPSG:3857 */
export class GeoTiffFormat extends BaseFormat {
	readonly extension = Format.GEOTIFF;

	protected readonly name = 'GeoTIFF';

	async toBlob() {
		const { corners, author } = this.getExportInfo(true);
		const canvas = await this.getCanvas();
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get 2D context for the export canvas');
		const { lng, lat } = this.map.getCenter();
		return createGeoTiff(
			{
				width: canvas.width,
				height: canvas.height,
				read: (y, rows) => ctx.getImageData(0, y, canvas.width, rows).data
			},
			{
				corners,
				dpi: this.options.dpi,
				description: `${this.map.getStyle().name ?? 'map'}, center: [${lng}, ${lat}], zoom: ${this.map.getZoom()}`,
				software: this.creatorName,
				artist: author
			}
		);
	}
}
