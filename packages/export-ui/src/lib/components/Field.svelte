<!-- Settings row: an icon and a label, then the control -->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** added as `gl-export-field--{name}` and used in the class name of the icon */
		name: string;
		icon: LucideIcon;
		label: string;
		/** id of the control the label is for */
		id?: string;
		/** added as `gl-export-field--{modifier}`; `switch` puts the control on the line of the label */
		modifiers?: string[];
		hidden?: boolean;
		/** shown at the end of the label, such as the value of a slider */
		value?: string;
		/** the control */
		children: Snippet;
	}

	let { name, icon, label, id, modifiers = [], hidden = false, value, children }: Props = $props();
</script>

<div
	class={[
		'gl-export-field',
		`gl-export-field--${name}`,
		...modifiers.map((modifier) => `gl-export-field--${modifier}`)
	]}
	{hidden}
>
	<label class="gl-export-field__label" for={id}>
		<Icon {icon} {name} />
		<span>{label}</span>
		{#if value !== undefined}
			<span class="gl-export-field__value">{value}</span>
		{/if}
	</label>
	<div class="gl-export-field__control">
		{@render children()}
	</div>
</div>

<style>
	.gl-export-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gl-export-field[hidden] {
		display: none;
	}

	.gl-export-field__label {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--gl-export-foreground);
		font-weight: 500;
	}

	.gl-export-field__label :global(.gl-export-icon) {
		color: var(--gl-export-muted-foreground);
	}

	.gl-export-field__control {
		display: flex;
		min-width: 0;
	}

	/* a switch sits on the same line as its label */
	.gl-export-field--switch {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	/* the label fills the row, so a click between the text and the switch toggles it */
	.gl-export-field--switch .gl-export-field__label {
		flex: 1;
		align-self: stretch;
		cursor: pointer;
	}

	/* value shown at the end of a field label, e.g. the DPI */
	.gl-export-field__value {
		margin-left: auto;
		color: var(--gl-export-primary);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
</style>
