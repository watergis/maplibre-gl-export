import { Format } from '../../interfaces';
import { BaseFormat } from './base';

/** PNG image of the composed canvas */
export class PngFormat extends BaseFormat {
	readonly extension = Format.PNG;

	protected readonly name = 'PNG';

	toBlob() {
		return this.canvasToBlob('image/png');
	}
}
