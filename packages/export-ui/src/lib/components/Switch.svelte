<!-- Checkbox styled as a switch -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		checked: boolean;
		onchange?: (checked: boolean) => void;
	}

	let { id, name, checked = $bindable(), onchange }: Props = $props();
</script>

<input
	class="gl-export-switch"
	type="checkbox"
	role="switch"
	{id}
	{name}
	{checked}
	onchange={(event) => {
		checked = event.currentTarget.checked;
		onchange?.(checked);
	}}
/>

<style>
	.gl-export-switch {
		position: relative;
		flex: none;
		width: 38px;
		height: 22px;
		margin: 0;
		border-radius: 11px;
		background: var(--gl-export-border);
		appearance: none;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.gl-export-switch::before {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.3);
		content: '';
		transition: transform 0.15s;
	}

	.gl-export-switch:checked {
		background: var(--gl-export-accent);
	}

	.gl-export-switch:checked::before {
		transform: translateX(16px);
	}

	.gl-export-switch:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px var(--gl-export-focus);
	}
</style>
