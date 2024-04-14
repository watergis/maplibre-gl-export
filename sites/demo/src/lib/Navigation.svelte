<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';

	import { getDrawerStore } from '@skeletonlabs/skeleton';

	const drawerStore = getDrawerStore();

	const drawerClose = () => {
		drawerStore.close();
	};
</script>

<nav class="list-nav p-4">
	<ul>
		<li><a href="/" on:click={drawerClose}>Homepage</a></li>
		<li>
			<a href="https://twitter.com/j_igarashi" target="_blank" on:click={drawerClose}> Twitter </a>
		</li>
		<li>
			<a
				href="https://github.com/watergis/maplibre-gl-export"
				target="_blank"
				on:click={drawerClose}
			>
				GitHub
			</a>
		</li>
		<li>
			<div class="flex items-center px-4">
				<span class="pr-4">Light/Dark switch</span>
				<span><LightSwitch /></span>
			</div>
		</li>
	</ul>
</nav>
