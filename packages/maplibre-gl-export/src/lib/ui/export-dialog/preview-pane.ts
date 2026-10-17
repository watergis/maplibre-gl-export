import { Move } from 'lucide';
import type { Translation } from '../../interfaces';
import { cls, createButton, createIncrementDecrementButton, el } from '../components';

/** Wait after the last change before the preview is rendered again, so quick changes add up */
const RENDER_DELAY_MS = 300;

/** The preview is rendered again when the frame grows by more than this ratio */
const RESIZE_RENDER_RATIO = 1.25;

/** Lowest DPI the preview is rendered at, so that it never becomes unreadable */
const MIN_PREVIEW_DPI = 20;

/** Smallest zoom of the preview image (50%) */
export const PREVIEW_ZOOM_MIN = 0.5;

/** Largest zoom of the preview image (300%) */
export const PREVIEW_ZOOM_MAX = 3;

/** Zoom added or removed by the zoom buttons of the preview (10%) */
export const PREVIEW_ZOOM_STEP = 0.1;

/** Part of the page, in CSS pixels, which stays inside the preview pane when it is dragged */
const PREVIEW_PAN_MARGIN = 40;

/**
 * DPI at which the preview is rendered so that its pixels match the frame it is shown in.
 *
 * The page is laid out at 96 DPI whatever DPI is chosen, so the preview rendered at this DPI is
 * the exported image with fewer pixels. It never exceeds the DPI of the export.
 * @param pageWidth width of the page in mm
 * @param frameWidth width of the preview in CSS pixels
 * @param pixelRatio device pixel ratio of the screen
 * @param maxDpi DPI of the export
 */
export const getPreviewDpi = (
	pageWidth: number,
	frameWidth: number,
	pixelRatio: number,
	maxDpi: number
) => {
	// pixels of the preview per inch of the page
	const dpi = (25.4 * frameWidth * pixelRatio) / pageWidth;
	return Math.min(Math.max(dpi, MIN_PREVIEW_DPI), maxDpi);
};

/**
 * Zoom of the preview after one click on the zoom in (`1`) or zoom out (`-1`) button.
 * It is rounded to the step so that floating point errors do not add up.
 */
