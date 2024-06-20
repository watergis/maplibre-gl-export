<script context="module" lang="ts">
	export const getActualPaperSize = (size: SizeType, orientation: PageOrientationType) => {
		let actualPaperSize = [size[0], size[1]];
		if (orientation !== PageOrientation.Landscape) {
			actualPaperSize = actualPaperSize.reverse();
		}
		return actualPaperSize as unknown as SizeType;
	};
</script>

<script lang="ts">
	import {
		DPI,
		Format,
		MapGenerator,
		PageOrientation,
		Size,
		Unit,
		defaultAttributionOptions,
		defaultMarkerCirclePaint,
		defaultNorthIconOptions,
		getTranslation,
		type AttributionOptions,
		type DPIType,
		type FormatType,
		type Language,
		type NorthIconOptions,
		type PageOrientationType,
		type SizeType
	} from '@watergis/maplibre-gl-export';
	import {
		faBraille,
		faDownload,
		faFile,
		faFilePdf,
		faLeftRight,
		faUpDown
	} from '@fortawesome/free-solid-svg-icons';
	import type { Map } from 'maplibre-gl';
	import Fa from 'svelte-fa';

	export let map: Map;

	export let paperSize: SizeType = Size.A4;
	export let dpi: DPIType = DPI[96];
	export let format: FormatType = Format.PNG;
	export let orientation: PageOrientationType = PageOrientation.Landscape;
	export let local: Language = 'en';
	export let filename = 'map';
	export let markerCirclePaint = defaultMarkerCirclePaint;
	export let attributionOptions: AttributionOptions = defaultAttributionOptions;
	export let northIconOptions: NorthIconOptions = defaultNorthIconOptions;

	const exportMap = () => {
		const actualPaperSize = getActualPaperSize(paperSize, orientation);
		const mapGenerator = new MapGenerator(
			map,
			actualPaperSize,
			dpi,
			format,
			Unit.mm,
			filename,
			markerCirclePaint,
			attributionOptions,
			northIconOptions
		);
		mapGenerator.generate();
	};

	const getTranslationText = () => {
		const lang: Language = local ?? 'en';
		return getTranslation(lang);
	};
</script>

<div class="export-container">
	<div class="field">
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="label">{getTranslationText().PageSize}</label>
		<div class="control has-icons-left">
			<div class="select is-small is-fullwidth">
				<select bind:value={paperSize}>
					{#each Object.keys(Size) as key}
						<option value={Size[key]}>{key}</option>
					{/each}
				</select>
			</div>
			<div class="icon is-small is-left">
				<Fa icon={faFile} />
			</div>
		</div>
	</div>
	<div class="field">
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="label is-small">{getTranslationText().PageOrientation}</label>
		<div class="control">
			<div class="field has-addons">
				{#each Object.keys(PageOrientation) as key}
					<p class="control">
						<button
							class="button is-small {orientation === PageOrientation[key] ? 'is-link' : ''}"
							on:click={() => {
								orientation = PageOrientation[key];
							}}
						>
							<span class="icon is-small">
								<Fa
									icon={PageOrientation[key] === PageOrientation.Landscape ? faLeftRight : faUpDown}
									size="sm"
								/>
							</span>
							<span>{key}</span>
						</button>
					</p>
				{/each}
			</div>
		</div>
	</div>
	<div class="field">
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="label">{getTranslationText().Format}</label>
		<div class="control has-icons-left">
			<div class="select is-small is-fullwidth">
				<select bind:value={format}>
					{#each Object.keys(Format) as key}
						<option value={Format[key]}>{key}</option>
					{/each}
				</select>
			</div>
			<div class="icon is-small is-left">
				<Fa icon={faFilePdf} />
			</div>
		</div>
	</div>
	<div class="field">
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label class="label">{getTranslationText().DPI}</label>
		<div class="control has-icons-left">
			<div class="select is-small is-fullwidth">
				<select bind:value={dpi}>
					{#each Object.keys(DPI) as key}
						<option value={DPI[key]}>{key}</option>
					{/each}
				</select>
			</div>
			<div class="icon is-small is-left">
				<Fa icon={faBraille} />
			</div>
		</div>
	</div>

	<button class="button is-fullwidth is-primary" on:click={exportMap}>
		<span class="icon is-small">
			<Fa icon={faDownload} size="sm" />
		</span>
		<span>{getTranslationText().Generate}</span>
	</button>
</div>

<style lang="scss">
	@import 'bulma/css/bulma.css';

	.export-container {
		background-color: white;
		padding: 10px;

		@media (prefers-color-scheme: dark) {
			background-color: black;
		}
	}
</style>
