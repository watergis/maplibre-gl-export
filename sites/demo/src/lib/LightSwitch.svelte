<script lang="ts">
	import IconMoon from '@lucide/svelte/icons/moon';
	import IconSun from '@lucide/svelte/icons/sun';

	let checked = $state(false);

	const localStorageKey = 'light-dark-mode';

	$effect(() => {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		checked = prefersDark === true;
	});

	const onCheckedChange = (event: { checked: boolean }) => {
		const mode = event.checked ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem(localStorageKey, mode);
		checked = event.checked;
	};
</script>

<button
	type="button"
	class="btn hover:preset-tonal px-1 md:px-2"
	onclick={() => {
		checked = !checked;
		onCheckedChange({ checked });
	}}
>
	<span>
		{#if checked}
			<IconMoon />
		{:else}
			<IconSun />
		{/if}
	</span>
</button>
