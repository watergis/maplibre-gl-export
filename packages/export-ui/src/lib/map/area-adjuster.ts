import { mount, unmount } from 'svelte';
import AdjustBar from './AdjustBar.svelte';
import CrosshairManager from './crosshair-manager';
import type { ExportMap, MapView, Translation } from '../interfaces';
import PrintableAreaManager from './printable-area-manager';

/** Number of CSS pixels in a millimeter at 96 DPI, which is the layout resolution of the page */
const PX_PER_MM = 96 / 25.4;

/** Width or height of the page in CSS pixels when it is laid out at 96 DPI */
export const mmToPx = (mm: number) => mm * PX_PER_MM;

/**
 * Zoom level of the exported map which shows the same area as a frame of `frameWidth` pixels on
 * a map at `mapZoom`.
 *
 * The exported map is laid out at 96 DPI, so it is `mmToPx(pageWidth)` pixels wide. Every zoom
 * level doubles the width in pixels of the same area, so the difference of the two zoom levels
 * is the log2 of the ratio of the widths.
 * @param mapZoom zoom level of the map the frame is drawn on
 * @param pageWidth width of the page in mm
 * @param frameWidth width of the frame in CSS pixels
 */
export const toExportZoom = (mapZoom: number, pageWidth: number, frameWidth: number) =>
	mapZoom + Math.log2(mmToPx(pageWidth) / frameWidth);

/** Inverse of {@link toExportZoom} */
export const toMapZoom = (exportZoom: number, pageWidth: number, frameWidth: number) =>
	exportZoom - Math.log2(mmToPx(pageWidth) / frameWidth);

export interface AreaAdjusterOptions {
	/** map the user adjusts the area on */
	map: ExportMap;
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
		const { map, translation } = this.options;

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

		return new Promise<MapView | null>((resolve) => {
			const finish = (result: MapView | null) => {
				document.removeEventListener('keydown', onKeyDown);
				unmount(bar);
				crosshair.destroy();
				area.destroy();
				resolve(result);
			};
			const onKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') finish(null);
			};
			document.addEventListener('keydown', onKeyDown);
			const bar = mount(AdjustBar, {
				target: map.getContainer(),
				props: {
					translation,
					oncancel: () => finish(null),
					ondone: () => {
						const center = map.getCenter();
						finish({
							center: [center.lng, center.lat],
							zoom: toExportZoom(map.getZoom(), pageSize[0], cutoutWidth()),
							bearing: map.getBearing(),
							pitch: map.getPitch()
						});
					}
				}
			});
		});
	}
}
