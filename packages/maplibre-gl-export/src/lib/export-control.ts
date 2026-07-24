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
	defaultNorthIconOptions,
	defaultScalebarOptions
} from './map-generator-base';

/**
 * Sentinel value of the page-size `<select>` option that switches the control to the
 * user-entered custom width/height inputs. It is intentionally not valid JSON so it can
 * never be confused with a serialized `[width, height]` preset tuple.
 */
const CUSTOM_SIZE_VALUE = 'custom';

/**
 * MapLibre GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MaplibreExportControl implements IControl {
	protected controlContainer!: HTMLElement;

	protected exportContainer!: HTMLElement;

	protected crosshair: CrosshairManager | undefined;

	protected printableArea: PrintableAreaManager | undefined;

	protected map?: MaplibreMap | MapboxMap;

	protected exportButton!: HTMLButtonElement;

	protected options: ControlOptions = {
		PageSize: Size.A4 as SizeType,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.PDF,
		DPI: DPI[300],
		Crosshair: false,
		PrintableArea: false,
		Local: 'en',
		AllowedSizes: Object.keys(Size) as (
			'LETTER' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6'
		)[],
		Filename: 'map',
		markerCirclePaint: defaultMarkerCirclePaint,
		attributionOptions: defaultAttributionOptions,
		scalebarOptions: defaultScalebarOptions,
		northIconOptions: defaultNorthIconOptions
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

		const sizes: Record<string, readonly [number, number]> = {};
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
		// add a "Custom" entry so the end-user can type an arbitrary width/height (see below)
		const pageSizeSelect = tr1.querySelector('select') as HTMLSelectElement;
		const customOption = document.createElement('option');
		customOption.value = CUSTOM_SIZE_VALUE;
		customOption.textContent = this.getTranslation().Custom;
		pageSizeSelect.appendChild(customOption);
		table.appendChild(tr1);

		// custom width/height inputs, prefilled from the default page size and hidden until
		// the "Custom" entry is selected. Width and Height are separate rows so the panel
		// keeps the same width as the preset layout.
		const defaultSize = (this.options.PageSize as [number, number]) ?? Size.A4;
		const { rows: customRows, widthInput, heightInput } = this.createCustomSizeRows(defaultSize);
		customRows.forEach((row) => table.appendChild(row));

		const tr2 = this.createSelection(
			PageOrientation,
			this.getTranslation().PageOrientation,
			'page-orientation',
			this.options.PageOrientation as string,
			(data: { [key: string]: unknown }, key) => data[key]
		);
		const pageOrientationSelect = tr2.querySelector('select') as HTMLSelectElement;
		table.appendChild(tr2);

		// resolve a preset `<option>` value (a JSON `[long, short]` tuple) into an oriented
		// `[width, height]` tuple using the current orientation dropdown.
		const resolvePresetSize = (value: string): [number, number] | null => {
			if (!value || value === CUSTOM_SIZE_VALUE) {
				return null;
			}
			let size: [number, number];
			try {
				size = JSON.parse(value) as [number, number];
			} catch {
				return null;
			}
			return pageOrientationSelect.value === PageOrientation.Portrait
				? [size[1], size[0]]
				: [size[0], size[1]];
		};

		// show the custom inputs only for the "Custom" entry. Orientation is meaningless then
		// because the two inputs already define both dimensions, so disable it. Switching to
		// "Custom" prefills the inputs from the last selected preset (oriented), so the user
		// starts from the size they were just looking at.
		let lastPresetValue = pageSizeSelect.value;
		const syncCustomSize = () => {
			const isCustom = pageSizeSelect.value === CUSTOM_SIZE_VALUE;
			if (isCustom) {
				const size = resolvePresetSize(lastPresetValue);
				if (size) {
					widthInput.value = String(size[0]);
					heightInput.value = String(size[1]);
				}
			} else {
				lastPresetValue = pageSizeSelect.value;
			}
			customRows.forEach((row) => {
				row.style.display = isCustom ? '' : 'none';
			});
			pageOrientationSelect.disabled = isCustom;
			this.updatePrintableArea();
		};
		pageSizeSelect.addEventListener('change', syncCustomSize);
		widthInput.addEventListener('input', () => this.updatePrintableArea());
		heightInput.addEventListener('input', () => this.updatePrintableArea());
		syncCustomSize();

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

		const tr5 = this.createCheckbox(
			this.getTranslation().Scalebar,
			'scalebar',
			this.options.scalebarOptions?.visibility !== 'none'
		);
		table.appendChild(tr5);

		const tr6 = this.createCheckbox(
			this.getTranslation().NorthIcon,
			'north-icon',
			this.options.northIconOptions?.visibility !== 'none'
		);
		table.appendChild(tr6);

		this.exportContainer.appendChild(table);

		const generateButton = document.createElement('button');
		generateButton.type = 'button';
		generateButton.textContent = this.getTranslation().Generate;
		generateButton.classList.add('generate-button');
		generateButton.addEventListener('click', () => {
			const formatType: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-format-type')
			);
			const dpiType: HTMLSelectElement = <HTMLSelectElement>(
				document.getElementById('mapbox-gl-export-dpi-type')
			);
			const scalebar: HTMLInputElement = <HTMLInputElement>(
				document.getElementById('mapbox-gl-export-scalebar')
			);
			const northIcon: HTMLInputElement = <HTMLInputElement>(
				document.getElementById('mapbox-gl-export-north-icon')
			);
			// abort when the custom size is empty/invalid so we never generate a 0-sized map
			const pageSizeValue = this.getSelectedSize();
			if (!pageSizeValue) {
				return;
			}

			// reflect the panel toggles before generating so that `generateMap` (which is also
			// overridden by MapboxExportControl) can simply read them from `this.options`.
			if (this.options.scalebarOptions) {
				this.options.scalebarOptions.visibility = scalebar?.checked ? 'visible' : 'none';
			}
			if (this.options.northIconOptions) {
				this.options.northIconOptions.visibility = northIcon?.checked ? 'visible' : 'none';
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
		const mapGenerator = new MapGenerator(map as MaplibreMap, {
			size,
			dpi,
			format,
			unit,
			fileName: filename,
			markerCirclePaint: this.options.markerCirclePaint,
			attributionOptions: this.options.attributionOptions,
			scalebarOptions: this.options.scalebarOptions,
			northIconOptions: this.options.northIconOptions
		});
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

	/**
	 * Create a table row with a checkbox. It shares the layout of {@link createSelection}.
	 * @param title label of the checkbox
	 * @param type suffix of the element id (`mapbox-gl-export-${type}`)
	 * @param checked initial state
	 */
	private createCheckbox(title: string, type: string, checked: boolean): HTMLElement {
		const label = document.createElement('label');
		label.textContent = title;
		label.setAttribute('for', `mapbox-gl-export-${type}`);

		const content = document.createElement('input');
		content.type = 'checkbox';
		content.setAttribute('id', `mapbox-gl-export-${type}`);
		content.setAttribute('name', type);
		content.checked = checked;

		const tr = document.createElement('TR');
		const tdLabel = document.createElement('TD');
		const tdContent = document.createElement('TD');
		tdLabel.appendChild(label);
		tdContent.appendChild(content);
		tr.appendChild(tdLabel);
		tr.appendChild(tdContent);
		return tr;
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
		const pageSizeValue = this.getSelectedSize();
		if (!pageSizeValue) {
			return;
		}
		this.printableArea.updateArea(pageSizeValue[0], pageSizeValue[1]);
	}

	/**
	 * Read the currently selected page size as a `[width, height]` mm tuple.
	 *
	 * For a preset the orientation dropdown is applied by swapping the stored landscape
	 * tuple. For the "Custom" entry the two number inputs are used verbatim (they already
	 * define the orientation); `null` is returned when either value is missing or not a
	 * positive number so callers can skip generating / previewing.
	 */
	private getSelectedSize(): [number, number] | null {
		const pageSize: HTMLSelectElement = <HTMLSelectElement>(
			document.getElementById('mapbox-gl-export-page-size')
		);
		if (pageSize?.value === CUSTOM_SIZE_VALUE) {
			const widthInput: HTMLInputElement = <HTMLInputElement>(
				document.getElementById('mapbox-gl-export-custom-width')
			);
			const heightInput: HTMLInputElement = <HTMLInputElement>(
				document.getElementById('mapbox-gl-export-custom-height')
			);
			const width = Number(widthInput?.value);
			const height = Number(heightInput?.value);
			if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
				return null;
			}
			return [width, height];
		}
		const pageOrientation: HTMLSelectElement = <HTMLSelectElement>(
			document.getElementById('mapbox-gl-export-page-orientation')
		);
		const size = JSON.parse(pageSize.value) as [number, number];
		if (pageOrientation?.value === PageOrientation.Portrait) {
			return [size[1], size[0]];
		}
		return [size[0], size[1]];
	}

	/**
	 * Build the two stacked table rows holding the custom width and height number inputs
	 * (in mm). Each dimension is its own row so the panel keeps the preset layout width.
	 * @param defaultSize `[width, height]` used to prefill the inputs
	 */
	private createCustomSizeRows(defaultSize: readonly [number, number]): {
		rows: HTMLElement[];
		widthInput: HTMLInputElement;
		heightInput: HTMLInputElement;
	} {
		const createRow = (type: string, title: string, value: number) => {
			const label = document.createElement('label');
			label.textContent = title;
			label.setAttribute('for', `mapbox-gl-export-${type}`);

			const input = document.createElement('input');
			input.type = 'number';
			input.min = '1';
			input.step = '1';
			input.value = String(value);
			input.setAttribute('id', `mapbox-gl-export-${type}`);
			input.setAttribute('name', type);

			const unit = document.createElement('span');
			unit.className = 'maplibregl-export-unit';
			unit.textContent = 'mm';

			const wrapper = document.createElement('div');
			wrapper.className = 'maplibregl-export-custom-size';
			wrapper.appendChild(input);
			wrapper.appendChild(unit);

			const row = document.createElement('TR');
			row.style.display = 'none';
			const tdLabel = document.createElement('TD');
			const tdContent = document.createElement('TD');
			tdLabel.appendChild(label);
			tdContent.appendChild(wrapper);
			row.appendChild(tdLabel);
			row.appendChild(tdContent);
			return { row, input };
		};

		const width = createRow('custom-width', this.getTranslation().Width, defaultSize[0]);
		const height = createRow('custom-height', this.getTranslation().Height, defaultSize[1]);
		return { rows: [width.row, height.row], widthInput: width.input, heightInput: height.input };
	}
}
