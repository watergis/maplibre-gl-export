<script module lang="ts">
	import { Compass, Scaling, Shapes } from '@lucide/svelte';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Field from './Field.svelte';
	import FieldGroup from './FieldGroup.svelte';
	import Select from './Select.svelte';
	import Slider from './Slider.svelte';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/FieldGroup',
		component: FieldGroup,
		tags: ['autodocs']
	});
</script>

<Story name="Under a switch" asChild>
	<div style="display: flex; flex-direction: column; gap: 14px; width: 300px;">
		<Field
			name="northIcon"
			icon={Compass}
			label="North icon"
			id="story-north-icon"
			modifiers={['switch']}
		>
			<Switch id="story-north-icon" name="north-icon" checked />
		</Field>
		<FieldGroup name="northIcon">
			<Field
				name="northIconSymbol"
				icon={Shapes}
				label="Icon symbol"
				id="story-north-icon-symbol"
				modifiers={['inline']}
			>
				<Select
					id="story-north-icon-symbol"
					name="north-icon-symbol"
					options={[
						{ label: 'Arrow', value: 'arrow' },
						{ label: 'Compass', value: 'compass' }
					]}
					value="arrow"
				/>
			</Field>
			<Field
				name="northIconSize"
				icon={Scaling}
				label="Icon size"
				id="story-north-icon-size"
				value="100%"
			>
				<Slider
					id="story-north-icon-size"
					name="north-icon-size"
					values={[50, 75, 100, 150, 200]}
					value={100}
					valueText={(value) => `${value}%`}
					ticks={false}
				/>
			</Field>
		</FieldGroup>
	</div>
</Story>
