<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import PassSecret from '$lib/components/PassSecret.svelte';
	import { signInSchema, signUpSchema, type FieldErrors } from '$lib/auth-fields';
	import { applyToast, fieldIssue, gateSubmit, schemaValidator } from '$lib/form-kit';
	import { createForm } from '$lib/tanstack-create-form';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const register = $derived(form?.mode === 'novy' || data.mode === 'novy');
	const noteOk = $derived(Boolean(form && 'ok' in form && form.ok));
	const seeded = $derived.by(() => {
		const values = form && 'values' in form ? form.values : undefined;
		if (!values) return { name: '', email: '' };
		return {
			name: 'name' in values && typeof values.name === 'string' ? values.name : '',
			email: typeof values.email === 'string' ? values.email : ''
		};
	});

	let submitted = $state(false);

	const slip = createForm(() => ({
		defaultValues: {
			name: seeded.name,
			email: seeded.email,
			password: '',
			confirm: ''
		},
		validators: {
			onSubmit: schemaValidator(register ? signUpSchema : signInSchema)
		}
	}));

	function shown(name: keyof FieldErrors, issues: unknown[]) {
		if (noteOk) return undefined;
		if (submitted) return fieldIssue(issues[0]) || undefined;
		return form && 'errors' in form ? form.errors?.[name] : undefined;
	}

	function check(event: SubmitEvent) {
		submitted = true;
		gateSubmit(slip, event, 'Doplň preukaz.');
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
		{#if register}
			<slip.Field name="name">
				{#snippet children(field)}
					{@const err = shown('name', field.state.meta.errors)}
					<div class="pass-field" class:is-bad={Boolean(err)}>
						<label for="name">Meno</label>
						<input
							id="name"
							name={field.name}
							autocomplete="name"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(event) => field.handleChange(event.currentTarget.value)}
							maxlength={80}
							aria-invalid={err ? 'true' : undefined}
							aria-describedby={err ? 'name-chyba' : undefined}
						/>
						{#if err}
							<p class="pass-error" id="name-chyba">{err}</p>
						{/if}
					</div>
				{/snippet}
			</slip.Field>
		{/if}
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
		{#if !noteOk}
			<slip.Field name="password">
				{#snippet children(field)}
					<PassSecret
						id="password"
						label="Heslo"
						autocomplete={register ? 'new-password' : 'current-password'}
						value={field.state.value}
						onValue={field.handleChange}
						onBlur={field.handleBlur}
						error={shown('password', field.state.meta.errors)}
						meter={register}
					/>
				{/snippet}
			</slip.Field>
			{#if register}
				<slip.Field name="confirm">
					{#snippet children(field)}
						<PassSecret
							id="confirm"
							name="confirm"
							label="Heslo znova"
							autocomplete="new-password"
							value={field.state.value}
							onValue={field.handleChange}
							onBlur={field.handleBlur}
							error={shown('confirm', field.state.meta.errors)}
						/>
					{/snippet}
				</slip.Field>
			{/if}
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
		{#if noteOk}
			<a class="pass-back" href={resolve('/login')}>Späť na prihlásenie</a>
		{:else}
			<button class="pass-go" type="submit" disabled={!data.configured}>
				{register ? 'Vytvoriť preukaz' : 'Prihlásiť sa'}
			</button>
		{/if}
	</form>
</AuthPass>
