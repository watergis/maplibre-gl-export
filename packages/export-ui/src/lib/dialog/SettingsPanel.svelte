<!-- Right column of the export dialog: the form of the export settings -->
<script lang="ts">
	import {
		Compass,
		File,
		FileImage,
		FilePenLine,
		MoveHorizontal,
		MoveVertical,
		Proportions,
		RectangleHorizontal,
		RectangleVertical,
		RulerDimensionLine,
		Type,
		VectorPolygon
	} from '@lucide/svelte';
	import { untrack } from 'svelte';
	import Field from '../components/Field.svelte';
	import InputGroup from '../components/InputGroup.svelte';
	import SegmentedButton from '../components/SegmentedButton.svelte';
	import Select from '../components/Select.svelte';
	import Slider from '../components/Slider.svelte';
	import Switch from '../components/Switch.svelte';
	import {
		DPI,
		Format,
		PageOrientation,
		type ExportDialogState,
		type SizeType,
		type Translation
	} from '../interfaces';
	import { isVectorFormat, sanitizeFileName } from '../utils/format';
	import { CUSTOM_SIZE_VALUE, readPageSize } from '../utils/page-size';

	interface Props {
		/** prefix of the ids and names of the form elements, unique to the dialog */
		idPrefix: string;
		translation: Translation;
		/** page sizes offered in the dropdown, `label -> [long, short]` in mm */
		sizes: Record<string, SizeType>;
		/** state of the dialog. It is changed as the user edits the settings */
		formState: ExportDialogState;
		/** the page size or orientation changed to a valid `[width, height]` in mm */
		onpagelayoutchange?: (size: [number, number]) => void;
		/** a setting shown in the preview changed */
		onrenderchange?: () => void;
	}

	let {
		idPrefix,
		translation: t,
		sizes,
		formState = $bindable(),
		onpagelayoutchange,
		onrenderchange
	}: Props = $props();
	const id = (name: string) => `${idPrefix}-${name}`;

	const sizeOptions = $derived([
		...Object.entries(sizes).map(([label, size]) => ({ label, value: JSON.stringify(size) })),
		{ label: t.Custom, value: CUSTOM_SIZE_VALUE }
	]);

	// the DPI of the options is offered even when it is not one of the presets
	const dpiValues = untrack(() => {
		const values: number[] = Object.values(DPI);
		if (!values.includes(formState.dpi)) values.push(formState.dpi);
		return values.sort((a, b) => a - b);
	});

	// the custom size is typed as text, so that an invalid value can be shown while it is typed
	let customWidth = $state(untrack(() => String(formState.customWidth)));
	let customHeight = $state(untrack(() => String(formState.customHeight)));
	let customWidthInput = $state<HTMLInputElement>();
	let customHeightInput = $state<HTMLInputElement>();

	/**
	 * The width/height inputs are only shown for the "Custom" entry. Orientation is meaningless
	 * then because the two inputs already define both dimensions, so its row is hidden.
	 */
	const isCustom = $derived(formState.sizeValue === CUSTOM_SIZE_VALUE);
	const vectorFormat = $derived(isVectorFormat(formState.format));

	/** Show why the custom size is invalid */
	export const reportValidity = () => {
		customWidthInput?.reportValidity();
		customHeightInput?.reportValidity();
	};

	const onPageLayoutChange = () => {
		const size = readPageSize(formState);
		if (size) onpagelayoutchange?.(size);
	};

	const onPageSizeChange = (value: string) => {
		if (value === CUSTOM_SIZE_VALUE && formState.sizeValue !== CUSTOM_SIZE_VALUE) {
			// start from the size the user was just looking at
			const size = readPageSize(formState);
			if (size) {
				formState.customWidth = size[0];
				formState.customHeight = size[1];
				customWidth = String(size[0]);
				customHeight = String(size[1]);
			}
		}
		formState.sizeValue = value;
		onPageLayoutChange();
	};
</script>

