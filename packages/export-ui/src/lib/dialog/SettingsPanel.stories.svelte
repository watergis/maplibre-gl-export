<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { defaultDialogState, languageArgType } from '../../stories/defaults';
	import { Size, type ExportDialogState, type Language } from '../interfaces';
	import { getTranslation } from '../local';
	import '../theme.css';
	import SettingsPanel from './SettingsPanel.svelte';

	interface Args {
		language: Language;
		/** settings which differ from the defaults */
		initial?: Partial<ExportDialogState>;
		onpagelayoutchange?: (size: [number, number]) => void;
		onrenderchange?: () => void;
	}

	const { Story } = defineMeta({
		title: 'Dialog/SettingsPanel',
		parameters: { layout: 'centered' },
		argTypes: { language: languageArgType, initial: { control: 'object' } },
		args: { language: 'en', onpagelayoutchange: fn(), onrenderchange: fn() } as Args
	});
</script>

<script lang="ts">
	/** state edited by the panel, shown next to it */
	const createState = (initial?: Partial<ExportDialogState>) => {
		const created = $state<ExportDialogState>({ ...defaultDialogState(), ...initial });
		return created;
	};
</script>

<!-- the panel is recreated when the language changes, as the dialog is -->
{#snippet template(args: Args)}
	{#key [args.language, JSON.stringify(args.initial)].join()}
		{@const formState = createState(args.initial)}
		<div class="gl-export-theme demo">
			<!-- bound, as the dialog binds it, because the panel changes it -->
			<SettingsPanel
				idPrefix="story"
				translation={getTranslation(args.language)}
				sizes={{ ...Size }}
				bind:formState={() => formState, () => {}}
				onpagelayoutchange={args.onpagelayoutchange}
				onrenderchange={args.onrenderchange}
			/>
			<pre>{JSON.stringify(formState, null, 2)}</pre>
		</div>
	{/key}
{/snippet}

<Story name="Default" {template} />
<Story name="Custom size" {template} args={{ initial: { sizeValue: 'custom' } }} />
<Story name="Vector SVG" {template} args={{ initial: { format: 'svg', vector: true } }} />
<Story name="Japanese" {template} args={{ language: 'ja' }} />

<style>
	.demo {
		display: inline-flex;
		max-height: 90vh;
		overflow: hidden;
		border: 1px solid var(--gl-export-border);
		border-radius: var(--gl-export-radius);
		background: var(--gl-export-bg);
		color: var(--gl-export-fg);
		font-family: var(--gl-export-font);
		font-size: var(--gl-export-font-size);
		line-height: 1.4;
	}

	pre {
		width: 240px;
		margin: 0;
		padding: 20px;
		overflow: auto;
		border-left: 1px solid var(--gl-export-border);
		font-size: 12px;
	}
</style>