export const stepPreviewZoom = (zoom: number, direction: 1 | -1) => {
	const steps = Math.round(zoom / PREVIEW_ZOOM_STEP) + direction;
	const next = Math.round(steps * PREVIEW_ZOOM_STEP * 100) / 100;
	return Math.min(Math.max(next, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX);
};

/**
 * Keep the dragged preview image partly inside the preview pane.
 * The page is centered in the frame and scaled around its center, so the offset may go up to
 * half of the scaled page plus half of the frame, minus the margin kept visible.
 * @param pan offset of the page from the center of the frame, in CSS pixels
 * @param pageSize `[width, height]` of the page before it is scaled, in CSS pixels
 * @param frameSize `[width, height]` of the frame, in CSS pixels
 * @param zoom zoom of the preview
 */
export const clampPreviewPan = (
	pan: { x: number; y: number },
	pageSize: [number, number],
	frameSize: [number, number],
	zoom: number
) => {
	const clamp = (value: number, page: number, frame: number) => {
		const max = Math.max((page * zoom + frame) / 2 - PREVIEW_PAN_MARGIN, 0);
		return Math.min(Math.max(value, -max), max);
	};
	return {
		x: clamp(pan.x, pageSize[0], frameSize[0]),
		y: clamp(pan.y, pageSize[1], frameSize[1])
	};
};

export interface PreviewPaneOptions {
	/** CSS class prefix of the underlying library */
	prefix: string;
	translation: Translation;
	/** `[width, height]` of the page in mm */
	pageSize: [number, number];
	/**
	 * Render the image of the preview for a page of `pageSize` at `dpi`. The settings must be
	 * read before anything is awaited, so that the image matches the settings it was asked for.
	 */
	render: (pageSize: [number, number], dpi: number) => Promise<HTMLCanvasElement>;
	/** DPI of the export, which the preview never exceeds */
	getMaxDpi: () => number;
	/** called when the user clicks the adjust area button */
	onAdjustArea: () => void;
}

/**
 * Left column of the export dialog: the preview image of the page, the zoom buttons above it and
 * the adjust area button below it.
 *
 * The preview is the exported image itself, rendered by the same generator at a lower DPI (the
 * page is laid out at 96 DPI whatever DPI is chosen, so only the number of pixels differs).
 */
export default class PreviewPane {
	public readonly element: HTMLDivElement;

	private options: PreviewPaneOptions;

	/** pane which the page is fitted into */
	private frame: HTMLDivElement;

	/** the page: it has the ratio of the page and holds the preview image */
	private page: HTMLDivElement;

	/** rendered preview image */
	private previewCanvas: HTMLCanvasElement | undefined;

	private previewError!: HTMLElement;

	private adjustButton: HTMLButtonElement;

	private zoomControl: ReturnType<typeof createIncrementDecrementButton>;

	private resizeObserver: ResizeObserver | undefined;

	/** `[width, height]` of the page in mm */
	private pageSize: [number, number];

	/** width of the frame the preview canvas was rendered for */
	private rendered: { width: number } | undefined;

	/** timer of the pending render, see {@link requestRender} */
	private renderTimer: ReturnType<typeof setTimeout> | undefined;

	/** running render loop. Only one map is rendered at a time */
	private renderLoop: Promise<void> | undefined;

	/** set when the preview has to be rendered again once the running render has finished */
	private renderDirty = false;

	private destroyed = false;

	/** zoom of the preview image, changed with the zoom buttons above the preview */
	private previewZoom = 1;

	/** offset of the preview image from the center of the frame, changed by dragging it */
	private previewPan = { x: 0, y: 0 };

	/** pointer dragging the preview image, with the offset and pointer position when it started */
	private drag: { pointerId: number; x: number; y: number; panX: number; panY: number } | undefined;

	constructor(options: PreviewPaneOptions) {
		this.options = options;
		this.pageSize = [...options.pageSize];
		const t = options.translation;

		this.element = el('div', this.cls('dialog__preview'));
		this.frame = el('div', this.cls('dialog__frame'));
		this.page = this.createPage();
		this.frame.appendChild(this.page);
		this.updateFrameRatio();
		this.setupPreviewDrag();

		this.zoomControl = createIncrementDecrementButton({
			prefix: options.prefix,
			labels: { decrement: t.ZoomOut, reset: t.ResetZoom, increment: t.ZoomIn },
			onDecrement: () => this.setPreviewZoom(stepPreviewZoom(this.previewZoom, -1)),
			onReset: () => {
				this.previewPan = { x: 0, y: 0 };
				this.setPreviewZoom(1);
			},
			onIncrement: () => this.setPreviewZoom(stepPreviewZoom(this.previewZoom, 1))
		});
		this.syncPreviewZoom();

		this.adjustButton = createButton({
			prefix: options.prefix,
			variant: 'secondary',
			className: 'adjust-area',
			icon: Move,
			iconName: 'adjustArea',
			label: t.AdjustArea,
			title: t.PreviewHint,
			onClick: () => options.onAdjustArea()
		});

		// zoom buttons above the preview, adjust area button below it
		this.element.append(this.zoomControl.element, this.frame, this.adjustButton);
	}

	/** Watch the size of the page and render the preview. The element must be in the document */
	public start() {
		this.resizeObserver = new ResizeObserver(() => this.onFrameResize());
		this.resizeObserver.observe(this.page);
		this.requestRender(0);
	}

	/** The page size or orientation changed: reshape the page and render it again */
	public setPageSize(size: [number, number]) {
		this.pageSize = [...size];
		this.updateFrameRatio();
		// the page changed shape: show it centered again
		this.previewPan = { x: 0, y: 0 };
		this.syncPreviewZoom();
		this.requestRender();
	}

	/**
	 * Render the preview after {@link RENDER_DELAY_MS}, restarting the delay on every call so that
	 * several clicks lead to a single render.
	 */
	public requestRender(delay = RENDER_DELAY_MS) {
		if (this.destroyed) return;
		clearTimeout(this.renderTimer);
		this.setLoading(true);
		this.renderTimer = setTimeout(() => {
			this.renderTimer = undefined;
			this.runRenderLoop();
		}, delay);
	}

	/**
	 * Cancel the pending preview render and wait for the running one, before something else
	 * renders the map: the generator changes `window.devicePixelRatio` while it renders.
	 * @returns whether a render was pending, see {@link resume}
	 */
	public async pause() {
		const pending = this.renderTimer !== undefined;
		clearTimeout(this.renderTimer);
		this.renderTimer = undefined;
		await this.renderLoop;
		return pending;
	}

	/** Render the preview again if it is out of date, after {@link pause} */
	public resume(render: boolean) {
		if (render) this.requestRender(0);
		else this.setLoading(false);
	}

	/** Disable the adjust area button, while the map is being exported */
	public setDisabled(disabled: boolean) {
		this.adjustButton.disabled = disabled;
	}

	public focusAdjustButton() {
		this.adjustButton.focus();
	}

	/** Stop rendering. Nothing is rendered anymore once it has been called */
	public destroy() {
		this.destroyed = true;
		clearTimeout(this.renderTimer);
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
	}

	private cls(name: string) {
		return cls(this.options.prefix, name);
	}

	/** The page holding the preview image */
	private createPage() {
		const t = this.options.translation;
		const page = el('div', this.cls('dialog__page'));
		page.setAttribute('role', 'img');
		page.setAttribute('aria-label', t.PreviewHint);

		const loading = el('div', this.cls('dialog__loading'));
		loading.appendChild(el('span', this.cls('spinner')));

		this.previewError = el('p', this.cls('dialog__preview-error'), t.PreviewFailed);
		this.previewError.hidden = true;

		page.append(loading, this.previewError);
		return page;
	}

	private updateFrameRatio() {
		this.frame.style.setProperty(
			'--gl-export-page-ratio',
			String(this.pageSize[0] / this.pageSize[1])
		);
	}

	private setPreviewZoom(zoom: number) {
		this.previewZoom = Math.min(Math.max(zoom, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX);
		this.syncPreviewZoom();
		// the image may need more pixels to stay sharp
		this.onFrameResize();
	}

	/** Apply the zoom and offset of the preview image and update the zoom buttons */
	private syncPreviewZoom() {
		// the whole page is visible up to 100%, so it is only dragged when zoomed in
		if (this.previewZoom <= 1) this.previewPan = { x: 0, y: 0 };
		this.previewPan = clampPreviewPan(
			this.previewPan,
			[this.page.offsetWidth, this.page.offsetHeight],
			[this.frame.clientWidth, this.frame.clientHeight],
			this.previewZoom
		);
		const { x, y } = this.previewPan;
		this.page.style.transform =
			x === 0 && y === 0 && this.previewZoom === 1
				? ''
				: `translate(${x}px, ${y}px) scale(${this.previewZoom})`;
		// touch drags scroll the dialog on mobile until the preview is zoomed in
		this.frame.classList.toggle(this.cls('dialog__frame--zoomed'), this.previewZoom > 1);
		this.zoomControl.update(
			`${Math.round(this.previewZoom * 100)}%`,
			this.previewZoom > PREVIEW_ZOOM_MIN,
			this.previewZoom < PREVIEW_ZOOM_MAX
		);
	}

	/** Let the user move the preview image by dragging it */
	private setupPreviewDrag() {
		const frame = this.frame;
		frame.addEventListener('pointerdown', (event) => {
			if (event.button !== 0 || this.drag || this.previewZoom <= 1) return;
			this.drag = {
				pointerId: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				panX: this.previewPan.x,
				panY: this.previewPan.y
			};
			frame.setPointerCapture(event.pointerId);
			frame.classList.add(this.cls('dialog__frame--dragging'));
			event.preventDefault();
		});
		frame.addEventListener('pointermove', (event) => {
			if (!this.drag || event.pointerId !== this.drag.pointerId) return;
			this.previewPan = {
				x: this.drag.panX + event.clientX - this.drag.x,
				y: this.drag.panY + event.clientY - this.drag.y
			};
			this.syncPreviewZoom();
		});
		const endDrag = (event: PointerEvent) => {
			if (!this.drag || event.pointerId !== this.drag.pointerId) return;
			this.drag = undefined;
			frame.classList.remove(this.cls('dialog__frame--dragging'));
		};
		frame.addEventListener('pointerup', endDrag);
		frame.addEventListener('pointercancel', endDrag);
	}

	/** Width in CSS pixels the preview image is shown at, including the zoom of the preview */
	private get previewWidth() {
		return this.page.clientWidth * this.previewZoom;
	}

	/**
	 * Render the preview again when the frame grew, or the preview was zoomed in, enough for the
	 * image to look blurry
	 */
	private onFrameResize() {
		const width = this.previewWidth;
		if (!this.rendered || width > this.rendered.width * RESIZE_RENDER_RATIO) {
			this.requestRender();
		}
	}

	/**
	 * Render until the preview shows the latest settings. Only one map is rendered at a time,
	 * because the generator changes `window.devicePixelRatio` while it renders.
	 */
	private runRenderLoop() {
		if (this.renderLoop) {
			this.renderDirty = true;
			return this.renderLoop;
		}
		this.renderLoop = (async () => {
			do {
				this.renderDirty = false;
				await this.renderPreview();
			} while (this.renderDirty && !this.destroyed);
		})().finally(() => {
			this.renderLoop = undefined;
			if (!this.renderTimer) this.setLoading(false);
		});
		return this.renderLoop;
	}

	private async renderPreview() {
		const width = this.previewWidth;
		if (this.destroyed || width <= 0) return;
		const pageSize: [number, number] = [...this.pageSize];
		const dpi = getPreviewDpi(
			pageSize[0],
			width,
			window.devicePixelRatio || 1,
			this.options.getMaxDpi()
		);
		let canvas: HTMLCanvasElement;
		try {
			canvas = await this.options.render(pageSize, dpi);
		} catch (err) {
			console.error('Failed to render the preview:', err);
			if (!this.destroyed) this.previewError.hidden = false;
			return;
		}
		if (this.destroyed) return;
		this.previewError.hidden = true;
		canvas.className = this.cls('dialog__canvas');
		canvas.setAttribute('aria-hidden', 'true');
		if (this.previewCanvas) {
			this.previewCanvas.replaceWith(canvas);
		} else {
			this.page.prepend(canvas);
		}
		this.previewCanvas = canvas;
		this.rendered = { width };
	}

	private setLoading(loading: boolean) {
		this.page.classList.toggle(this.cls('dialog__page--loading'), loading);
	}
}
