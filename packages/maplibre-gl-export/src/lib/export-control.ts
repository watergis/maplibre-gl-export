import { ControlPosition, IControl, Map as MaplibreMap } from 'maplibre-gl';
import { Map as MapboxMap } from 'mapbox-gl';
import {
	AreaAdjuster,
	CUSTOM_SIZE_VALUE,
	DEFAULT_NORTH_ICON_SIZE_FRACTION,
	ExportDialog,
	getTranslation,
	isSameSize,
	orientSize,
	readNorthIcon,
	resolveAllowedSizes,
	type ExportDialogState,
	type ExportSettings
} from '@watergis/export-ui';
import MapGenerator from './core/map-generator';
import {
	Format,
	type ControlOptions,
	type ExportResult,
	type FormatType,
	Unit,
	SizeType,
	SizeKey,
	Size,
	Translation,
	PageOrientation,
	DPI,
	type Language,
	type ScalebarOptions
} from './interfaces';
import {
	defaultAttributionOptions,
	defaultMarkerCirclePaint,
	defaultNorthIconOptions,
	defaultSvgVectorOptions,
	defaultScalebarOptions,
	MapGeneratorBase,
	type MapGeneratorConfig
} from './core/map-generator-base';

/**
 * MapLibre GL Export Control.
 *
 * It adds a print button to the map, which opens a dialog with a preview of the page and the
 * export settings.
 */
export default class MaplibreExportControl implements IControl {
	protected controlContainer!: HTMLElement;

	protected map?: MaplibreMap | MapboxMap;

	protected exportButton!: HTMLButtonElement;

	protected dialog: ExportDialog | undefined;

	/** state of the dialog form, kept so that reopening the dialog restores it */
	protected dialogState: ExportDialogState | undefined;

	protected options: ControlOptions = {
		PageSize: Size.A4 as SizeType,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.PDF,
		DPI: DPI[300],
		Local: 'en',
		AllowedSizes: Object.keys(Size) as SizeKey[],
		Filename: 'map',
		markerCirclePaint: defaultMarkerCirclePaint,
		attributionOptions: defaultAttributionOptions,
		scalebarOptions: defaultScalebarOptions,
		northIconOptions: defaultNorthIconOptions,
		svgVectorOptions: defaultSvgVectorOptions
	};

	protected MAPLIB_CSS_PREFIX: string = 'maplibregl';

