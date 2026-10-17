<script module lang="ts">
	import { Download, Move } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Button from './Button.svelte';

	const { Story } = defineMeta({
		title: 'Components/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			variant: { control: 'inline-radio', options: ['primary', 'secondary'] }
		},
		args: { variant: 'primary', icon: Download, iconName: 'save', label: 'Save', onclick: fn() }
	});
</script>

{#snippet template(args: Parameters<typeof Button>[1])}
	<Button {...args} />
{/snippet}

<Story name="Primary" {template} />
<Story
	name="Secondary"
	{template}
	args={{ variant: 'secondary', icon: Move, iconName: 'adjustArea', label: 'Adjust area on map' }}
/>
<Story name="Disabled" {template} args={{ disabled: true }} />
<!-- the save button is busy while the map is exported -->
<Story name="Busy" {template} args={{ busy: true, disabled: true }} />
<Story name="Text only" {template} args={{ icon: undefined, label: 'Done' }} />
