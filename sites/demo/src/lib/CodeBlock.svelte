<script module lang="ts">
	import IconCopy from '@lucide/svelte/icons/copy';
	import IconCopyCheck from '@lucide/svelte/icons/copy-check';

	import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core';
	import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
	// Themes
	// https://shiki.style/themes
	import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
	// Languages
	// https://shiki.style/languages
	import console from 'shiki/langs/console.mjs';
	import css from 'shiki/langs/css.mjs';
	import html from 'shiki/langs/html.mjs';
	import js from 'shiki/langs/javascript.mjs';
	import { onMount } from 'svelte';

	interface CodeBlockProps {
		code?: string;
		lang?: 'console' | 'html' | 'css' | 'js';
		theme?: 'dark-plus';
		// Base Style Props
		base?: string;
		rounded?: string;
		shadow?: string;
		classes?: string;
		// Pre Style Props
		preBase?: string;
		prePadding?: string;
		preClasses?: string;
		showLineNumber?: boolean;
	}

	// https://shiki.style/guide/sync-usage
	let shiki: HighlighterCore | undefined = $state();
</script>

<script lang="ts">
	let {
		code = '',
		lang = 'console',
		theme = 'dark-plus',
		// Base Style Props
		base = 'overflow-y-hidden overflow-x-auto w-full',
		rounded = 'rounded-sm',
		shadow = '',
		classes = '',
		// Pre Style Props
		preBase = '',
		prePadding = '[&>pre]:p-4',
		preClasses = '',
		showLineNumber = true
	}: CodeBlockProps = $props();

	// Shiki convert to HTML
	let generatedHtml = $state('');

	let copied = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(code).then(() => {
			copied = true;
			clearTimeout(timeout);
			timeout = setTimeout(() => (copied = false), 2000);
		});
	};

	onMount(async () => {
		if (!shiki) {
			const engine = await createOnigurumaEngine(import('shiki/wasm'));
			shiki = createHighlighterCoreSync({
				engine: engine,
				// Implement your import theme.
				themes: [themeDarkPlus],
				// Implement your imported and supported languages.
				langs: [console, html, css, js]
			});
		}

		generatedHtml = shiki.codeToHtml(code, { lang, theme });
	});
</script>

<div
	class="relative group {base} {rounded} {shadow} {classes} {preBase} {prePadding} {preClasses}"
	class:showLine={showLineNumber}
>
	<button
		class="copy-button hover:bg-white/20 text-sm text-white px-2 py-1 rounded sticky top-[0.6em] right-[0.6em] float-right z-10 -mb-[2.5em]"
		class:chip={copied}
		onclick={copyToClipboard}
		title="Copy to clipboard"
	>
		{#if copied}
			<span>Copied</span>
			<IconCopyCheck></IconCopyCheck>
		{:else}
			<IconCopy></IconCopy>
		{/if}
	</button>

	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html generatedHtml}
</div>

<style lang="scss">
	.group {
		:global(.shiki) {
			width: 100%;
			overflow-x: auto;
			overflow-y: auto;
		}

		&.showLine {
			:global(code) {
				counter-reset: step;
				counter-increment: step 0;
			}

			:global(code .line::before) {
				content: counter(step);
				counter-increment: step;
				width: 1rem;
				margin-right: 1.5rem;
				display: inline-block;
				text-align: right;
				color: rgba(115, 138, 148, 0.4);
			}
		}
	}
</style>