	constructor(options: ControlOptions) {
		if (options) {
			options.attributionOptions = Object.assign(
				{},
				defaultAttributionOptions,
				options.attributionOptions
			);
			options.scalebarOptions = Object.assign({}, defaultScalebarOptions, options.scalebarOptions);
			options.northIconOptions = Object.assign(
				{},
				defaultNorthIconOptions,
				options.northIconOptions
			);
			options.svgVectorOptions = Object.assign(
				{},
				defaultSvgVectorOptions,
				options.svgVectorOptions
			);
			this.options = Object.assign(this.options, options);
		}
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	public getTranslation(): Translation {
		const lang: Language = this.options.Local ?? 'en';
		return getTranslation(lang);
	}

	public onAdd(map: MaplibreMap | MapboxMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl`);
		this.controlContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl-group`);
		this.exportButton = document.createElement('button');
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl-icon`);
		// `gl-export-control` is styled; the prefixed class is kept for the existing custom styles
		this.exportButton.classList.add('gl-export-control');
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-export-control`);
		this.exportButton.type = 'button';
		this.exportButton.title = this.getTranslation().Title;
		this.exportButton.setAttribute('aria-label', this.getTranslation().Title);
		this.exportButton.setAttribute('aria-haspopup', 'dialog');
		this.exportButton.addEventListener('click', () => this.openDialog());
		this.controlContainer.appendChild(this.exportButton);
		return this.controlContainer;
	}

	public onRemove(): void {
		this.dialog?.close();
		this.dialog = undefined;
		this.controlContainer?.parentNode?.removeChild(this.controlContainer);
		this.map = undefined;
	}

	/** Open the export dialog */
	public openDialog() {
		if (!this.map || this.dialog) return;
		const map = this.map;
		const translation = this.getTranslation();
		const sizes = resolveAllowedSizes(this.options.AllowedSizes);
		this.dialog = new ExportDialog({
			map,
			translation,
			sizes,
			state: this.dialogState ?? this.createDialogState(sizes),
			renderPreview: (settings, dpi) => this.renderPreview(map, settings, dpi),
			adjustArea: (view, pageSize) => new AreaAdjuster({ map, translation }).adjust(view, pageSize),
			// nothing is saved when the application handles the image itself through `onExport`
			useSaveFilePicker: this.options.download !== false,
			onSave: (settings) => this.exportMap(map, settings),
			onClose: (state) => {
				this.dialogState = state;
				this.dialog = undefined;
				this.exportButton?.focus();
			}
		});
		this.dialog.open();
	}

	/** Initial state of the dialog form, derived from the control options */
	protected createDialogState(sizes: Record<string, SizeType>): ExportDialogState {
		const pageSize = (this.options.PageSize ?? Size.A4) as SizeType;
		const orientation = this.options.PageOrientation ?? PageOrientation.Landscape;
		const preset = Object.values(sizes).find((size) => isSameSize(size, pageSize));
		// the colour is written into the SVG; the picker colours the icon again from these
		const northIcon = readNorthIcon(
			this.options.northIconOptions?.image ?? (defaultNorthIconOptions.image as string)
		);
		const customSize = orientSize(pageSize, orientation);
		return {
			// a `PageSize` which is not offered in the dropdown is shown as a custom size
			sizeValue: preset ? JSON.stringify(preset) : CUSTOM_SIZE_VALUE,
			orientation,
			customWidth: customSize[0],
			customHeight: customSize[1],
			format: (this.options.Format ?? Format.PDF) as FormatType,
			dpi: this.options.DPI ?? DPI[300],
			scalebar: this.options.scalebarOptions?.visibility !== 'none',
			northIcon: this.options.northIconOptions?.visibility !== 'none',
			northIconImage: northIcon.image,
			northIconColor: northIcon.color,
			northIconSizeFraction:
				this.options.northIconOptions?.imageSizeFraction ?? DEFAULT_NORTH_ICON_SIZE_FRACTION,
			vector: this.options.svgVectorOptions?.enabled === true,
			vectorLabels: this.options.svgVectorOptions?.labels === 'vector',
			fileName: this.options.Filename ?? 'map'
		};
	}

	/** Create the generator which renders and exports the map */
	protected createGenerator(
		map: MaplibreMap | MapboxMap,
		config: MapGeneratorConfig
	): MapGeneratorBase {
		return new MapGenerator(map as MaplibreMap, config);
	}

	/** Generator settings for the settings chosen in the dialog */
	protected createGeneratorConfig(settings: ExportSettings): MapGeneratorConfig {
		return {
			size: settings.size,
			dpi: settings.dpi as MapGeneratorConfig['dpi'],
			format: settings.format,
			unit: Unit.mm,
			fileName: settings.fileName,
			view: settings.view,
			markerCirclePaint: this.options.markerCirclePaint,
			attributionOptions: this.options.attributionOptions,
			scalebarOptions: {
				...defaultScalebarOptions,
				...this.options.scalebarOptions,
				visibility: settings.scalebar ? 'visible' : 'none'
			} as ScalebarOptions,
			northIconOptions: {
				...defaultNorthIconOptions,
				...this.options.northIconOptions,
				image: settings.northIconImage,
				imageSizeFraction: settings.northIconSizeFraction,
				visibility: settings.northIcon ? 'visible' : 'none'
			},
			svgVectorOptions: {
				...this.options.svgVectorOptions,
				enabled: settings.vector,
				labels: settings.vectorLabels ? 'vector' : 'raster'
			},
			geoPdf: this.options.geoPdf
		};
	}

	/**
	 * Render the preview of the dialog: the exported image itself, at a lower DPI. The page is
	 * laid out at 96 DPI whatever the DPI, so only the number of pixels differs from the export.
	 */
	protected renderPreview(
		map: MaplibreMap | MapboxMap,
		settings: ExportSettings,
		dpi: number
	): Promise<HTMLCanvasElement> {
		const generator = this.createGenerator(map, {
			...this.createGeneratorConfig(settings),
			dpi: dpi as MapGeneratorConfig['dpi'],
			download: false
		});
		return generator.toCanvas();
	}

	/**
	 * Export the map with the settings chosen in the dialog.
	 * @returns whether the map was exported
	 */
	protected async exportMap(map: MaplibreMap | MapboxMap, settings: ExportSettings) {
		const fileHandle = settings.fileHandle;
		const onExport = this.options.onExport;
		const generator = this.createGenerator(map, {
			...this.createGeneratorConfig(settings),
			// a file chosen with the save file picker is written below instead of being downloaded
			download: fileHandle ? false : this.options.download,
			onExport:
				fileHandle || onExport
					? async (result: ExportResult) => {
							if (fileHandle) {
								const writable = await fileHandle.createWritable();
								await writable.write(result.blob);
								await writable.close();
							}
							await onExport?.(result);
						}
					: undefined
		});
		return generator.generate();
	}
}
