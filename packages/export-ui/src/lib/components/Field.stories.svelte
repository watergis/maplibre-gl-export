<script module lang="ts">
	import { File, Proportions, RulerDimensionLine } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Field from './Field.svelte';
	import Select from './Select.svelte';
	import Slider from './Slider.svelte';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/Field',
		component: Field,
		tags: ['autodocs']
	});
</script>

<Story name="With a select" asChild>
	<Field name="pageSize" icon={File} label="Page Size" id="story-page-size">
		<Select
			id="story-page-size"
			name="page-size"
			options={[
				{ label: 'A4', value: 'A4' },
				{ label: 'A3', value: 'A3' }
			]}
			value="A4"
		/>
	</Field>
</Story>

<Story name="With a switch" asChild>
	<Field
		name="scalebar"
		icon={RulerDimensionLine}
		label="Scale bar"
		id="story-scalebar"
		modifiers={['switch']}
	>
		<Switch id="story-scalebar" name="scalebar" checked />
	</Field>
</Story>

<Story name="With a value" asChild>
	<Field name="dpi" icon={Proportions} label="DPI" id="story-dpi" value="300">
		<Slider id="story-dpi" name="dpi" values={[72, 96, 200, 300, 400]} value={300} />
	</Field>
</Story>
