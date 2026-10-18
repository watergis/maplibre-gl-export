<!-- Radio buttons styled as a segmented control -->
<script lang="ts" generics="T extends string">
	import type { LucideIcon } from '@lucide/svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** name of the radio buttons */
		name: string;
		/** accessible name of the group */
		label: string;
		/** options; the value is also used in the class name of the icon */
		choices: { value: T; label: string; icon?: LucideIcon }[];
		/** checked option */
		value: T;
		/** smaller options, for long lists */
		compact?: boolean;
		/** called with the value of the option the user checked */
		onchange?: (value: T) => void;
	}

	let { name, label, choices, value = $bindable(), compact = false, onchange }: Props = $props();
</script>

<div
	class={['gl-export-segmented', compact && 'gl-export-segmented--compact']}
	role="radiogroup"
	aria-label={label}
>
	{#each choices as choice (choice.value)}
		<label class="gl-export-segmented__option">
			<input
				class="gl-export-segmented__input"
				type="radio"
				{name}
				value={choice.value}
				checked={value === choice.value}
				onchange={(event) => {
					if (!event.currentTarget.checked) return;
					value = choice.value;
					onchange?.(choice.value);
				}}
			/>
			{#if choice.icon}
				<Icon icon={choice.icon} name={choice.value} />
			{/if}
			<span class="gl-export-segmented__label">{choice.label}</span>
		</label>
	{/each}
</div>

<style>
	.gl-export-segmented {
		display: flex;
		width: 100%;
		padding: 3px;
		gap: 3px;
		border: 1px solid var(--gl-export-input);
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-muted);
	}

	.gl-export-segmented__option {
		--gl-export-icon-size: 16px;
		position: relative;
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 30px;
		border-radius: calc(var(--gl-export-radius-sm) - 2px);
		color: var(--gl-export-muted-foreground);
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.gl-export-segmented__option:hover {
		color: var(--gl-export-foreground);
	}

	.gl-export-segmented__option:has(.gl-export-segmented__input:checked) {
		background: var(--gl-export-primary);
		color: var(--gl-export-primary-foreground);
		box-shadow: 0 1px 3px color-mix(in oklch, var(--gl-export-shadow-color) 15%, transparent);
	}

	.gl-export-segmented__option:has(.gl-export-segmented__input:focus-visible) {
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-segmented__input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	/* many short options, e.g. the formats */
	.gl-export-segmented--compact {
		gap: 2px;
	}

	.gl-export-segmented--compact .gl-export-segmented__option {
		/* longer labels, e.g. GEOTIFF, take more room */
		flex: 1 1 auto;
		min-width: 0;
		padding: 0 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.gl-export-segmented--compact .gl-export-segmented__label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
