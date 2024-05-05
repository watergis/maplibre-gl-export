<script lang="ts">
	import {
		LANGUAGE_CONTEXT_KEY,
		MAPSTORE_CONTEXT_KEY,
		createLanguageStore,
		createMapStore
	} from '$lib/stores';
	import { onMount, setContext } from 'svelte';
	import LanguageSelector from '$lib/LanguageSelector.svelte';
	import { page } from '$app/stores';
	import type { Language } from '@watergis/maplibre-gl-export';

	const mapStore = createMapStore();
	setContext(MAPSTORE_CONTEXT_KEY, mapStore);

	const languageStore = createLanguageStore();
	setContext(LANGUAGE_CONTEXT_KEY, languageStore);

	onMount(()=>{
		const lang =  $page.url.searchParams.get('language') as Language ?? 'en';
		languageStore.set(lang)
	})
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.3/gh-fork-ribbon.min.css"
	/>

	<style>
		html,
		body {
			padding: 0;
			margin: 0;
		}
	</style>
</svelte:head>

<a
	class="github-fork-ribbon left-top"
	href="https://github.com/watergis/maplibre-gl-export"
	data-ribbon="Fork me on GitHub"
	title="Fork me on GitHub">Fork me on GitHub</a
>

<slot />

{#if $mapStore}
	<LanguageSelector bind:map={$mapStore} bind:language={$languageStore} position="bottom-left" />
{/if}
