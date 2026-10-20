<!--
	Button showing the north icon, which opens a popup to choose it: a compass icon of Font-GIS or
	an SVG file of the user.
-->
<script lang="ts">
	import { FolderOpen } from '@lucide/svelte';
	import type { Translation } from '../interfaces';
	import {
		applyNorthIconColor,
		DEFAULT_NORTH_ICON_COLOR,
		NORTH_ICONS,
		readCustomNorthIcon
	} from '../north-icons/north-icons';
	import Icon from './Icon.svelte';

	interface Props {
		/** id of the button. The popup is `{id}-popup` */
		id: string;
		translation: Translation;
		/** accessible name of the button. default is `ChooseNorthIcon` */
		label?: string;
		/** SVG source of the north icon */
		image: string;
		/** the icon changed */
		onchange?: (image: string) => void;
	}

	let { id, translation: t, label, image = $bindable(), onchange }: Props = $props();

	let trigger = $state<HTMLButtonElement>();
	let popup = $state<HTMLDivElement>();
	let fileInput = $state<HTMLInputElement>();
	let error = $state('');

	const isPreset = $derived(NORTH_ICONS.some((icon) => icon.svg === image));

	/** The icons are always shown in the default colour, which stays visible whatever colour is chosen */
	const toDataUrl = (svg: string) =>
		`data:image/svg+xml;charset=utf-8,${encodeURIComponent(applyNorthIconColor(svg, DEFAULT_NORTH_ICON_COLOR))}`;

	const select = (svg: string) => {
		image = svg;
		error = '';
		onchange?.(image);
	};

	const onFileChange = async (event: Event & { currentTarget: HTMLInputElement }) => {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;
		const svg = readCustomNorthIcon(await file.text());
		if (svg) select(svg);
		else error = t.InvalidSvg;
	};

	/** The popup is in the top layer, so it is placed under the button by hand */
	const place = () => {
		if (!trigger || !popup) return;
		const margin = 8;
		const button = trigger.getBoundingClientRect();
		const { width, height } = popup.getBoundingClientRect();
		const left = Math.min(
			Math.max(margin, button.right - width),
			window.innerWidth - width - margin
		);
		// above the button when there is no room below it
		const below = button.bottom + 6;
		const top =
			below + height > window.innerHeight - margin
				? Math.max(margin, button.top - height - 6)
				: below;
		popup.style.left = `${left}px`;
		popup.style.top = `${top}px`;
	};

	const onToggle = (event: ToggleEvent) => {
		if (event.newState === 'open') {
			place();
			popup?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
		} else {
			error = '';
		}
	};
</script>

<button
	bind:this={trigger}
	{id}
	type="button"
	class="gl-export-north-icon-picker"
	title={t.ChooseNorthIcon}
	aria-label={label ?? t.ChooseNorthIcon}
	aria-haspopup="dialog"
	popovertarget="{id}-popup"
>
	<img src={toDataUrl(image)} alt="" />
</button>

<div
	bind:this={popup}
	id="{id}-popup"
	class="gl-export-north-icon-popup"
	popover="auto"
	role="dialog"
	aria-label={t.ChooseNorthIcon}
	ontoggle={onToggle}
>
	<div class="gl-export-north-icon-popup__grid">
		{#each NORTH_ICONS as icon (icon.name)}
			<button
				type="button"
				class="gl-export-north-icon-popup__option"
				title={icon.name}
				aria-label={icon.name}
				aria-pressed={icon.svg === image}
				onclick={() => select(icon.svg)}
			>
				<img src={toDataUrl(icon.svg)} alt="" />
			</button>
		{/each}
		{#if !isPreset}
			<button
				type="button"
				class="gl-export-north-icon-popup__option"
				title={t.Custom}
				aria-label={t.Custom}
				aria-pressed="true"
				onclick={() => select(image)}
			>
				<img src={toDataUrl(image)} alt="" />
			</button>
		{/if}
		<button
			type="button"
			class="gl-export-north-icon-popup__option gl-export-north-icon-popup__file"
			title={t.ChooseSvgFile}
			aria-label={t.ChooseSvgFile}
			onclick={() => fileInput?.click()}
		>
			<Icon icon={FolderOpen} name="chooseSvgFile" />
		</button>
	</div>
	<input
		bind:this={fileInput}
		type="file"
		accept=".svg,image/svg+xml"
		hidden
		onchange={onFileChange}
	/>
	{#if error}
		<p class="gl-export-north-icon-popup__error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.gl-export-north-icon-picker,
	.gl-export-north-icon-popup__option {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		margin: 0;
		padding: 0;
		border: 1px solid var(--gl-export-input);
		border-radius: var(--gl-export-radius-sm);
		background: var(--gl-export-input-background);
		color: var(--gl-export-foreground);
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}

	.gl-export-north-icon-picker:hover,
	.gl-export-north-icon-popup__option:hover {
		background: var(--gl-export-accent);
	}

	.gl-export-north-icon-picker:focus-visible,
	.gl-export-north-icon-popup__option:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklch, var(--gl-export-ring) 50%, transparent);
	}

	.gl-export-north-icon-picker {
		width: 30px;
		height: 30px;
	}

	.gl-export-north-icon-picker img {
		width: 20px;
		height: 20px;
	}

	.gl-export-north-icon-popup {
		position: fixed;
		inset: auto;
		width: 232px;
		margin: 0;
		padding: 12px;
		border: 1px solid var(--gl-export-border);
		border-radius: var(--gl-export-radius);
		background: var(--gl-export-background);
		box-shadow: var(--gl-export-shadow);
		color: var(--gl-export-foreground);
		font-family: var(--gl-export-font);
		font-size: var(--gl-export-font-size);
	}

	.gl-export-north-icon-popup__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.gl-export-north-icon-popup__option {
		width: auto;
		aspect-ratio: 1;
	}

	.gl-export-north-icon-popup__option img {
		width: 70%;
		height: 70%;
	}

	.gl-export-north-icon-popup__option[aria-pressed='true'] {
		border-color: var(--gl-export-primary);
		box-shadow: 0 0 0 1px var(--gl-export-primary);
	}

	.gl-export-north-icon-popup__file {
		border-style: dashed;
		color: var(--gl-export-muted-foreground);
	}

	.gl-export-north-icon-popup__error {
		margin: 8px 0 0;
		color: var(--gl-export-destructive);
		font-size: 12px;
	}
</style>
