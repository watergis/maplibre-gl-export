import type { NorthIconOptions } from '../../interfaces';
import { createSvgNode, MapElementOverlay, type OverlayLayout } from './map-element-overlay';

/** North icon drawn from its SVG source, rotated to match the map bearing */
export class NorthIconOverlay extends MapElementOverlay<NorthIconOptions> {
	protected readonly name = 'north icon';

	protected readonly defaultPosition = 'top-right';

	/**
	 * @param options settings of the north icon
	 * @param bearing bearing of the rendered map in degrees
	 */
	constructor(
		options: NorthIconOptions,
		private bearing: number
	) {
		super(options);
	}

	get visible() {
		return super.visible && !!this.options.image;
	}

	/** Size of the icon, which is a fraction of the page width */
	private size(layout: OverlayLayout) {
		return layout.width * (this.options.imageSizeFraction ?? 0.05);
	}

	protected async drawOnCanvas(ctx: CanvasRenderingContext2D, layout: OverlayLayout) {
		const source = this.options.image;
		if (!source) return;
		const size = this.size(layout);
		const image = await new Promise<HTMLImageElement>((resolve, reject) => {
			const img = new Image(size, size);
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error('Failed to load the north icon image'));
			img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
		});

		const { x, y } = this.place(layout, size, size);
		ctx.save();
		ctx.translate(x + size / 2, y + size / 2);
		// the map is rotated clockwise by `bearing`, so north sits counter-clockwise by the same angle
		ctx.rotate((-this.bearing * Math.PI) / 180);
		ctx.drawImage(image, -size / 2, -size / 2, size, size);
		ctx.restore();
	}

	/** @returns undefined when the source is not a valid SVG */
	protected createElement(layout: OverlayLayout) {
		const source = this.options.image;
		if (!source) return undefined;
		const icon = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
		if (icon.nodeName.toLowerCase() !== 'svg') return undefined;

		const size = this.size(layout);
		const box = this.place(layout, size, size);
		const imported = document.importNode(icon, true);
		imported.setAttribute('x', String(box.x));
		imported.setAttribute('y', String(box.y));
		imported.setAttribute('width', String(box.width));
		imported.setAttribute('height', String(box.height));

		const group = createSvgNode('g', {
			'data-overlay': 'north-icon',
			// the map is rotated clockwise by `bearing`, so north sits counter-clockwise by the same angle
			transform: `rotate(${-this.bearing} ${box.x + box.width / 2} ${box.y + box.height / 2})`
		});
		group.appendChild(imported);
		return group as SVGGElement;
	}
}
