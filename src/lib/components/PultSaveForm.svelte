<script lang="ts">
	import { enhance } from '$app/forms';
	import { applyToast, gateSubmit, schemaValidator } from '$lib/form-kit';
	import { createForm } from '$lib/tanstack-create-form';
	import type { Snippet } from 'svelte';
	import type { GenericSchema } from 'valibot';

	let {
		schema,
		defaults,
		action = '?/save',
		invalid = 'Doplň lístok.',
		children
	}: {
		schema: GenericSchema;
		defaults: Record<string, unknown>;
		action?: string;
		invalid?: string;
		children: Snippet<[{ form: any }]>;
	} = $props();

	const form = createForm(() => ({
		defaultValues: defaults,
		validators: {
			onSubmit: schemaValidator(schema)
		}
	}));
</script>

<form
	class="pult-form"
	method="POST"
	{action}
	novalidate
	use:enhance={applyToast()}
	onsubmit={(event) => gateSubmit(form, event, invalid)}
>
	{@render children({ form })}
</form>