<form class="gl-export-dialog__settings" onsubmit={(event) => event.preventDefault()}>
	<Field name="pageSize" icon={File} label={t.PageSize} id={id('page-size')}>
		<Select
			id={id('page-size')}
			name="page-size"
			options={sizeOptions}
			value={formState.sizeValue}
			onchange={onPageSizeChange}
		/>
	</Field>

	<Field
		name="customWidth"
		icon={MoveHorizontal}
		label={t.Width}
		id={id('custom-width')}
		modifiers={['custom-size']}
		hidden={!isCustom}
	>
		<InputGroup
			id={id('custom-width')}
			name="custom-width"
			type="number"
			addon="mm"
			bind:value={customWidth}
			bind:input={customWidthInput}
			oninput={(value) => {
				formState.customWidth = Number(value);
				onPageLayoutChange();
			}}
		/>
	</Field>
	<Field
		name="customHeight"
		icon={MoveVertical}
		label={t.Height}
		id={id('custom-height')}
		modifiers={['custom-size']}
		hidden={!isCustom}
	>
		<InputGroup
			id={id('custom-height')}
			name="custom-height"
			type="number"
			addon="mm"
			bind:value={customHeight}
			bind:input={customHeightInput}
			oninput={(value) => {
				formState.customHeight = Number(value);
				onPageLayoutChange();
			}}
		/>
	</Field>

	<Field
		name="landscape"
		icon={RectangleHorizontal}
		label={t.PageOrientation}
		modifiers={['orientation']}
		hidden={isCustom}
	>
		<SegmentedButton
			name={id('orientation')}
			label={t.PageOrientation}
			choices={[
				{ value: PageOrientation.Landscape, icon: RectangleHorizontal, label: t.Landscape },
				{ value: PageOrientation.Portrait, icon: RectangleVertical, label: t.Portrait }
			]}
			bind:value={formState.orientation}
			onchange={onPageLayoutChange}
		/>
	</Field>

	<Field name="format" icon={FileImage} label={t.Format}>
		<SegmentedButton
			name={id('format')}
			label={t.Format}
			choices={Object.entries(Format).map(([label, value]) => ({ label, value }))}
			bind:value={formState.format}
			compact
		/>
	</Field>

	<!-- vector export, only for SVG and PDF -->
	<Field
		name="vector"
		icon={VectorPolygon}
		label={t.ExportAsVector}
		id={id('vector')}
		modifiers={['switch']}
		hidden={!vectorFormat}
	>
		<Switch id={id('vector')} name="vector" bind:checked={formState.vector} />
	</Field>
	<Field
		name="vectorLabels"
		icon={Type}
		label={t.ExportLabelsAsVector}
		id={id('vector-labels')}
		modifiers={['switch']}
		hidden={!vectorFormat || !formState.vector}
	>
		<Switch id={id('vector-labels')} name="vector-labels" bind:checked={formState.vectorLabels} />
	</Field>

	<Field name="dpi" icon={Proportions} label={t.DPI} id={id('dpi')} value={String(formState.dpi)}>
		<Slider
			id={id('dpi')}
			name="dpi"
			values={dpiValues}
			bind:value={formState.dpi}
			valueText={(value) => `${value} DPI`}
		/>
	</Field>

	<!-- overlays -->
	<Field
		name="scalebar"
		icon={RulerDimensionLine}
		label={t.Scalebar}
		id={id('scalebar')}
		modifiers={['switch']}
	>
		<Switch
			id={id('scalebar')}
			name="scalebar"
			bind:checked={formState.scalebar}
			onchange={() => onrenderchange?.()}
		/>
	</Field>
	<Field
		name="northIcon"
		icon={Compass}
		label={t.NorthIcon}
		id={id('north-icon')}
		modifiers={['switch']}
	>
		<Switch
			id={id('north-icon')}
			name="north-icon"
			bind:checked={formState.northIcon}
			onchange={() => onrenderchange?.()}
		/>
	</Field>

	<Field name="fileName" icon={FilePenLine} label={t.FileName} id={id('file-name')}>
		<InputGroup
			id={id('file-name')}
			name="file-name"
			type="text"
			addon=".{formState.format}"
			bind:value={formState.fileName}
			onchange={(value) => (formState.fileName = sanitizeFileName(value, formState.format))}
		/>
	</Field>
</form>

<style>
	.gl-export-dialog__settings {
		display: flex;
		flex: none;
		flex-direction: column;
		gap: 14px;
		width: var(--gl-export-settings-width);
		margin: 0;
		padding: 20px;
		overflow-y: auto;
		border-left: 1px solid var(--gl-export-border);
	}

	/* mobile: full screen, preview on top and settings below in one scrolling body */
	@media (max-width: 767px) {
		.gl-export-dialog__settings {
			width: 100%;
			overflow-y: visible;
			border-left: none;
		}
	}
</style>
