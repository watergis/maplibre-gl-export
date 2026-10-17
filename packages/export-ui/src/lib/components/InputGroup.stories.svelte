<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import InputGroup from './InputGroup.svelte';

	const { Story } = defineMeta({
		title: 'Components/InputGroup',
		component: InputGroup,
		tags: ['autodocs'],
		argTypes: { type: { control: 'inline-radio', options: ['text', 'number'] } },
		args: {
			id: 'story-input',
			name: 'file-name',
			type: 'text',
			value: 'map',
			addon: '.pdf',
			oninput: fn(),
			onchange: fn()
		}
	});
</script>

{#snippet template(args: Parameters<typeof InputGroup>[1])}
	<!-- the input is named by the label of its field in the dialog -->
	<label for={args.id}>{args.type === 'number' ? 'Width' : 'File name'}</label>
	<InputGroup {...args} />
{/snippet}

<Story name="File name" {template} />
<Story
	name="Size in mm"
	{template}
	args={{ name: 'custom-width', type: 'number', value: '297', addon: 'mm' }}
/>
<Story name="Invalid size" {template} args={{ type: 'number', value: '0', addon: 'mm' }} />
