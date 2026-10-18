<!-- Toolbar shown over the map while the user adjusts the exported area -->
<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '../components/Button.svelte';
	import type { Translation } from '../interfaces';
	import '../theme.css';

	interface Props {
		translation: Translation;
		oncancel: () => void;
		ondone: () => void;
	}

	let { translation: t, oncancel, ondone }: Props = $props();
	let doneButton = $state<HTMLButtonElement>();

	onMount(() => doneButton?.focus());
</script>

<div class="gl-export-adjust-bar" role="toolbar" aria-label={t.AdjustArea}>
	<span class="gl-export-adjust-bar__hint">{t.AdjustAreaHint}</span>
	<div class="gl-export-adjust-bar__actions">
		<Button variant="secondary" label={t.Cancel} onclick={oncancel} />
		<Button bind:element={doneButton} variant="primary" label={t.Done} onclick={ondone} />
	</div>
</div>

<style>
	.gl-export-adjust-bar {
		position: absolute;
		bottom: 16px;
		left: 50%;
		z-index: 10;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 12px;
		box-sizing: border-box;
		width: max-content;
		max-width: calc(100% - 32px);
		padding: 10px 10px 10px 16px;
		border-radius: 999px;
		background: var(--gl-export-background);
		color: var(--gl-export-foreground);
		box-shadow: var(--gl-export-shadow);
		font-family: var(--gl-export-font);
		font-size: var(--gl-export-font-size);
		line-height: 1.4;
		transform: translateX(-50%);
		animation: fade-in 0.18s ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.gl-export-adjust-bar__hint {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.gl-export-adjust-bar__actions {
		display: flex;
		gap: 8px;
	}

	.gl-export-adjust-bar__actions :global(.gl-export-btn--primary) {
		min-width: 96px;
	}

	@media (max-width: 767px) {
		.gl-export-adjust-bar {
			border-radius: var(--gl-export-radius);
			padding: 12px;
		}
	}
</style>
