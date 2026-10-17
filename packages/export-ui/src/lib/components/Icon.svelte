<!--
	Lucide icon (https://lucide.dev/icons/).

	The SVG is wrapped in `<span class="gl-export-icon gl-export-icon--{name}">` so that an icon can
	be resized with `--gl-export-icon-size`, or replaced from CSS:
	  .gl-export-icon--pageSize svg { display: none; }
	  .gl-export-icon--pageSize { background-color: currentColor; mask: url('my-icon.svg') center / contain no-repeat; }
-->
<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';

	interface Props {
		/** Lucide icon component */
		icon: LucideIcon;
		/** used in the class name of the icon */
		name: string;
	}

	let { icon: IconComponent, name }: Props = $props();
</script>

<span class="gl-export-icon gl-export-icon--{name}" aria-hidden="true">
	<IconComponent aria-hidden="true" />
</span>

<style>
	.gl-export-icon {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: var(--gl-export-icon-size);
		height: var(--gl-export-icon-size);
	}

	.gl-export-icon :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
