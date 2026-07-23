<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let exampleHtml = $state('');
	let failed = $state(false);

	onMount(async () => {
		const response = await fetch('/assets/maplibre-v5-cdn-example.txt');
		if (!response.ok) {
			failed = true;
			return;
		}

		const requestedLanguage = $page.url.searchParams.get('language') ?? 'en';
		const language = /^[a-z]{2}$/.test(requestedLanguage) ? requestedLanguage : 'en';

		exampleHtml = (await response.text())
			.replace(/{maplibreExportVersion}/g, 'latest')
			.replace(/{language}/g, language)
			.replace(/{style}/g, 'https://demotiles.maplibre.org/style.json');
	});
</script>

{#if failed}
	<p class="p-4">The MapLibre GL JS v5 demo could not be loaded.</p>
{:else if exampleHtml}
	<iframe class="h-full w-full border-0" title="MapLibre GL JS v5 demo" srcdoc={exampleHtml}
	></iframe>
{:else}
	<p class="p-4">Loading MapLibre GL JS v5 demo…</p>
{/if}
