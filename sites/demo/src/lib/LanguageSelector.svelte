<script context="module" lang="ts">
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
	import { type Language, getTranslation } from '@watergis/maplibre-gl-export';
	import type { Map as MapboxMap } from 'mapbox-gl';
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let map: MaplibreMap | MapboxMap;
	export let language: Language = 'en';
	export let position: ControlPosition = 'top-right';

	let control: LanguageControl | undefined;
	let controlGroup: HTMLDivElement;
	let languages: Language[] = ['en', 'fr', 'fi', 'de', 'sv', 'es', 'vi', 'uk', 'zhHans', 'zhHant', 'ja'];

	const handleClickLanguage = (lang: Language) => {
		language = lang;
		dispatch('change', {
			language
		});
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
	{#each languages as lang}
		<button
			class="lang-button {language === lang ? 'selected' : ''}"
			on:click={() => {
				handleClickLanguage(lang);
			}}
		>
			{getTranslation(lang).LanguageName}
		</button>
	{/each}
</div>

<style lang="scss">
	.lang-button {
		min-width: 150px;
		padding: 0 0.5rem !important;

		&.selected {
			background-color: #006eb5;
			color: white;

			&:hover {
				color: black;
			}
		}
	}
</style>
