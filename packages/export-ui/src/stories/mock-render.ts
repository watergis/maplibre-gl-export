import type { Map } from 'maplibre-gl';
import type { ExportSettings } from '../lib';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Stand-in for the generator of maplibre-gl-export, which renders the real export: it draws the
 * canvas of the map on a page of the size and DPI of the preview, with a placeholder of the scale
 * bar and the north icon.
 */
export const mockRenderPreview =
	(map: Map, delay = 300) =>
	async (settings: ExportSettings, dpi: number) => {
		await wait(delay);
		const [width, height] = settings.size.map((mm) => Math.round((mm * dpi) / 25.4));
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext('2d')!;
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, width, height);

		// the center of the map, cropped to the ratio of the page
		const source = map.getCanvas();
		const scale = Math.min(source.width / width, source.height / height);
		const sw = width * scale;
		const sh = height * scale;
		context.drawImage(
			source,
			(source.width - sw) / 2,
			(source.height - sh) / 2,
			sw,
			sh,
			0,
			0,
			width,
			height
		);

		const unit = Math.max(width, height) / 60;
		context.fillStyle = '#1f2933';
		context.font = `${unit}px sans-serif`;
		if (settings.scalebar) {
			context.fillRect(unit, height - unit * 2, unit * 8, unit / 4);
			context.fillText('100 km', unit, height - unit * 2.5);
		}
		if (settings.northIcon) {
			const image = new Image();
			image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(settings.northIconImage)}`;
			await image.decode().catch(() => undefined);
			const size = width * settings.northIconSizeFraction;
			context.drawImage(image, width - size - unit, unit, size, size);
		}
		return canvas;
	};

/** Stand-in for the export: it waits, logs the settings and succeeds */
export const mockSave =
	(onSave: (settings: ExportSettings) => void, delay = 1000) =>
	async (settings: ExportSettings) => {
		await wait(delay);
		onSave(settings);
		return true;
	};
