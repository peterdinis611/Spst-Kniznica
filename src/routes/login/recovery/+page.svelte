<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import { hasFieldErrors, validateResetEmail, type FieldErrors } from '$lib/auth-fields';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const noteOk = $derived(Boolean(form && 'ok' in form && form.ok));

	let email = $state(data.email);
	let submitted = $state(false);

	$effect(() => {
		const values = form && 'values' in form ? form.values : undefined;
		if (values?.email) email = values.email;
	});

	const errors = $derived.by((): FieldErrors => {
		if (noteOk) return {};
		const next = validateResetEmail({ email });
		if (!submitted) return form && 'errors' in form ? (form.errors ?? {}) : {};
		return next;
	});

	function check(event: SubmitEvent) {
		submitted = true;
		if (hasFieldErrors(validateResetEmail({ email }))) event.preventDefault();
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
		use:enhance={() => {
			return async ({ result, update }) => {
				await update({ reset: result.type !== 'success' });
				if (result.type === 'success') submitted = false;
			};
		}}
		class="pass-form"
		novalidate
		onsubmit={check}
	>
		<div class="pass-field" class:is-bad={Boolean(errors.email)}>
			<label for="email">E-mail</label>
			<input
				id="email"
				type="email"
				name="email"
				autocomplete="email"
				bind:value={email}
				required
				maxlength={254}
				aria-invalid={errors.email ? 'true' : undefined}
				aria-describedby={errors.email ? 'email-chyba' : undefined}
			/>
			{#if errors.email}
				<p class="pass-error" id="email-chyba">{errors.email}</p>
			{/if}
		</div>
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
