<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import PassSecret from '$lib/components/PassSecret.svelte';
	import { hasFieldErrors, validateNewPassword, type FieldErrors } from '$lib/auth-fields';

	let { data, form }: PageProps & { form: ActionData } = $props();

	let password = $state('');
	let confirm = $state('');
	let submitted = $state(false);

	const errors = $derived.by((): FieldErrors => {
		const next = validateNewPassword({ password, confirm });
		if (!submitted) return form && 'errors' in form ? (form.errors ?? {}) : {};
		return next;
	});

	function check(event: SubmitEvent) {
		submitted = true;
		if (hasFieldErrors(validateNewPassword({ password, confirm }))) event.preventDefault();
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
	<form method="POST" use:enhance class="pass-form" novalidate onsubmit={check}>
		<PassSecret
			id="password"
			label="Nové heslo"
			autocomplete="new-password"
			bind:value={password}
			error={errors.password}
			meter
		/>
		<PassSecret
			id="confirm"
			name="confirm"
			label="Znova"
			autocomplete="new-password"
			bind:value={confirm}
			error={errors.confirm}
		/>
		{#if form?.message}
			<p class="pass-note">{form.message}</p>
		{/if}
		<button class="pass-go" type="submit" disabled={!data.configured}>Uložiť heslo</button>
	</form>
</AuthPass>
