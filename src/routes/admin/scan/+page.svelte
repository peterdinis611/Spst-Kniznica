<script lang="ts">
	import { enhance } from '$app/forms';
	import { splitReaderName } from '$lib/borrow-fields';
	import { Button } from '$lib/components/ui/button/index.js';
	import PultField from '$lib/components/PultField.svelte';
	import PultSaveForm from '$lib/components/PultSaveForm.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { deskLoanSchema, deskScanSchema } from '$lib/desk-fields';
	import { firstSchemaIssue, applyToast } from '$lib/form-kit';
	import { holdingLabel } from '$lib/admin';
	import { shortDate } from '$lib/format';
	import { toast } from 'svelte-sonner';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const hit = $derived(data.hit);
	let pad = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (!hit || hit.kind === 'miss' || form?.stamp) pad?.focus();
	});

	function checkCode(event: SubmitEvent) {
		const box = event.currentTarget as HTMLFormElement;
		const code = String(new FormData(box).get('code') ?? '');
		const issue = firstSchemaIssue(deskScanSchema, { code });
		if (issue) {
			event.preventDefault();
			toast.error(issue);
		}
	}

	function fillReader(slip: { setFieldValue: (name: string, value: unknown) => void }, userId: string) {
		const person = data.readers.find((item) => item.id === userId);
		if (!person) return;
		const names = splitReaderName(person.name);
		slip.setFieldValue('borrowerFirstName', names.firstName);
		slip.setFieldValue('borrowerLastName', names.lastName);
	}
</script>

<Seo
	title="Čítačka · Pult"
	description="Naskenuj inventár alebo ISBN — výpožička a vrátenie bez zásuvky."
	index={false}
/>

