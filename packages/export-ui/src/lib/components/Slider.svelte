<!--
	Slider snapping to a list of values, with a button for every value below it.
	The slider holds the index of the value, so the values are evenly spaced.
	The readout of the value is placed by the caller (usually in the label of the field).
-->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		/** values the slider snaps to, in ascending order */
		values: number[];
		/** selected value, one of `values` */
		value: number;
		/** accessible text of a value, e.g. `300 DPI` */
		valueText?: (value: number) => string;
		onchange?: (value: number) => void;
	}

	let { id, name, values, value = $bindable(), valueText, onchange }: Props = $props();

	let input: HTMLInputElement;
	const index = $derived(values.indexOf(value));
	const progress = $derived((index / Math.max(values.length - 1, 1)) * 100);

	const select = (i: number) => {
		value = values[i];
		onchange?.(value);
	};
</script>

<div class="gl-export-range">
	<input
		bind:this={input}
		class="gl-export-range__input"
		type="range"
		{id}
		{name}
		min="0"
		max={values.length - 1}
		step="1"
		value={index}
		aria-valuetext={valueText?.(value) ?? String(value)}
		style:--gl-export-range-progress="{progress}%"
		oninput={(event) => select(Number(event.currentTarget.value))}
	/>
	<div class="gl-export-range__ticks">
		{#each values as tick, i (tick)}
			<!-- the slider itself is reachable with the keyboard -->
			<button
				type="button"
				tabindex="-1"
				class={['gl-export-range__tick', i === index && 'gl-export-range__tick--active']}
				onclick={() => {
					select(i);
					input.focus();
				}}>{tick}</button
			>
		{/each}
	</div>
</div>

<style>
	.gl-export-range {
		--gl-export-range-thumb: 18px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
	}

	.gl-export-range__input {
		--gl-export-range-track: linear-gradient(
			to right,
			var(--gl-export-primary) var(--gl-export-range-progress, 0%),
			var(--gl-export-border) var(--gl-export-range-progress, 0%)
		);
		width: 100%;
		height: 22px;
		margin: 0;
		background: transparent;
		appearance: none;
		cursor: pointer;
	}

	.gl-export-range__input::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 2px;
		background: var(--gl-export-range-track);
	}

	.gl-export-range__input::-moz-range-track {
		height: 4px;
		border-radius: 2px;
		background: var(--gl-export-range-track);
	}

	.gl-export-range__input::-webkit-slider-thumb {
		width: var(--gl-export-range-thumb);
		height: var(--gl-export-range-thumb);
		margin-top: calc((4px - var(--gl-export-range-thumb)) / 2);
		border: 2px solid var(--gl-export-primary-foreground);
		border-radius: 50%;
		background: var(--gl-export-primary);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-export-shadow-color) 35%, transparent);
		appearance: none;
	}

	.gl-export-range__input::-moz-range-thumb {
		box-sizing: border-box;
		width: var(--gl-export-range-thumb);
		height: var(--gl-export-range-thumb);
		border: 2px solid var(--gl-export-primary-foreground);
		border-radius: 50%;
		background: var(--gl-export-primary);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-export-shadow-color) 35%, transparent);
	}

	.gl-export-range__input:focus {
		outline: none;
	}

	.gl-export-range__input:focus-visible::-webkit-slider-thumb {
		box-shadow: 0 0 0 4px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-range__input:focus-visible::-moz-range-thumb {
		box-shadow: 0 0 0 4px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	/* every tick sits under the center of the thumb at that position */
	.gl-export-range__ticks {
		display: flex;
		justify-content: space-between;
		padding: 0 calc(var(--gl-export-range-thumb) / 2);
	}

	.gl-export-range__tick {
		display: flex;
		justify-content: center;
		width: 0;
		padding: 0;
		border: none;
		background: none;
		color: var(--gl-export-muted-foreground);
		font: inherit;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
	}

	.gl-export-range__tick:hover {
		color: var(--gl-export-foreground);
	}

	.gl-export-range__tick--active {
		color: var(--gl-export-primary);
		font-weight: 600;
	}
</style>
