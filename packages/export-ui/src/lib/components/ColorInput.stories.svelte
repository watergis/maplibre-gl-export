<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import ColorInput from './ColorInput.svelte';

	const { Story } = defineMeta({
		title: 'Components/ColorInput',
		component: ColorInput,
		tags: ['autodocs'],
		args: { id: 'story-color', name: 'north-icon-color', value: '#000000', onchange: fn() }
	});
</script>

{#snippet template(args: Parameters<typeof ColorInput>[1])}
	<!-- the input is named by the label of its field in the dialog -->
	<label for={args.id}>Icon color</label>
	<ColorInput {...args} />
{/snippet}

<Story name="Default" {template} />
<Story name="Colored" {template} args={{ value: '#dc2626' }} />
<Story name="Disabled" {template} args={{ disabled: true }} />
