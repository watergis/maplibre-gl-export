import { el, type IdAllocator } from './svg';
import type { StyleImageLike } from './types';

export type EncodeImage = (data: Uint8ClampedArray, width: number, height: number) => string;

/** Encode RGBA pixels as a PNG data URL with a canvas */
export const encodeWithCanvas: EncodeImage = (data, width, height) => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get 2D context to encode an image');
	const imageData = ctx.createImageData(width, height);
	imageData.data.set(data);
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL('image/png');
};

/** Distance value of an SDF image at which the edge of the shape lies */
const SDF_EDGE = 0.75;

/** Width of the antialiased edge of an SDF image, as a share of the distance range */
const SDF_SMOOTHING = 0.06;

/**
 * Turn a signed distance field into a plain image in the given color, which is what the
 * map does in its shader when it draws an SDF icon.
 */
export function tintSdf(
	data: Uint8Array | Uint8ClampedArray,
	color: [number, number, number]
): Uint8ClampedArray {
	const result = new Uint8ClampedArray(data.length);
	for (let i = 0; i < data.length; i += 4) {
		const distance = data[i + 3] / 255;
		const alpha = (distance - SDF_EDGE) / SDF_SMOOTHING + 0.5;
		result[i] = color[0];
		result[i + 1] = color[1];
		result[i + 2] = color[2];
		result[i + 3] = Math.max(0, Math.min(1, alpha)) * 255;
	}
	return result;
}

/**
 * Name of the image an evaluated `*-pattern` or `icon-image` property refers to.
 * The value is a string, a resolved image or a pair of them which is cross-faded.
 */
export function imageName(value: unknown): string | undefined {
	if (typeof value === 'string') return value || undefined;
	if (!value || typeof value !== 'object') return undefined;
	const image = value as { name?: unknown; from?: unknown; to?: unknown };
	if (typeof image.name === 'string') return image.name || undefined;
	return imageName(image.from) ?? imageName(image.to);
}

export interface ImageDef {
	id: string;
	/** size of the image in CSS pixels */
	width: number;
	height: number;
}

/** Writes the images of the style into `<defs>`, once each */
export class ImageRegistry {
	private images = new Map<string, ImageDef | undefined>();

	private patterns = new Map<string, string | undefined>();

	constructor(
		private doc: Document,
		private defs: Element,
		private getImage: ((name: string) => StyleImageLike | undefined) | undefined,
		private id: IdAllocator,
		private encode: EncodeImage = encodeWithCanvas
	) {}

	/** whether the images of the style can be read at all */
	get available() {
		return this.getImage !== undefined;
	}

	/**
	 * Define an image and return how to reference it.
	 * @param tint color an SDF image is drawn in, as `#rrggbb`
	 */
	image(name: string, tint = '#000000'): ImageDef | undefined {
		const source = this.read(name);
		const key = source?.sdf ? `${name}\u0000${tint}` : name;
		if (this.images.has(key)) return this.images.get(key);

		let def: ImageDef | undefined;
		if (source) {
			const { width, height, data } = source.data;
			const ratio = source.pixelRatio || 1;
			const pixels = source.sdf
				? tintSdf(data, [
						parseInt(tint.slice(1, 3), 16) || 0,
						parseInt(tint.slice(3, 5), 16) || 0,
						parseInt(tint.slice(5, 7), 16) || 0
					])
				: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
			def = {
				id: this.id(`image-${this.images.size}-${name}`),
				width: width / ratio,
				height: height / ratio
			};
			this.defs.appendChild(
				el(this.doc, 'image', {
					id: def.id,
					width: def.width,
					height: def.height,
					href: this.encode(pixels, width, height)
				})
			);
		}
		this.images.set(key, def);
		return def;
	}

	/** Define a pattern which repeats an image and return its id */
	pattern(name: string): string | undefined {
		if (this.patterns.has(name)) return this.patterns.get(name);
		const image = this.image(name);
		let id: string | undefined;
		if (image) {
			id = this.id(`pattern-${this.patterns.size}-${name}`);
			this.defs.appendChild(
				el(
					this.doc,
					'pattern',
					{ id, width: image.width, height: image.height, patternUnits: 'userSpaceOnUse' },
					[el(this.doc, 'use', { href: `#${image.id}` })]
				)
			);
		}
		this.patterns.set(name, id);
		return id;
	}

	private read(name: string) {
		try {
			const image = this.getImage?.(name);
			return image?.data?.data ? image : undefined;
		} catch {
			return undefined;
		}
	}
}
