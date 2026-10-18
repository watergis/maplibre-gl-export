import { toCanvas } from 'html-to-image';
import { MapElementOverlay, type OverlayLayout, type OverlayOptions } from './map-element-overlay';

/**
 * An overlay made from a control element of the hidden map, such as the scale control.
 * The native control element is rasterized as-is, so it keeps its own styling.
 */
export abstract class ControlElementOverlay<
	O extends OverlayOptions = OverlayOptions
> extends MapElementOverlay<O> {
	/**
	 * @param options settings of the overlay
	 * @param element control element of the hidden map. undefined when it is not shown.
	 * @param avoid overlay which is drawn before this one, see {@link MapElementOverlay}
	 */
	constructor(
		options: O,
		readonly element: HTMLElement | undefined,
		avoid?: MapElementOverlay
	) {
		super(options, avoid);
	}

	get visible() {
		return super.visible && !!this.element;
	}

	protected async drawOnCanvas(ctx: CanvasRenderingContext2D, layout: OverlayLayout) {
		if (!this.element) return;
		// `skipFonts` avoids html-to-image walking document.styleSheets to embed @font-face
		// rules, which throws a SecurityError on cross-origin stylesheets. Fonts already
		// loaded in the document still render during rasterization.
		const image = await toCanvas(this.element, {
			pixelRatio: layout.scale,
			skipFonts: true
		});
		if (image.width === 0 || image.height === 0) return;

		const { x, y } = this.place(layout, image.width, image.height);
		ctx.drawImage(image, x, y);
	}
}
