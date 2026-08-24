<script lang="ts">
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

<form method="POST" action="?/delete" onsubmit={check}>
	{#each Object.entries(fields) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}
	<Button variant="destructive" size="sm" type="submit">{label}</Button>
</form>
