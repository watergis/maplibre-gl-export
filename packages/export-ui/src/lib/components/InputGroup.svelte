<!-- Input with a trailing addon, such as a unit or a file extension -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		type: 'text' | 'number';
		value: string;
		/** text shown after the input, such as a unit */
		addon?: string;
		/** the input element, e.g. to report its validity */
		input?: HTMLInputElement;
		/** called on every keystroke */
		oninput?: (value: string) => void;
		/** called when the user commits the value (blur or Enter) */
		onchange?: (value: string) => void;
	}

	let {
		id,
		name,
		type,
		value = $bindable(),
		addon,
		input = $bindable(),
		oninput,
		onchange
	}: Props = $props();
</script>

<div class="gl-export-input-group">
	{#if type === 'number'}
		<input
			bind:this={input}
			class="gl-export-input"
			type="number"
			min="1"
			step="1"
			required
			inputmode="decimal"
			{id}
			{name}
			{value}
			oninput={(event) => {
				value = event.currentTarget.value;
				oninput?.(value);
			}}
			onchange={() => onchange?.(value)}
		/>
	{:else}
		<input
			bind:this={input}
			class="gl-export-input"
			type="text"
			spellcheck="false"
			autocomplete="off"
			{id}
			{name}
			{value}
			oninput={(event) => {
				value = event.currentTarget.value;
				oninput?.(value);
			}}
			onchange={() => onchange?.(value)}
		/>
	{/if}
	<span class="gl-export-input-addon">{addon ?? ''}</span>
</div>

<style>
	.gl-export-input-group {
		display: flex;
		width: 100%;
	}

	.gl-export-input {
		flex: 1;
		width: 100%;
		min-width: 0;
		height: 36px;
		padding: 0 10px;
		border: 1px solid var(--gl-export-input);
		border-radius: var(--gl-export-radius-sm) 0 0 var(--gl-export-radius-sm);
		background-color: var(--gl-export-input-background);
		color: var(--gl-export-foreground);
		font: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.gl-export-input:hover {
		border-color: var(--gl-export-muted-foreground);
	}

	.gl-export-input:focus {
		border-color: var(--gl-export-primary);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-input:invalid {
		border-color: var(--gl-export-destructive);
	}

	.gl-export-input-addon {
		display: inline-flex;
		flex: none;
		align-items: center;
		padding: 0 10px;
		border: 1px solid var(--gl-export-input);
		border-left: none;
		border-radius: 0 var(--gl-export-radius-sm) var(--gl-export-radius-sm) 0;
		background: var(--gl-export-muted);
		color: var(--gl-export-muted-foreground);
		font-size: 13px;
	}
</style>
