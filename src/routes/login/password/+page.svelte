<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import PassSecret from '$lib/components/PassSecret.svelte';
	import { newPasswordSchema, type FieldErrors } from '$lib/auth-fields';
	import { applyToast, fieldIssue, gateSubmit } from '$lib/form-kit';
	import { createForm } from '$lib/tanstack-create-form';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let submitted = $state(false);

	const slip = createForm(() => ({
		defaultValues: {
			password: '',
			confirm: ''
		},
		validators: {
			onSubmit: newPasswordSchema
		}
	}));

	function shown(name: keyof FieldErrors, issues: unknown[]) {
		if (submitted) return fieldIssue(issues[0]) || undefined;
		return form && 'errors' in form ? form.errors?.[name] : undefined;
	}

	function check(event: SubmitEvent) {
		submitted = true;
		gateSubmit(slip, event, 'Doplň heslo.');
	}
</script>

<Seo
	title="Nové heslo"
	description="Nastav si nové heslo k čitateľskému účtu SPŠT knižnice."
	index={false}
/>

<AuthPass
	kicker="Nové heslo"
	title="Nový odtlačok."
	lede="Odkaz z e-mailu ťa sem priviedol. Zadaj heslo dvakrát — písmeno, číslica, aspoň osem znakov."
	serial="NOVÉ HESLO · 8+"
	facts={['aspoň 8 znakov', 'dvakrát rovnaké', 'potom Moje knihy']}
>
	<form
		method="POST"
		use:enhance={applyToast({ resetOn: (result) => result.type === 'success' })}
		class="pass-form"
		novalidate
		onsubmit={check}
	>
		<slip.Field name="password">
			{#snippet children(field)}
				<PassSecret
					id="password"
					label="Nové heslo"
					autocomplete="new-password"
					value={field.state.value}
					onValue={field.handleChange}
					onBlur={field.handleBlur}
					error={shown('password', field.state.meta.errors)}
					meter
				/>
			{/snippet}
		</slip.Field>
		<slip.Field name="confirm">
			{#snippet children(field)}
				<PassSecret
					id="confirm"
					name="confirm"
					label="Znova"
					autocomplete="new-password"
					value={field.state.value}
					onValue={field.handleChange}
					onBlur={field.handleBlur}
					error={shown('confirm', field.state.meta.errors)}
				/>
			{/snippet}
		</slip.Field>
		{#if form?.message}
			<p class="pass-note">{form.message}</p>
		{/if}
		<button class="pass-go" type="submit" disabled={!data.configured}>Uložiť heslo</button>
	</form>
</AuthPass>
