<script module lang="ts">
	import type { ControlPosition, IControl } from 'maplibre-gl';

	export class LanguageControl implements IControl {
		private map: MaplibreMap | MapboxMap | undefined;
		private controlContainer: HTMLElement | undefined;
		private buttonsDiv: HTMLDivElement;

		constructor(buttonsDiv: HTMLDivElement) {
			this.buttonsDiv = buttonsDiv;
		}

		onAdd(map: MaplibreMap | MapboxMap): HTMLElement {
			this.map = map;
			return this.buttonsDiv;
		}

		onRemove(): void {
			if (
				!this.controlContainer ||
				!this.controlContainer.parentNode ||
				!this.map ||
				!this.buttonsDiv
			) {
				return;
			}
			this.controlContainer.parentNode.removeChild(this.controlContainer);
			this.map = undefined;
		}

		getDefaultPosition(): ControlPosition {
			const defaultPosition = 'top-right';
			return defaultPosition;
		}
	}
</script>

<script lang="ts">
	import { type Language, getTranslation, AvailableLanguages } from '@watergis/maplibre-gl-export';
	import type { Map as MapboxMap } from 'mapbox-gl';
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		map: MaplibreMap | MapboxMap;
		language?: Language;
		position?: ControlPosition;
		change?: (language: Language) => void;
	}

	let { map, language = $bindable('en'), position = 'top-right', change }: Props = $props();

	let control: LanguageControl | undefined;
	let controlGroup: HTMLDivElement = $state();

	const handleClickLanguage = (lang: Language) => {
		language = lang;
		if (change) {
			change(language);
		}
	};

	onMount(() => {
		control = new LanguageControl(controlGroup);
		map.addControl(control, position);
	});

	onDestroy(() => {
		if (control) {
			map.removeControl(control);
			control = undefined;
		}
	});
</script>

<div
	class="maplibregl-ctrl maplibregl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-group"
	bind:this={controlGroup}
>
	{#each AvailableLanguages as lang (lang)}
		<button
			class="btn bg-gray-300 hover:bg-gray-400 text-gray-800 {language === lang ? 'selected' : ''}"
			onclick={() => {
				handleClickLanguage(lang);
			}}
		>
			{getTranslation(lang).LanguageName}
		</button>
	{/each}
</div>

<style lang="scss">
	.btn {
		min-width: 150px;
		padding: 0 0.5rem !important;

		&.selected {
			@apply bg-blue-500 text-white;
		}
	}
</style>
