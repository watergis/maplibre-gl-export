import { IControl, Map as MapboxMap } from 'mapbox-gl';
import {
	CrosshairManager,
	PrintableAreaManager,
	type Translation,
	type languages,
	getTranslation,
	Size,
	SizeType,
	PageOrientation,
	Format,
	DPI,
	Unit,
	DPIType,
	FormatType
} from '@watergis/maplibre-gl-export';
import { ControlOptions } from './interfaces';
import MapGenerator from './map-generator';

/**
 * Mapbox GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MapboxExportControl implements IControl {
	private controlContainer: HTMLElement;

	private exportContainer: HTMLElement;

	private crosshair: CrosshairManager | undefined;

	private printableArea: PrintableAreaManager | undefined;

	private map?: MapboxMap;

	private exportButton: HTMLButtonElement;

	private options: ControlOptions = {
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
		accessToken: undefined
	};

	constructor(options: ControlOptions) {
		if (options) {
			this.options = Object.assign(this.options, options);
		}
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	public getDefaultPosition(): string {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	public getTranslation(): Translation {
		const lang: languages = this.options.Local ?? 'en';
		return getTranslation(lang);
	}

	public onAdd(map: MapboxMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add('mapboxgl-ctrl');
		this.controlContainer.classList.add('mapboxgl-ctrl-group');
		this.exportContainer = document.createElement('div');
		this.exportContainer.classList.add('mapboxgl-export-list');
		this.exportButton = document.createElement('button');
		this.exportButton.classList.add('mapboxgl-ctrl-icon');
		this.exportButton.classList.add('mapboxgl-export-control');
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
			'page-orientaiton',
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
				document.getElementById('mapbox-gl-export-page-orientaiton')
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
			const mapGenerator = new MapGenerator(
				map,
				pageSizeValue,
				Number(dpiType.value) as DPIType,
				formatType.value as FormatType,
				Unit.mm,
				this.options.Filename,
				this.options.accessToken
			);
			mapGenerator.generate();
		});
		this.exportContainer.appendChild(generateButton);

		return this.controlContainer;
	}

	private createSelection(
		data: Record<string, unknown>,
		title: string,
		type: string,
		defaultValue: number | string | [number, number],
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
			document.getElementById('mapbox-gl-export-page-orientaiton')
		);
		const orientValue = pageOrientation.value;
		let pageSizeValue = JSON.parse(pageSize.value);
		if (orientValue === PageOrientation.Portrait) {
			pageSizeValue = pageSizeValue.reverse();
		}
		this.printableArea.updateArea(pageSizeValue[0], pageSizeValue[1]);
	}
}
