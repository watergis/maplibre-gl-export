/**
 * The members of a MapLibre or Mapbox map which the export UI uses.
 *
 * It is typed structurally instead of importing `Map` from `maplibre-gl` / `mapbox-gl`, so that
 * the map of any supported version of these libraries can be passed.
 */
export interface ExportMap {
	getCenter(): { lng: number; lat: number };
	getZoom(): number;
	getBearing(): number;
	getPitch(): number;
	jumpTo(options: {
		center?: [number, number];
		zoom?: number;
		bearing?: number;
		pitch?: number;
	}): unknown;
	getContainer(): HTMLElement;
	getCanvas(): HTMLCanvasElement;
	getCanvasContainer(): HTMLElement;
	on(type: 'resize', listener: () => void): unknown;
	off(type: 'resize', listener: () => void): unknown;
}
