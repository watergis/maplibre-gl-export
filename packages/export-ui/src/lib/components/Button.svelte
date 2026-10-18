<!-- Text button, with a leading icon which is replaced by a spinner while the button is busy -->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Icon from './Icon.svelte';
	import Spinner from './Spinner.svelte';

	interface Props {
		variant: 'primary' | 'secondary';
		icon?: LucideIcon;
		/** used in the class name of the icon */
		iconName?: string;
		label: string;
		title?: string;
		/** extra class name, without the `gl-export-` prefix */
		className?: string;
		/** show a spinner instead of the icon, e.g. while the map is exported */
		busy?: boolean;
		disabled?: boolean;
		/** the button element, e.g. to focus it */
		element?: HTMLButtonElement;
		onclick: () => void;
	}

	let {
		variant,
		icon,
		iconName = '',
		label,
		title,
		className,
		busy = false,
		disabled = false,
		element = $bindable(),
		onclick
	}: Props = $props();
</script>

<button
	bind:this={element}
	type="button"
	class={[
		'gl-export-btn',
		`gl-export-btn--${variant}`,
		className && `gl-export-${className}`,
		busy && 'gl-export-btn--busy'
	]}
	{title}
	{disabled}
	{onclick}
>
	{#if busy}
		<Spinner />
	{:else if icon}
		<Icon {icon} name={iconName} />
	{/if}
	<span class="gl-export-btn__label">{label}</span>
</button>

<style>
	.gl-export-btn {
		position: relative;
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 36px;
		padding: 0 14px;
		border: 1px solid transparent;
		border-radius: var(--gl-export-radius-sm);
		font: inherit;
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			opacity 0.15s;
	}

	.gl-export-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-btn:disabled {
		cursor: progress;
		opacity: 0.75;
	}

	.gl-export-btn--primary {
		min-width: 120px;
		background: var(--gl-export-primary);
		color: var(--gl-export-primary-foreground);
	}

	.gl-export-btn--primary:hover:not(:disabled) {
		background: color-mix(in oklch, var(--gl-export-primary) 90%, transparent);
	}

	.gl-export-btn--secondary {
		border-color: var(--gl-export-input);
		background: var(--gl-export-secondary);
		color: var(--gl-export-secondary-foreground);
	}

	.gl-export-btn--secondary:hover:not(:disabled) {
		background: color-mix(in oklch, var(--gl-export-secondary) 80%, transparent);
	}
</style>
