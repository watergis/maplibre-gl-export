<script lang="ts">
	import '../../app.postcss';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';

	// Highlight JS
	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import shell from 'highlight.js/lib/languages/shell';
	import type { PageData } from './$types';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	storeHighlightJs.set(hljs);

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta property="og:site_name" content={data.site_name} />
	<meta property="og:type" content="article" />
	<meta name="description" content={data.site_description} />
	<meta property="og:description" content={data.site_description} />
	<meta name="twitter:description" content={data.site_description} />
	<meta property="og:title" content={data.title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.title} />
</svelte:head>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">Maplibre/Mapbox GL Export</strong>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<a
					class="btn btn-sm variant-ghost-surface"
					href="https://twitter.com/j_igarashi"
					target="_blank"
					rel="noreferrer"
				>
					Twitter
				</a>
				<a
					class="btn btn-sm variant-ghost-surface"
					href="https://github.com/watergis/maplibre-gl-export"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />

	<svelte:fragment slot="footer">
		<div class="space-y-2 py-4">
			<p class="flex justify-center space-x-2">Maplibre/Mapbox GL Export by JinIgarashi.</p>
			<p class="flex justify-center space-x-2">The source code is licensed MIT.</p>
			<p class="flex justify-center space-x-2">The website content is licensed CC BY NC SA 4.0.</p>
		</div>
	</svelte:fragment>
</AppShell>
