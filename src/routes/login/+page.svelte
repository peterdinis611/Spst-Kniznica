<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import PassSecret from '$lib/components/PassSecret.svelte';
	import {
		hasFieldErrors,
		validateSignIn,
		validateSignUp,
		type FieldErrors
	} from '$lib/auth-fields';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const register = $derived(form?.mode === 'novy' || data.mode === 'novy');
	const noteOk = $derived(Boolean(form && 'ok' in form && form.ok));

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirm = $state('');
	let submitted = $state(false);

	$effect(() => {
		const values = form && 'values' in form ? form.values : undefined;
		if (values?.email) email = values.email;
		if (values?.name) name = values.name;
	});

	const errors = $derived.by((): FieldErrors => {
		if (submitted) {
			return register
				? validateSignUp({ name, email, password, confirm })
				: validateSignIn({ email, password });
		}
		return form && 'errors' in form ? (form.errors ?? {}) : {};
	});

	function check(event: SubmitEvent) {
		submitted = true;
		const next = register
			? validateSignUp({ name, email, password, confirm })
			: validateSignIn({ email, password });
		if (hasFieldErrors(next)) event.preventDefault();
	}
</script>

<Seo
	title={register ? 'Registrácia' : 'Prihlásenie'}
	description="Prihlás sa do školskej knižnice SPŠT a požičaj si knihy na 7, 14 alebo 21 dní."
	index={false}
/>

<AuthPass
	kicker="Čitateľský účet"
	title={register ? 'Nový preukaz.' : 'Polož preukaz.'}
	lede={register
		? 'Meno, e-mail, heslo (8+, písmeno a číslica). Ak fond potvrdzuje e-mail, najprv otvor odkaz v správe.'
		: 'E-mail a heslo. Potom môžeš brať knihy — 7, 14 alebo 21 dní, koľko treba.'}
	serial={register ? 'NOVÝ · PREUKAZ · SPŠT' : 'PREUKAZ · PAV. B · 7–21 D'}
>
	{#snippet tabs()}
		<a href={resolve('/login')} class:is-on={!register}>Mám účet</a>
		<a href="{resolve('/login')}?mod=novy" class:is-on={register}>Som nový</a>
	{/snippet}

	<form
		method="POST"
		action={register ? '?/signUp' : '?/signIn'}
		use:enhance
		class="pass-form"
		novalidate
		onsubmit={check}
	>
		{#if register}
			<div class="pass-field" class:is-bad={Boolean(errors.name)}>
				<label for="name">Meno</label>
				<input
					id="name"
					name="name"
					autocomplete="name"
					bind:value={name}
					required
					minlength={2}
					maxlength={80}
					aria-invalid={errors.name ? 'true' : undefined}
					aria-describedby={errors.name ? 'name-chyba' : undefined}
				/>
				{#if errors.name}
					<p class="pass-error" id="name-chyba">{errors.name}</p>
				{/if}
			</div>
		{/if}
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
		<PassSecret
			id="password"
			label="Heslo"
			autocomplete={register ? 'new-password' : 'current-password'}
			bind:value={password}
			error={errors.password}
			meter={register}
		/>
		{#if register}
			<PassSecret
				id="confirm"
				name="confirm"
				label="Heslo znova"
				autocomplete="new-password"
				bind:value={confirm}
				error={errors.confirm}
			/>
		{/if}
		{#if !register}
			<p class="pass-help">
				<a href={resolve('/login/recovery')}>Zabudnuté heslo?</a>
			</p>
		{/if}
		{#if !data.configured}
			<p class="pass-note">
				Pult ešte nemá kľúč od skrine. Doplň <code>PUBLIC_SUPABASE_URL</code> a kľúč do
				<code>.env</code>.
			</p>
		{:else if form?.message}
			<p class="pass-note" class:is-ok={noteOk}>{form.message}</p>
		{/if}
		<button class="pass-go" type="submit" disabled={!data.configured}>
			{register ? 'Vytvoriť preukaz' : 'Prihlásiť sa'}
		</button>
	</form>
</AuthPass>