<form class="pult-scan" method="GET" action="/admin/scan" novalidate onsubmit={checkCode}>
	<p class="pult-scan-kicker">pavilón B · čítačka</p>
	<nav class="pult-scan-modes" aria-label="Režim čítačky">
		<a class:is-on={data.mode === 'pult'} href="/admin/scan">Výpožička</a>
		<a
			class:is-on={data.mode === 'inventura'}
			href="/admin/scan?mode=inventura"
		>
			Inventúra
		</a>
	</nav>
	<label class="pult-scan-pad">
		<span>Inventár alebo ISBN</span>
		<input
			name="code"
			type="text"
			value={data.code}
			autocomplete="off"
			spellcheck="false"
			bind:this={pad}
			placeholder="INF-ALGO-01"
			aria-label="Inventár alebo ISBN"
		/>
	</label>
	{#if data.mode === 'inventura'}
		<input type="hidden" name="mode" value="inventura" />
	{/if}
	<button type="submit">Nájsť</button>
</form>

{#if data.mode === 'inventura'}
	<div class="pult-walk">
		{#if data.walk}
			<p>
				Chôdza od {shortDate(data.walk.startedAt)} · {data.walk.found.toLocaleString('sk-SK')} nájdených.
				Voľné bez pečiatky skončia ako chýbajúce.
			</p>
			<form
				method="POST"
				action="?mode=inventura&/closeWalk"
				use:enhance={applyToast()}
				onsubmit={(event) => {
					if (!confirm('Uzavrieť chôdzu? Voľné bez pečiatky budú na výkaze ako chýbajúce.')) {
						event.preventDefault();
					}
				}}
			>
				<Button type="submit" variant="outline">Uzavrieť inventúru</Button>
			</form>
		{:else}
			<p>Otvor chôdzu, potom s čítačkou prejdi policu. Vonku na lístku sa do chýbajúcich nepočítajú.</p>
			<form method="POST" action="?mode=inventura&/openWalk" use:enhance={applyToast()}>
				<Button type="submit">Otvoriť inventúru</Button>
			</form>
		{/if}
	</div>
{/if}

{#if form?.message}
	<p class="pult-note" role="alert">{form.message}</p>
{:else if form?.stamp}
	<p class="pult-note">{form.stamp}</p>
{/if}

{#if hit?.kind === 'miss'}
	<p class="pult-queue-empty">Kód {hit.code} vo fonde nie je. Skús inventár na chrbte.</p>
{:else if hit}
	<article class="pult-hit" class:is-out={hit.kind === 'return' || hit.kind === 'isbn-out'}>
		<p class="pult-hit-kicker">
			{hit.copy.inventoryNo}
			<span>{holdingLabel(hit.copy.status)}</span>
		</p>
		<h2>{hit.copy.title}</h2>
		<p class="pult-hit-meta">{hit.copy.callNumber} · {hit.copy.isbn}</p>

		{#if hit.kind === 'return' && data.mode === 'pult'}
			<p class="pult-hit-who">
				{hit.loan.borrowerFirstName}
				{hit.loan.borrowerLastName}
				· {hit.loan.borrowerClass} · termín {shortDate(hit.loan.dueAt)}
				{#if hit.loan.returnOfferedAt}
					· cestou na pult
				{/if}
			</p>
			<form method="POST" action="?/return" use:enhance={applyToast()}>
				<input type="hidden" name="id" value={hit.loan.id} />
				<Button type="submit">Vrátiť</Button>
			</form>
		{:else if data.mode === 'inventura' && hit.kind !== 'miss'}
			<p class="pult-hit-who">
				{#if hit.kind === 'return'}
					Vonku na lístku — pečiatka nájdený ho z police zoberie, vrátenie ostáva vo Výpožičke.
				{:else}
					Naskenovaný kus. Daj pečiatku nájdený, alebo stratu.
				{/if}
			</p>
			<div class="pult-walk-acts">
				<form
					method="POST"
					action="?mode=inventura&code={encodeURIComponent(data.code)}&/found"
					use:enhance={applyToast()}
				>
					<input type="hidden" name="holdingId" value={hit.copy.id} />
					<Button type="submit">Nájdený</Button>
				</form>
				<form
					method="POST"
					action="?mode=inventura&code={encodeURIComponent(data.code)}&/lost"
					use:enhance={applyToast()}
				>
					<input type="hidden" name="holdingId" value={hit.copy.id} />
					<Button type="submit" variant="outline">Stratený</Button>
				</form>
			</div>
		{:else if hit.kind === 'isbn-out'}
			<p class="pult-hit-who">
				{hit.open === 1 ? 'Jeden výtlačok je vonku' : `${hit.open} výtlačkov je vonku`}. Na vrátenie
				naskenuj inventár na chrbte, nie ISBN.
			</p>
		{:else if hit.kind === 'blocked'}
			<p class="pult-hit-who">{hit.message}</p>
		{:else if hit.kind === 'borrow'}
			<PultSaveForm
				schema={deskLoanSchema}
				action="?/borrow"
				invalid="Doplň lístok."
				defaults={{
					bookId: hit.copy.bookId,
					userId: data.readers[0]?.id ?? '',
					borrowerFirstName: '',
					borrowerLastName: '',
					borrowerClass: '',
					loanDays: 21
				}}
			>
				{#snippet children({ form: slip })}
					<input type="hidden" name="bookId" value={hit.copy.bookId} />
					<input type="hidden" name="holdingId" value={hit.copy.id} />
					<p class="pult-hit-copy">výtlačok {hit.copy.inventoryNo}</p>
					<div class="pult-fields is-2">
						<slip.Field name="userId">
							{#snippet children(field: any)}
								<label class="pult-field is-wide">
									<span>Čitateľ</span>
									<select
										name="userId"
										value={String(field.state.value ?? '')}
										onblur={field.handleBlur}
										onchange={(event) => {
											const id = event.currentTarget.value;
											field.handleChange(id);
											fillReader(slip, id);
										}}
									>
										{#each data.readers as person (person.id)}
											<option value={person.id}>{person.name} · {person.email}</option>
										{/each}
									</select>
								</label>
							{/snippet}
						</slip.Field>
						<PultField form={slip} name="borrowerFirstName" label="Meno" />
						<PultField form={slip} name="borrowerLastName" label="Priezvisko" />
						<PultField form={slip} name="borrowerClass" label="Trieda" />
						<PultField form={slip} name="loanDays" label="Dni" type="number" numeric min={1} max={90} />
					</div>
					<div class="pult-submit">
						<Button type="submit">Vypožičať</Button>
					</div>
				{/snippet}
			</PultSaveForm>
		{/if}
	</article>
{/if}
