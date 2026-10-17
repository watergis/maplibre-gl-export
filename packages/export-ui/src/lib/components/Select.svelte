<!-- Dropdown list -->
<script lang="ts">
	interface Props {
		id: string;
		name: string;
		options: { label: string; value: string }[];
		value: string;
		onchange?: (value: string) => void;
	}

	let { id, name, options, value = $bindable(), onchange }: Props = $props();
</script>

<select
	class="gl-export-select"
	{id}
	{name}
	{value}
	onchange={(event) => {
		value = event.currentTarget.value;
		onchange?.(value);
	}}
>
	{#each options as option (option.value)}
		<option value={option.value} selected={option.value === value}>{option.label}</option>
	{/each}
</select>

<style>
	.gl-export-select {
		width: 100%;
		min-width: 0;
		height: 36px;
		padding: 0 32px 0 10px;
		border: 1px solid var(--gl-export-border);
		border-radius: var(--gl-export-radius-sm);
		background-color: var(--gl-export-input-bg);
		background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-position: right 10px center;
		background-repeat: no-repeat;
		background-size: 16px;
		color: var(--gl-export-fg);
		font: inherit;
		appearance: none;
		cursor: pointer;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.gl-export-select:hover {
		border-color: var(--gl-export-muted);
	}

	.gl-export-select:focus {
		border-color: var(--gl-export-accent);
		outline: none;
		box-shadow: 0 0 0 3px var(--gl-export-focus);
	}

	.gl-export-select:invalid {
		border-color: var(--gl-export-danger);
	}
</style>
