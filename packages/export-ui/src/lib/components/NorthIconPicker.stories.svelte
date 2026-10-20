<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import en from '../local/en';
	import { DEFAULT_NORTH_ICON, NORTH_ICONS } from '../north-icons/north-icons';
	import NorthIconPicker from './NorthIconPicker.svelte';

	const { Story } = defineMeta({
		title: 'Components/NorthIconPicker',
		component: NorthIconPicker,
		tags: ['autodocs'],
		args: {
			id: 'story-north-icon',
			translation: en,
			image: DEFAULT_NORTH_ICON,
			onchange: fn()
		}
	});

	const customIcon =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2 5 22l7-5 7 5z" fill="#d97706"/></svg>';
</script>

<Story name="Default" />
<Story name="Compass rose" args={{ image: NORTH_ICONS[5].svg }} />
<Story name="Custom SVG" args={{ image: customIcon }} />
