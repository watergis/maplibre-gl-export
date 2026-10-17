<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/Switch',
		component: Switch,
		tags: ['autodocs'],
		args: { id: 'story-switch', name: 'scalebar', checked: true, onchange: fn() }
	});
</script>

{#snippet template(args: Parameters<typeof Switch>[1])}
	<!-- the switch is named by the label of its field in the dialog -->
	<label for={args.id}>Scale bar</label>
	<Switch {...args} />
{/snippet}

<Story name="Checked" {template} />
<Story name="Unchecked" {template} args={{ checked: false }} />
