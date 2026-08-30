<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import { resetEmailSchema, type FieldErrors } from '$lib/auth-fields';
	import { applyToast, fieldIssue, gateSubmit } from '$lib/form-kit';
	import { createForm } from '$lib/tanstack-create-form';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const noteOk = $derived(Boolean(form && 'ok' in form && form.ok));
	const seeded = $derived(form && 'values' in form ? form.values?.email : undefined);

	let submitted = $state(false);

	const slip = createForm(() => ({
		defaultValues: {
			email: seeded || data.email
		},
		validators: {
			onSubmit: resetEmailSchema
		}
	}));

	function shown(name: keyof FieldErrors, issues: unknown[]) {
		if (noteOk) return undefined;
		if (submitted) return fieldIssue(issues[0]) || undefined;
		return form && 'errors' in form ? form.errors?.[name] : undefined;
	}

	function check(event: SubmitEvent) {
		submitted = true;
		gateSubmit(slip, event, 'Doplň e-mail.');
	}
</script>

<Seo
	title="Zabudnuté heslo"
	description="Pošli si odkaz na obnovu hesla k čitateľskému účtu SPŠT knižnice."
	index={false}
/>

<AuthPass
	kicker="Obnova preukazu"
	title="Stratený odtlačok."
	lede="Napíš e-mail z registrácie. Ak účet existuje, príde odkaz. Heslo na pulte nehlásime."
	serial="OBNOVA · LEN E-MAIL"
	facts={['odkaz na e-mail', 'heslo na pulte nie', 'platnosť krátka']}
>
	<form
		method="POST"
		use:enhance={applyToast({
			resetOn: (result) => result.type !== 'success',
			after: (result) => {
				if (result.type === 'success') submitted = false;
			}
		})}
		class="pass-form"
		novalidate
		onsubmit={check}
	>
		<slip.Field name="email">
			{#snippet children(field)}
				{@const err = shown('email', field.state.meta.errors)}
				<div class="pass-field" class:is-bad={Boolean(err)}>
					<label for="email">E-mail</label>
					<input
						id="email"
						type="email"
						name={field.name}
						autocomplete="email"
						value={field.state.value}
						onblur={field.handleBlur}
						oninput={(event) => field.handleChange(event.currentTarget.value)}
						maxlength={254}
						aria-invalid={err ? 'true' : undefined}
						aria-describedby={err ? 'email-chyba' : undefined}
					/>
					{#if err}
						<p class="pass-error" id="email-chyba">{err}</p>
					{/if}
				</div>
			{/snippet}
		</slip.Field>
		{#if !data.configured}
			<p class="pass-note">
				Pult ešte nemá kľúč od skrine. Doplň kľúče do <code>.env</code>.
			</p>
		{:else if form?.message}
			<p class="pass-note" class:is-ok={noteOk}>{form.message}</p>
		{/if}
		<button class="pass-go" type="submit" disabled={!data.configured}>Poslať odkaz</button>
		<a class="pass-back" href={resolve('/login')}>Späť na prihlásenie</a>
	</form>
</AuthPass>
