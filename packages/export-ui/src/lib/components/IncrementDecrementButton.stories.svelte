<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import IncrementDecrementButton from './IncrementDecrementButton.svelte';

	const { Story } = defineMeta({
		title: 'Components/IncrementDecrementButton',
		component: IncrementDecrementButton,
		tags: ['autodocs'],
		args: {
			labels: { decrement: 'Zoom out', reset: 'Reset zoom to 100%', increment: 'Zoom in' },
			text: '100%',
			canDecrement: true,
			canIncrement: true,
			ondecrement: fn(),
			onreset: fn(),
			onincrement: fn()
		}
	});
</script>

{#snippet template(args: Parameters<typeof IncrementDecrementButton>[1])}
	<IncrementDecrementButton {...args} />
{/snippet}

<Story name="Default" {template} />
<Story name="Smallest zoom" {template} args={{ text: '50%', canDecrement: false }} />
<Story name="Largest zoom" {template} args={{ text: '300%', canIncrement: false }} />
