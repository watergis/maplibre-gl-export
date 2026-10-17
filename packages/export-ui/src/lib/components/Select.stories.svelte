<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Select from './Select.svelte';
	import { Size } from '../interfaces';

	const { Story } = defineMeta({
		title: 'Components/Select',
		component: Select,
		tags: ['autodocs'],
		args: {
			id: 'story-select',
			name: 'page-size',
			options: Object.keys(Size).map((name) => ({ label: name, value: name })),
			value: 'A4',
			onchange: fn()
		}
	});
</script>

{#snippet template(args: Parameters<typeof Select>[1])}
	<Select {...args} />
{/snippet}

<Story name="Page size" {template} />
