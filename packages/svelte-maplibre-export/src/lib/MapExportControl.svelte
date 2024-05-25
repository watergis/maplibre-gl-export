<script context="module" lang="ts">
	import type { ControlPosition, IControl, Map } from 'maplibre-gl';
	export class MapExportControl implements IControl {
		private map: Map | undefined;
		private controlContainer: HTMLElement | undefined;
		private buttonDiv: HTMLButtonElement;

		constructor(buttonDiv: HTMLButtonElement) {
			this.buttonDiv = buttonDiv;
		}

		onAdd(map: Map): HTMLElement {
			this.map = map;

			this.map = map;

			this.controlContainer = document.createElement('div');
			this.controlContainer.className = 'maplibregl-ctrl maplibregl-ctrl-group';
			this.controlContainer.appendChild(this.buttonDiv);
			return this.controlContainer;
		}

		onRemove(): void {
			if (
				!this.controlContainer ||
				!this.controlContainer.parentNode ||
				!this.map ||
				!this.buttonDiv
			) {
				return;
			}
			this.controlContainer.parentNode.removeChild(this.controlContainer);
			this.map = undefined;

			if (
				!this.controlContainer ||
				!this.controlContainer.parentNode ||
				!this.map ||
				!this.buttonDiv
			) {
				return;
			}
		}

		getDefaultPosition(): ControlPosition {
			const defaultPosition = 'top-right';
			return defaultPosition;
		}
	}
</script>

<script lang="ts">
	import {
		DPI,
		Format,
		PageOrientation,
		Size,
		type DPIType,
		type FormatType,
		type PageOrientationType,
		type SizeType
	} from '@watergis/maplibre-gl-export';

	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import type { DragOptions } from '@neodrag/svelte';
	import { draggable } from '@neodrag/svelte';
	import { CrosshairManager, PrintableAreaManager } from '@watergis/maplibre-gl-export';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import MapExportPanel, { getActualPaperSize } from './MapExportPanel.svelte';

	export let map: Map;

	let printableArea: PrintableAreaManager | undefined;
	let crosshairManager: CrosshairManager | undefined;

	let control: MapExportControl;
	let buttonDiv: HTMLButtonElement;

	export let showPrintableArea = true;
	export let showCrosshair = true;
	export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';

	export let paperSize: SizeType = Size.A4;
	export let dpi: DPIType = DPI[96];
	export let format: FormatType = Format.PNG;
	export let orientation: PageOrientationType = PageOrientation.Landscape;

	$: paperSize, updatePrintableArea();
	$: orientation, updatePrintableArea();

	let isExportContainerShown = false;
	let dragOptions: DragOptions = {};

	onMount(() => {
		if (!control) {
			control = new MapExportControl(buttonDiv);
		}
		if (!map.hasControl(control)) {
			map.addControl(control, position);
		}
		dragOptions.bounds = map.getContainer();
	});

	$: isExportContainerShown, toggleButton();
	const toggleButton = () => {
		if (!buttonDiv) return;
		if (isExportContainerShown) {
			buttonDiv.classList.add('maplibre-ctrl-icon-active');
		} else {
			buttonDiv.classList.remove('maplibre-ctrl-icon-active');
		}

		if (!showPrintableArea) {
			togglePrintableArea(false);
		} else {
			togglePrintableArea(isExportContainerShown);
		}
		if (!showCrosshair) {
			toggleCrosshair(false);
		} else {
			toggleCrosshair(isExportContainerShown);
		}
	};

	const togglePrintableArea = (state: boolean) => {
		if (state === false) {
			if (printableArea !== undefined) {
				printableArea.destroy();
				printableArea = undefined;
			}
		} else {
			printableArea = new PrintableAreaManager(map);
			updatePrintableArea();
		}
	};

	const updatePrintableArea = () => {
		if (printableArea === undefined) {
			return;
		}
		const actualPaperSize = getActualPaperSize(paperSize, orientation);
		printableArea.updateArea(actualPaperSize[0], actualPaperSize[1]);
	};

	const toggleCrosshair = (state: boolean) => {
		if (!map) return;
		if (state === false) {
			if (crosshairManager !== undefined) {
				crosshairManager.destroy();
				crosshairManager = undefined;
			}
		} else {
			crosshairManager = new CrosshairManager(map);
			crosshairManager.create();
		}
	};
</script>

<button
	class="maplibregl-ctrl-export maplibre-ctrl-export-icon {isExportContainerShown ? 'active' : ''}"
	bind:this={buttonDiv}
	on:click={() => {
		isExportContainerShown = !isExportContainerShown;
	}}
/>

{#if isExportContainerShown}
	<nav class="export-container" use:draggable={dragOptions}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span
			class="icon close-icon"
			role="button"
			tabindex="0"
			on:click={() => {
				isExportContainerShown = !isExportContainerShown;
			}}
		>
			<Fa icon={faXmark} />
		</span>
		<MapExportPanel bind:map bind:paperSize bind:format bind:dpi bind:orientation />
	</nav>
{/if}

<style lang="scss">
	@import 'bulma/css/bulma.css';

	.maplibre-ctrl-export-icon {
		background: url('data:image/svg+xml;charset=UTF-8,<svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m422.5 99v-24c0-41.355-33.645-75-75-75h-184c-41.355 0-75 33.645-75 75v24z"/><path d="m118.5 319v122 26 15c0 16.568 13.431 30 30 30h214c16.569 0 30-13.432 30-30v-15-26-122zm177 128h-80c-8.284 0-15-6.716-15-15s6.716-15 15-15h80c8.284 0 15 6.716 15 15s-6.716 15-15 15zm0-64h-80c-8.284 0-15-6.716-15-15s6.716-15 15-15h80c8.284 0 15 6.716 15 15s-6.716 15-15 15z"/><path d="m436.5 129h-361c-41.355 0-75 33.645-75 75v120c0 41.355 33.645 75 75 75h13v-80h-9c-8.284 0-15-6.716-15-15s6.716-15 15-15h24 304 24c8.284 0 15 6.716 15 15s-6.716 15-15 15h-9v80h14c41.355 0 75-33.645 75-75v-120c0-41.355-33.645-75-75-75zm-309 94h-48c-8.284 0-15-6.716-15-15s6.716-15 15-15h48c8.284 0 15 6.716 15 15s-6.716 15-15 15z"/></g></svg>');
		background-position: center;
		background-repeat: no-repeat;
		background-size: 70%;

		&.active {
			background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>');
			background-position: center;
			background-repeat: no-repeat;
			background-size: 40%;
		}
	}

	.export-container {
		position: absolute;
		padding: 10px;
		bottom: 10px;
		right: 10px;
		z-index: 10;
		cursor: grab;

		.close-icon {
			position: absolute;
			top: 1rem;
			right: 1rem;
			cursor: pointer;
		}
	}
</style>
