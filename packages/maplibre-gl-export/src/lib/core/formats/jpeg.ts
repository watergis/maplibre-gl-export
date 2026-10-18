import { Format } from '../../interfaces';
import { BaseFormat } from './base';

/** JPEG image of the composed canvas */
export class JpegFormat extends BaseFormat {
	readonly extension = Format.JPEG;

	protected readonly name = 'JPEG';

	toBlob() {
		return this.canvasToBlob('image/jpeg', 0.85);
	}
}
