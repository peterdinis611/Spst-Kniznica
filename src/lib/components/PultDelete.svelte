<script lang="ts">
	import { enhance } from '$app/forms';
	import { applyToast } from '$lib/form-kit';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		fields,
		label = 'Zmazať',
		ask = 'Zmazať tento lístok z kartotéky?'
	}: {
		fields: Record<string, string>;
		label?: string;
		ask?: string;
	} = $props();

	function check(event: SubmitEvent) {
		if (!confirm(ask)) event.preventDefault();
	}
</script>

<form method="POST" action="?/delete" use:enhance={applyToast()} onsubmit={check}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	<Button variant="destructive" size="sm" type="submit">{label}</Button>
</form>
