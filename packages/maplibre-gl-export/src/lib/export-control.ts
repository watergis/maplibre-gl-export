import { ControlPosition, IControl, Map as MaplibreMap } from 'maplibre-gl';
import { Map as MapboxMap } from 'mapbox-gl';
import CrosshairManager from './crosshair-manager';
import PrintableAreaManager from './printable-area-manager';
import { getTranslation } from './local';
import MapGenerator from './map-generator';
import {
	Format,
	type ControlOptions,
	FormatType,
	Unit,
	SizeType,
	Size,
	Translation,
	PageOrientation,
	DPI,
	DPIType,
	UnitType,
	type Language
} from './interfaces';
import {
	defaultAttributionOptions,
	defaultMarkerCirclePaint,
	defaultNorthIconOptions
} from './map-generator-base';

/**
 * Maplibre GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MaplibreExportControl implements IControl {
	protected controlContainer: HTMLElement;

	protected exportContainer: HTMLElement;

	protected crosshair: CrosshairManager | undefined;

	protected printableArea: PrintableAreaManager | undefined;

	protected map?: MaplibreMap | MapboxMap;

	protected exportButton: HTMLButtonElement;

	protected options: ControlOptions = {
		PageSize: Size.A4 as SizeType,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.PDF,
		DPI: DPI[300],
		Crosshair: false,
		PrintableArea: false,
		Local: 'en',
		AllowedSizes: Object.keys(Size) as (
			| 'LETTER'
			| 'A2'
			| 'A3'
			| 'A4'
			| 'A5'
			| 'A6'
			| 'B2'
			| 'B3'
			| 'B4'
			| 'B5'
			| 'B6'
		)[],
		Filename: 'map',
		markerCirclePaint: defaultMarkerCirclePaint,
		attributionOptions: defaultAttributionOptions,
		northIconOptions: defaultNorthIconOptions
	};

	protected MAPLIB_CSS_PREFIX: string = 'maplibregl';

	constructor(options: ControlOptions) {
		if (options) {
			options.attributionOptions = Object.assign(
				defaultAttributionOptions,
				options.attributionOptions
			);
			options.northIconOptions = Object.assign(defaultNorthIconOptions, options.northIconOptions);
			this.options = Object.assign(this.options, options);
		}
		this.onDocumentClick = this.onDocumentClick.bind(this);
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
		this.exportContainer = document.createElement('div');
		this.exportContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-export-list`);
		this.exportButton = document.createElement('button');
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl-icon`);
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-export-control`);
		this.exportButton.type = 'button';
		this.exportButton.addEventListener('click', () => {
			this.exportButton.style.display = 'none';
			this.exportContainer.style.display = 'block';
			this.toggleCrosshair(true);
			this.togglePrintableArea(true);
		});
		document.addEventListener('click', this.onDocumentClick);
		this.controlContainer.appendChild(this.exportButton);
		this.controlContainer.appendChild(this.exportContainer);

		const table = document.createElement('TABLE');
		table.className = 'print-table';

		const sizes = {};
		this.options.AllowedSizes?.forEach((size) => {
			const dimensions = Size[size];
			if (dimensions) {
				sizes[size] = Size[size];
			}
		});
		const tr1 = this.createSelection(
			sizes,
			this.getTranslation().PageSize,
			'page-size',
			this.options.PageSize as [number, number],
			(data: { [key: string]: unknown }, key) => JSON.stringify(data[key])
		);
		table.appendChild(tr1);

		const tr2 = this.createSelection(
			PageOrientation,
			this.getTranslation().PageOrientation,
			'page-orientation',
			this.options.PageOrientation as string,
			(data: { [key: string]: unknown }, key) => data[key]
		);
		table.appendChild(tr2);

		const tr3 = this.createSelection(
			Format,
			this.getTranslation().Format,
			'format-type',
			this.options.Format as string,
			(data: { [key: string]: unknown }, key) => data[key]
		);
		table.appendChild(tr3);

		const tr4 = this.createSelection(
			DPI,
			this.getTranslation().DPI,
			'dpi-type',
			this.options.DPI as number,
			(data: { [key: string]: unknown }, key) => data[key]
		);
		table.appendChild(tr4);

		this.exportContainer.appendChild(table);

		const generateButton = document.createElement('button');
		generateButton.type = 'button';
		generateButton.textContent = this.getTranslation().Generate;
		generateButton.classList.add('generate-button');
		generateButton.addEventListener('click', () => {
			const pageSize: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-page-size')
			);
			const pageOrientation: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-page-orientation')
			);
			const formatType: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-format-type')
			);
			const dpiType: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-dpi-type')
			);
			const orientValue = pageOrientation.value;
			let pageSizeValue = JSON.parse(pageSize.value);
			if (orientValue === PageOrientation.Portrait) {
				pageSizeValue = pageSizeValue.reverse();
			}
			this.generateMap(
				map,
				pageSizeValue,
				Number(dpiType.value) as DPIType,
				formatType.value as FormatType,
				Unit.mm,
				this.options.Filename
			);
		});
		this.exportContainer.appendChild(generateButton);

		return this.controlContainer;
	}

	protected generateMap(
		map: MaplibreMap | MapboxMap,
		size: SizeType,
		dpi: DPIType,
		format: FormatType,
		unit: UnitType,
		filename?: string
	) {
		const mapGenerator = new MapGenerator(
			map as MaplibreMap,
			size,
			dpi,
			format,
			unit,
			filename,
			this.options.markerCirclePaint,
			this.options.attributionOptions,
			this.options.northIconOptions
		);
		mapGenerator.generate();
	}

	private createSelection(
		data: Record<string, unknown>,
		title: string,
		type: string,
		defaultValue: string | number | [number, number],
		converter: (data: { [key: string]: unknown }, key: string) => unknown
	): HTMLElement {
		const label = document.createElement('label');
		label.textContent = title;

		const content = document.createElement('select');
		content.setAttribute('id', `mapbox-gl-export-${type}`);
		content.style.width = '100%';
		Object.keys(data).forEach((key) => {
			const optionLayout = document.createElement('option');
			optionLayout.setAttribute('value', converter(data, key) as string);
			optionLayout.appendChild(document.createTextNode(key));
			optionLayout.setAttribute('name', type);
			if (defaultValue === data[key]) {
				optionLayout.selected = true;
			}
			content.appendChild(optionLayout);
		});
		content.addEventListener('change', () => {
			this.updatePrintableArea();
		});

		const tr1 = document.createElement('TR');
		const tdLabel = document.createElement('TD');
		const tdContent = document.createElement('TD');
		tdLabel.appendChild(label);
		tdContent.appendChild(content);
		tr1.appendChild(tdLabel);
		tr1.appendChild(tdContent);
		return tr1;
	}

	public onRemove(): void {
		if (
			!this.controlContainer ||
			!this.controlContainer.parentNode ||
			!this.map ||
			!this.exportButton
		) {
			return;
		}
		this.exportButton.removeEventListener('click', this.onDocumentClick);
		this.controlContainer.parentNode.removeChild(this.controlContainer);
		document.removeEventListener('click', this.onDocumentClick);

		if (this.crosshair !== undefined) {
			this.crosshair.destroy();
			this.crosshair = undefined;
		}

		if (this.printableArea !== undefined) {
			this.printableArea.destroy();
			this.printableArea = undefined;
		}

		this.map = undefined;
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element) &&
			this.exportContainer &&
			this.exportButton
		) {
			this.exportContainer.style.display = 'none';
			this.exportButton.style.display = 'block';
			this.toggleCrosshair(false);
			this.togglePrintableArea(false);
		}
	}

	private toggleCrosshair(state: boolean) {
		if (this.options.Crosshair === true) {
			if (state === false) {
				if (this.crosshair !== undefined) {
					this.crosshair.destroy();
					this.crosshair = undefined;
				}
			} else {
				this.crosshair = new CrosshairManager(this.map);
				this.crosshair.create();
			}
		}
	}

	private togglePrintableArea(state: boolean) {
		if (this.options.PrintableArea === true) {
			if (state === false) {
				if (this.printableArea !== undefined) {
					this.printableArea.destroy();
					this.printableArea = undefined;
				}
			} else {
				this.printableArea = new PrintableAreaManager(this.map);
				this.updatePrintableArea();
			}
		}
	}

	private updatePrintableArea() {
		if (this.printableArea === undefined) {
			return;
		}
		const pageSize: HTMLSelectElement = <HTMLSelectElement>(
			document.getElementById('mapbox-gl-export-page-size')
		);
		const pageOrientation: HTMLSelectElement = <HTMLSelectElement>(
			document.getElementById('mapbox-gl-export-page-orientation')
		);
		const orientValue = pageOrientation.value;
		let pageSizeValue = JSON.parse(pageSize.value);
		if (orientValue === PageOrientation.Portrait) {
			pageSizeValue = pageSizeValue.reverse();
		}
		this.printableArea.updateArea(pageSizeValue[0], pageSizeValue[1]);
	}
}
