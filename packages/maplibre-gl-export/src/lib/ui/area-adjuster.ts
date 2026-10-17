import type { Map as MaplibreMap } from 'maplibre-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import CrosshairManager from './crosshair-manager';
import { toExportZoom, toMapZoom } from './export-dialog-utils';
import type { MapView, Translation } from '../interfaces';
import PrintableAreaManager from './printable-area-manager';

export interface AreaAdjusterOptions {
	/** map the user adjusts the area on */
	map: MaplibreMap | MapboxMap;
	/** CSS class prefix of the underlying library */
	cssPrefix: string;
	translation: Translation;
}

/**
 * Let the user frame the exported area on the map itself.
 *
 * The page is shown as a cut-out of a mask over the map, with a crosshair at its center. The user
 * moves, zooms, rotates and tilts the map with its usual interactions, then confirms with the Done
 * button of the toolbar shown on the map. The camera of the map is left where the user put it.
 */
export default class AreaAdjuster {
	private options: AreaAdjusterOptions;

	constructor(options: AreaAdjusterOptions) {
		this.options = options;
	}

	/**
	 * Show the area of `view` on the map and wait for the user to adjust it.
	 * @param view camera of the exported map to start from
	 * @param pageSize `[width, height]` of the page in mm
	 * @returns the adjusted camera of the exported map, or `null` when the user cancelled
	 */
	public adjust(view: MapView, pageSize: [number, number]): Promise<MapView | null> {
		const { map, cssPrefix: prefix, translation: t } = this.options;
		const cls = (name: string) => `${prefix}-export-${name}`;

		const area = new PrintableAreaManager(map);
		area.updateArea(pageSize[0], pageSize[1]);
		const crosshair = new CrosshairManager(map);
		crosshair.create();

		// show the area of the current preview: the cut-out is narrower than the page at 96 DPI
		const cutoutWidth = () => area.getCutoutWidth() || 1;
		map.jumpTo({
			center: view.center,
			zoom: toMapZoom(view.zoom, pageSize[0], cutoutWidth()),
			bearing: view.bearing,
			pitch: view.pitch
		});

		const bar = document.createElement('div');
		bar.className = cls('adjust-bar');
		bar.setAttribute('role', 'toolbar');
		bar.setAttribute('aria-label', t.AdjustArea);
		const hint = document.createElement('span');
		hint.className = cls('adjust-bar__hint');
		hint.textContent = t.AdjustAreaHint;
		const cancelButton = document.createElement('button');
		cancelButton.type = 'button';
		cancelButton.className = `${cls('btn')} ${cls('btn--secondary')}`;
		cancelButton.textContent = t.Cancel;
		const doneButton = document.createElement('button');
		doneButton.type = 'button';
		doneButton.className = `${cls('btn')} ${cls('btn--primary')}`;
		doneButton.textContent = t.Done;
		const actions = document.createElement('div');
		actions.className = cls('adjust-bar__actions');
		actions.append(cancelButton, doneButton);
		bar.append(hint, actions);
		map.getContainer().appendChild(bar);
		doneButton.focus();

		return new Promise<MapView | null>((resolve) => {
			const finish = (result: MapView | null) => {
				document.removeEventListener('keydown', onKeyDown);
				bar.remove();
				crosshair.destroy();
				area.destroy();
				resolve(result);
			};
			const onKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') finish(null);
			};
			document.addEventListener('keydown', onKeyDown);
			cancelButton.addEventListener('click', () => finish(null));
			doneButton.addEventListener('click', () => {
				const center = map.getCenter();
				finish({
					center: [center.lng, center.lat],
					zoom: toExportZoom(map.getZoom(), pageSize[0], cutoutWidth()),
					bearing: map.getBearing(),
					pitch: map.getPitch()
				});
			});
		});
	}
}
