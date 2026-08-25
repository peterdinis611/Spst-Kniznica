<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
	import { ROLE_LABELS } from '$lib/ability';
	import { firstName, loanedLabel, readerNumber } from '$lib/format';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const serial = $derived(readerNumber(data.reader.id));
	const given = $derived(firstName(data.reader.name));
	const stamp = $derived(ROLE_LABELS[data.reader.role]);
</script>

<Seo
	title="Môj profil"
	description="Čitateľský preukaz školskej knižnice SPŠT — meno, e-mail a číslo preukazu."
	index={false}
/>

<AuthPass
	kicker="Môj profil"
	title="Tvoj preukaz."
	lede="{given}, toto je lístok účtu. Výpožičky ostávajú na Moje knihy. Heslo meníš odkazom z pošty."
	serial="PREUKAZ {serial} · PAV. B"
	facts={[stamp, loanedLabel(data.activeCount), 'pav. B']}
>
	<dl class="profile-ledger">
		<div>
			<dt>Meno</dt>
			<dd>{data.reader.name}</dd>
		</div>
		<div>
			<dt>E-mail</dt>
			<dd>{data.reader.email}</dd>
		</div>
		<div>
			<dt>Číslo</dt>
			<dd class="profile-no">{serial}</dd>
		</div>
		<div>
			<dt>Pečiatka</dt>
			<dd>{stamp}</dd>
		</div>
		<div>
			<dt>Vonku</dt>
			<dd>{loanedLabel(data.activeCount)}</dd>
		</div>
	</dl>

	<div class="profile-actions">
		<a class="profile-go" href={resolve('/loans')}>Moje knihy</a>
		<form method="POST" action="?/recover" use:enhance>
			<button class="profile-ghost" type="submit">Nové heslo</button>
		</form>
		{#if data.admin}
			<a class="profile-ghost" href={resolve('/admin')}>Pult</a>
		{/if}
	</div>
	{#if form?.message}
		<p class="pass-note" class:is-ok={'ok' in form && form.ok}>{form.message}</p>
	{/if}
</AuthPass>

<style>
	.profile-ledger {
		display: grid;
		gap: 0;
		margin: 0;
	}

	.profile-ledger div {
		display: grid;
		grid-template-columns: 6.4rem minmax(0, 1fr);
		gap: 0.75rem;
		align-items: baseline;
		padding: 0.72rem 0;
		border-top: 1px dashed color-mix(in srgb, var(--pass-ink, #2c1d16) 16%, transparent);
		animation: profile-row 0.55s ease both;
	}

	.profile-ledger div:nth-child(1) {
		animation-delay: 0.06s;
	}

	.profile-ledger div:nth-child(2) {
		animation-delay: 0.12s;
	}

	.profile-ledger div:nth-child(3) {
		animation-delay: 0.18s;
	}

	.profile-ledger div:nth-child(4) {
		animation-delay: 0.24s;
	}

	.profile-ledger div:nth-child(5) {
		animation-delay: 0.3s;
	}

	.profile-ledger div:last-child {
		border-bottom: 1px dashed color-mix(in srgb, var(--pass-ink, #2c1d16) 16%, transparent);
	}

	.profile-ledger dt {
		margin: 0;
		color: var(--pass-muted, #7a6554);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.profile-ledger dd {
		margin: 0;
		color: var(--pass-ink, #2c1d16);
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.12rem;
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.15;
		overflow-wrap: anywhere;
	}

	.profile-no {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: 0.28em;
	}

	.profile-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
		margin-top: 1.35rem;
	}

	.profile-actions :is(a, button) {
		display: inline-grid;
		place-items: center;
		min-height: 2.45rem;
		padding: 0 1.05rem;
		border: 0;
		border-radius: 999px;
		background: var(--pass-ink, #2c1d16);
		color: var(--pass-paper, #fff8ee);
		font-family: var(--font-display, Fraunces, serif);
		font-size: 0.95rem;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
	}

	.profile-ghost {
		background: transparent;
		color: var(--pass-ink, #2c1d16);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--pass-ink, #2c1d16) 22%, transparent);
	}

	:global(.pass-body .pass-note) {
		margin: 1rem 0 0;
	}

	@keyframes profile-row {
		from {
			opacity: 0;
			transform: translateX(-0.45rem);
		}

		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.profile-ledger div {
			animation: none;
		}
	}
</style>
