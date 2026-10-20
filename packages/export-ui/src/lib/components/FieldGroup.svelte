<!-- Box around the settings of the field above it, e.g. the symbol, colour and size of the north icon -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** added as `gl-export-field-group--{name}` */
		name: string;
		hidden?: boolean;
		/** the fields */
		children: Snippet;
	}

	let { name, hidden = false, children }: Props = $props();
</script>

<div class={['gl-export-field-group', `gl-export-field-group--${name}`]} {hidden}>
	{@render children()}
</div>

<style>
	.gl-export-field-group {
		--gl-export-icon-size: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: -4px;
		padding: 12px;
		border: 1px solid var(--gl-export-border);
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-muted);
		font-size: 13px;
	}

	.gl-export-field-group[hidden] {
		display: none;
	}

	.gl-export-field-group :global(.gl-export-field__label) {
		font-weight: 400;
	}
</style>
