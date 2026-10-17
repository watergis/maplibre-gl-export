<script module lang="ts">
	import { RectangleHorizontal, RectangleVertical } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import SegmentedButton from './SegmentedButton.svelte';
	import { Format } from '../interfaces';

	const { Story } = defineMeta({
		title: 'Components/SegmentedButton',
		component: SegmentedButton,
		tags: ['autodocs'],
		args: {
			name: 'orientation',
			label: 'Page Orientation',
			choices: [
				{ value: 'landscape', icon: RectangleHorizontal, label: 'Landscape' },
				{ value: 'portrait', icon: RectangleVertical, label: 'Portrait' }
			],
			value: 'landscape',
			onchange: fn()
		}
	});
</script>

{#snippet template(args: Parameters<typeof SegmentedButton<string>>[1])}
	<SegmentedButton {...args} />
{/snippet}

<Story name="With icons" {template} />
<Story
	name="Compact"
	{template}
	args={{
		name: 'format',
		label: 'Format',
		choices: Object.entries(Format).map(([label, value]) => ({ label, value })),
		value: Format.PDF,
		compact: true
	}}
/>
