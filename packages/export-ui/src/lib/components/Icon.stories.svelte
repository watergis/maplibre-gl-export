<script module lang="ts">
	import { Compass, Download, File, Printer } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Icon from './Icon.svelte';

	const { Story } = defineMeta({
		title: 'Components/Icon',
		component: Icon,
		tags: ['autodocs'],
		args: { icon: Printer, name: 'title' }
	});
</script>

{#snippet template(args: Parameters<typeof Icon>[1])}
	<Icon {...args} />
{/snippet}

<Story name="Title" {template} />
<Story name="Page size" {template} args={{ icon: File, name: 'pageSize' }} />
<Story name="North icon" {template} args={{ icon: Compass, name: 'northIcon' }} />
<Story name="Save" {template} args={{ icon: Download, name: 'save' }} />
