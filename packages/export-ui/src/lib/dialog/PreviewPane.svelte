<!--
	Left column of the export dialog: the preview image of the page, the zoom buttons above it and
	the adjust area button below it.

	The preview is the exported image itself, rendered by the `render` callback at a lower DPI (the
	page is laid out at 96 DPI whatever DPI is chosen, so only the number of pixels differs).
-->
<script lang="ts">
	import { Move } from '@lucide/svelte';
	import { onDestroy, untrack } from 'svelte';
	import Button from '../components/Button.svelte';
	import IncrementDecrementButton from '../components/IncrementDecrementButton.svelte';
	import Spinner from '../components/Spinner.svelte';
	import type { Translation } from '../interfaces';
	import {
		clampPreviewPan,
		getPreviewDpi,
		PREVIEW_ZOOM_MAX,
		PREVIEW_ZOOM_MIN,
		RENDER_DELAY_MS,
		RESIZE_RENDER_RATIO,
		stepPreviewZoom
	} from '../utils/preview';

	interface Props {
		translation: Translation;
		/** `[width, height]` of the page in mm when the pane is created, see {@link setPageSize} */
		pageSize: [number, number];
		/**
		 * Render the image of the preview for a page of `pageSize` at `dpi`. The settings must be
		 * read before anything is awaited, so that the image matches the settings it was asked for.
		 */
		render: (pageSize: [number, number], dpi: number) => Promise<HTMLCanvasElement>;
		/** DPI of the export, which the preview never exceeds */
		getMaxDpi: () => number;
		/** disable the adjust area button, while the map is being exported */
		disabled?: boolean;
		/** called when the user clicks the adjust area button */
		onadjustarea: () => void;
	}

	let {
		translation: t,
		pageSize: initialPageSize,
		render,
		getMaxDpi,
		disabled = false,
		onadjustarea
	}: Props = $props();

	/** `[width, height]` of the page in mm */
	let pageSize = $state<[number, number]>(untrack(() => [...initialPageSize]));

	/** pane which the page is fitted into */
	let frame: HTMLDivElement;

	/** the page: it has the ratio of the page and holds the preview image */
	let page: HTMLDivElement;

	let adjustButton = $state<HTMLButtonElement>();

	/** rendered preview image */
	let previewCanvas = $state.raw<HTMLCanvasElement>();

	let previewFailed = $state(false);

	let loading = $state(false);

	let resizeObserver: ResizeObserver | undefined;

	/** width of the frame the preview canvas was rendered for */
	let rendered: { width: number } | undefined;

	/** timer of the pending render, see {@link requestRender} */
	let renderTimer: ReturnType<typeof setTimeout> | undefined;

	/** running render loop. Only one map is rendered at a time */
	let renderLoop: Promise<void> | undefined;

	/** set when the preview has to be rendered again once the running render has finished */
	let renderDirty = false;

	let destroyed = false;

	/** zoom of the preview image, changed with the zoom buttons above the preview */
	let previewZoom = $state(1);

	/** offset of the preview image from the center of the frame, changed by dragging it */
	let previewPan = $state({ x: 0, y: 0 });

	/** pointer dragging the preview image, with the offset and pointer position when it started */
	let drag = $state<{ pointerId: number; x: number; y: number; panX: number; panY: number }>();

	const transform = $derived(
		previewPan.x === 0 && previewPan.y === 0 && previewZoom === 1
			? ''
			: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`
	);

	/** Watch the size of the page and render the preview. The element must be in the document */
	export const start = () => {
		resizeObserver = new ResizeObserver(() => onFrameResize());
		resizeObserver.observe(page);
		requestRender(0);
	};

	/** The page size or orientation changed: reshape the page and render it again */
	export const setPageSize = (size: [number, number]) => {
		pageSize = [...size];
		// the page changed shape: show it centered again
		previewPan = { x: 0, y: 0 };
		syncPreviewPan();
		requestRender();
	};

	/**
	 * Render the preview after {@link RENDER_DELAY_MS}, restarting the delay on every call so that
	 * several clicks lead to a single render.
	 */
	export const requestRender = (delay = RENDER_DELAY_MS) => {
		if (destroyed) return;
		clearTimeout(renderTimer);
		loading = true;
		renderTimer = setTimeout(() => {
			renderTimer = undefined;
			runRenderLoop();
		}, delay);
	};

	/**
	 * Cancel the pending preview render and wait for the running one, before something else
	 * renders the map: the generator changes `window.devicePixelRatio` while it renders.
	 * @returns whether a render was pending, see {@link resume}
	 */
	export const pause = async () => {
		const pending = renderTimer !== undefined;
		clearTimeout(renderTimer);
		renderTimer = undefined;
		await renderLoop;
		return pending;
	};

	/** Render the preview again if it is out of date, after {@link pause} */
	export const resume = (render: boolean) => {
		if (render) requestRender(0);
		else loading = false;
	};

	export const focusAdjustButton = () => adjustButton?.focus();

	onDestroy(() => {
		destroyed = true;
		clearTimeout(renderTimer);
		resizeObserver?.disconnect();
		resizeObserver = undefined;
	});

	const setPreviewZoom = (zoom: number) => {
		previewZoom = Math.min(Math.max(zoom, PREVIEW_ZOOM_MIN), PREVIEW_ZOOM_MAX);
		syncPreviewPan();
		// the image may need more pixels to stay sharp
		onFrameResize();
	};

	/** Keep the offset of the preview image inside the frame */
	const syncPreviewPan = () => {
		// the whole page is visible up to 100%, so it is only dragged when zoomed in
		if (previewZoom <= 1) previewPan = { x: 0, y: 0 };
		previewPan = clampPreviewPan(
			previewPan,
			[page.offsetWidth, page.offsetHeight],
			[frame.clientWidth, frame.clientHeight],
			previewZoom
		);
	};

	/** Let the user move the preview image by dragging it */
	const onPointerDown = (event: PointerEvent) => {
		if (event.button !== 0 || drag || previewZoom <= 1) return;
		drag = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			panX: previewPan.x,
			panY: previewPan.y
		};
		frame.setPointerCapture(event.pointerId);
		event.preventDefault();
	};

	const onPointerMove = (event: PointerEvent) => {
		if (!drag || event.pointerId !== drag.pointerId) return;
		previewPan = {
			x: drag.panX + event.clientX - drag.x,
			y: drag.panY + event.clientY - drag.y
		};
		syncPreviewPan();
	};

	const endDrag = (event: PointerEvent) => {
		if (!drag || event.pointerId !== drag.pointerId) return;
		drag = undefined;
	};

	/** Width in CSS pixels the preview image is shown at, including the zoom of the preview */
	const getPreviewWidth = () => page.clientWidth * previewZoom;

	/**
	 * Render the preview again when the frame grew, or the preview was zoomed in, enough for the
	 * image to look blurry
	 */
	const onFrameResize = () => {
		const width = getPreviewWidth();
		if (!rendered || width > rendered.width * RESIZE_RENDER_RATIO) {
			requestRender();
		}
	};

	/**
	 * Render until the preview shows the latest settings. Only one map is rendered at a time,
	 * because the generator changes `window.devicePixelRatio` while it renders.
	 */
	const runRenderLoop = () => {
		if (renderLoop) {
			renderDirty = true;
			return renderLoop;
		}
		renderLoop = (async () => {
			do {
				renderDirty = false;
				await renderPreview();
			} while (renderDirty && !destroyed);
		})().finally(() => {
			renderLoop = undefined;
			if (!renderTimer) loading = false;
		});
		return renderLoop;
	};

	const renderPreview = async () => {
		const width = getPreviewWidth();
		if (destroyed || width <= 0) return;
		const size: [number, number] = [...pageSize];
		const dpi = getPreviewDpi(size[0], width, window.devicePixelRatio || 1, getMaxDpi());
		let canvas: HTMLCanvasElement;
		try {
			canvas = await render(size, dpi);
		} catch (err) {
			console.error('Failed to render the preview:', err);
			if (!destroyed) previewFailed = true;
			return;
		}
		if (destroyed) return;
		previewFailed = false;
		canvas.className = 'gl-export-dialog__canvas';
		canvas.setAttribute('aria-hidden', 'true');
		previewCanvas = canvas;
		rendered = { width };
	};

	/** Show the rendered canvas at the start of the page, replacing the previous one */
	const showCanvas = (node: HTMLElement) => {
		const canvas = previewCanvas;
		if (!canvas) return;
		node.prepend(canvas);
		return () => canvas.remove();
	};
</script>

<div class="gl-export-dialog__preview">
	<!-- zoom buttons above the preview -->
	<IncrementDecrementButton
		labels={{ decrement: t.ZoomOut, reset: t.ResetZoom, increment: t.ZoomIn }}
		text="{Math.round(previewZoom * 100)}%"
		canDecrement={previewZoom > PREVIEW_ZOOM_MIN}
		canIncrement={previewZoom < PREVIEW_ZOOM_MAX}
		ondecrement={() => setPreviewZoom(stepPreviewZoom(previewZoom, -1))}
		onreset={() => {
			previewPan = { x: 0, y: 0 };
			setPreviewZoom(1);
		}}
		onincrement={() => setPreviewZoom(stepPreviewZoom(previewZoom, 1))}
	/>
	<!-- the preview image is dragged with the pointer, the keyboard uses the zoom buttons -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={frame}
		class={[
			'gl-export-dialog__frame',
			// touch drags scroll the dialog on mobile until the preview is zoomed in
			previewZoom > 1 && 'gl-export-dialog__frame--zoomed',
			drag && 'gl-export-dialog__frame--dragging'
		]}
		style:--gl-export-page-ratio={pageSize[0] / pageSize[1]}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		<!-- the rendered canvas is inserted before the loading overlay -->
		<div
			bind:this={page}
			{@attach showCanvas}
			class={['gl-export-dialog__page', loading && 'gl-export-dialog__page--loading']}
			style:transform
			role="img"
			aria-label={t.PreviewHint}
		>
			{#if loading}
				<div class="gl-export-dialog__loading">
					<Spinner />
				</div>
			{/if}
			<p class="gl-export-dialog__preview-error" hidden={!previewFailed}>{t.PreviewFailed}</p>
		</div>
	</div>
	<!-- adjust area button below the preview -->
	<Button
		bind:element={adjustButton}
		variant="secondary"
		className="adjust-area"
		icon={Move}
		iconName="adjustArea"
		label={t.AdjustArea}
		title={t.PreviewHint}
		{disabled}
		onclick={onadjustarea}
	/>
</div>

<style>
	.gl-export-dialog__preview {
		display: flex;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-width: 0;
		padding: var(--gl-export-gap);
		background: var(--gl-export-preview-background);
	}

	/* zoom buttons above the preview and adjust area button below it, both centered */
	.gl-export-dialog__preview :global(.gl-export-zoom),
	.gl-export-dialog__preview :global(.gl-export-adjust-area) {
		flex: none;
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-export-shadow-color) 12%, transparent);
	}

	/*
	 * The frame keeps the ratio of the page and is as large as the preview pane allows.
	 * `--gl-export-page-ratio` (width / height) is set from the page size.
	 */
	.gl-export-dialog__frame {
		position: relative;
		flex: 1;
		width: 100%;
		min-height: 0;
		container-type: size;
		display: flex;
		align-items: center;
		justify-content: center;
		/* the preview image is zoomed and dragged inside the frame */
		overflow: hidden;
		user-select: none;
	}

	/* zoomed in above 100%: the preview image can be dragged */
	.gl-export-dialog__frame--zoomed {
		cursor: grab;
		touch-action: none;
	}

	.gl-export-dialog__frame--dragging {
		cursor: grabbing;
	}

	.gl-export-dialog__page {
		position: relative;
		width: min(100cqw, 100cqh * var(--gl-export-page-ratio, 1.414));
		aspect-ratio: var(--gl-export-page-ratio, 1.414);
		flex: none;
		overflow: hidden;
		/* zoom and offset of the preview image */
		transform-origin: center;
		background: var(--gl-export-background);
		box-shadow:
			0 0 0 1px var(--gl-export-border),
			0 6px 20px color-mix(in oklch, var(--gl-export-shadow-color) 18%, transparent);
	}

	/* the rendered export image, inserted by the script */
	.gl-export-dialog__page :global(.gl-export-dialog__canvas) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* shown while the preview is rendered */
	.gl-export-dialog__loading {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in oklch, var(--gl-export-background) 35%, transparent);
		color: var(--gl-export-primary);
		pointer-events: none;
	}

	.gl-export-dialog__loading :global(.gl-export-spinner) {
		width: 28px;
		height: 28px;
		border-width: 3px;
	}

	.gl-export-dialog__preview-error {
		position: absolute;
		right: 12px;
		bottom: 12px;
		left: 12px;
		z-index: 2;
		margin: 0;
		padding: 8px 10px;
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-background);
		color: var(--gl-export-destructive);
		font-size: 13px;
		text-align: center;
	}

	.gl-export-dialog__preview-error[hidden] {
		display: none;
	}

	/* mobile: full screen, preview on top and settings below in one scrolling body */
	@media (max-width: 767px) {
		.gl-export-dialog__preview {
			flex: none;
			padding: 12px;
		}

		.gl-export-dialog__frame {
			flex: none;
			height: auto;
			container-type: inline-size;
		}

		.gl-export-dialog__page {
			width: min(100cqw, 55dvh * var(--gl-export-page-ratio, 1.414));
		}
	}
</style>
