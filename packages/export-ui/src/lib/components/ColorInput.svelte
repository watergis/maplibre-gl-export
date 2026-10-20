<!-- Colour input: a square swatch of the size of a small button, which opens the colour picker -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		/** accessible name, when the input has no `<label>` */
		label?: string;
		/** colour as `#rrggbb` */
		value: string;
		disabled?: boolean;
		/** the colour changed, while it is being picked */
		onchange?: (value: string) => void;
	}

	let { id, name, label, value = $bindable(), disabled = false, onchange }: Props = $props();
</script>

<input
	class="gl-export-color"
	type="color"
	{id}
	{name}
	aria-label={label}
	title={label}
	{value}
	{disabled}
	oninput={(event) => {
		value = event.currentTarget.value;
		onchange?.(value);
	}}
/>

<style>
	.gl-export-color {
		flex: none;
		width: 30px;
		height: 30px;
		margin: 0;
		padding: 5px;
		border: 1px solid var(--gl-export-input);
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-input-background);
		appearance: none;
		cursor: pointer;
	}

	.gl-export-color::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.gl-export-color::-webkit-color-swatch {
		border: 1px solid var(--gl-export-input);
		border-radius: 3px;
	}

	.gl-export-color::-moz-color-swatch {
		border: 1px solid var(--gl-export-input);
		border-radius: 3px;
	}

	.gl-export-color:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-color:disabled {
		cursor: default;
		opacity: 0.5;
	}
</style>
