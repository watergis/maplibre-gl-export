<!--
	Decrement / value (click to reset) / increment buttons.
	They use the `zoom` class names, as the zoom of the preview is what they are styled for.
-->
<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** accessible names of the buttons */
		labels: { decrement: string; reset: string; increment: string };
		/** value shown between the buttons */
		text: string;
		canDecrement?: boolean;
		canIncrement?: boolean;
		ondecrement: () => void;
		onreset: () => void;
		onincrement: () => void;
	}

	let {
		labels,
		text,
		canDecrement = true,
		canIncrement = true,
		ondecrement,
		onreset,
		onincrement
	}: Props = $props();
</script>

<div class="gl-export-zoom" role="group">
	<button
		type="button"
		class="gl-export-zoom__button gl-export-zoom__out"
		aria-label={labels.decrement}
		title={labels.decrement}
		disabled={!canDecrement}
		onclick={ondecrement}
	>
		<Icon icon={Minus} name="zoomOut" />
	</button>
	<button
		type="button"
		class="gl-export-zoom__button gl-export-zoom__reset"
		aria-label={labels.reset}
		title={labels.reset}
		onclick={onreset}>{text}</button
	>
	<button
		type="button"
		class="gl-export-zoom__button gl-export-zoom__in"
		aria-label={labels.increment}
		title={labels.increment}
		disabled={!canIncrement}
		onclick={onincrement}
	>
		<Icon icon={Plus} name="zoomIn" />
	</button>
</div>

<style>
	.gl-export-zoom {
		display: inline-flex;
		flex: none;
		align-items: center;
		height: 36px;
		overflow: hidden;
		border: 1px solid var(--gl-export-input);
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-input-background);
	}

	.gl-export-zoom__button {
		--gl-export-icon-size: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 34px;
		height: 100%;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--gl-export-foreground);
		font: inherit;
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.gl-export-zoom__button:hover:not(:disabled) {
		background: var(--gl-export-accent);
	}

	.gl-export-zoom__button:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 2px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-zoom__button:disabled {
		cursor: default;
		opacity: 0.35;
	}

	/* zoom level, click to reset to 100% */
	.gl-export-zoom__reset {
		min-width: 56px;
		color: var(--gl-export-muted-foreground);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
	}
</style>
