<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Slider from './Slider.svelte';
	import { DPI } from '../interfaces';

	const { Story } = defineMeta({
		title: 'Components/Slider',
		component: Slider,
		tags: ['autodocs'],
		args: {
			id: 'story-slider',
			name: 'dpi',
			values: Object.values(DPI),
			value: 300,
			valueText: (value: number) => `${value} DPI`,
			onchange: fn()
		}
	});
</script>

{#snippet template(args: Parameters<typeof Slider>[1])}
	<Slider {...args} />
{/snippet}

<Story name="DPI" {template} />
<Story name="Lowest value" {template} args={{ value: 72 }} />
