import { Format } from '../../interfaces';
import { BaseFormat } from './base';

/**
 * WebP image of the composed canvas. Browsers which cannot encode WebP, such as Safari,
 * return a PNG instead, which is warned about in the console.
 */
export class WebpFormat extends BaseFormat {
	readonly extension = Format.WEBP;

	protected readonly name = 'WebP';

	async toBlob() {
		const blob = await this.canvasToBlob('image/webp', 0.9);
		if (blob.type !== 'image/webp') {
			console.warn(`This browser cannot encode WebP, the map is exported as ${blob.type} instead`);
		}
		return blob;
	}
}
