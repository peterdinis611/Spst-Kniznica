<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		borrowSchema,
		fieldIssue,
		LOAN_DAY_OPTIONS,
		LOAN_DAYS_MAX,
		LOAN_DAYS_MIN,
		type BorrowErrors
	} from '$lib/borrow-fields';
	import { applyToast, gateSubmit } from '$lib/form-kit';
	import { daysLabel } from '$lib/format';
	import { createForm } from '$lib/tanstack-create-form';
	import type { BorrowerDraft } from '$lib/types';

	let {
		title,
		defaults,
		errors = {},
		message = '',
		open = $bindable(false)
	}: {
		title: string;
		defaults: BorrowerDraft;
		errors?: BorrowErrors;
		message?: string;
		open?: boolean;
	} = $props();

	let node = $state<HTMLDialogElement | undefined>();
	let submitted = $state(false);

	const form = createForm(() => ({
		defaultValues: {
			firstName: defaults.firstName,
			lastName: defaults.lastName,
			className: defaults.className,
			days: defaults.days
		},
		validators: {
			onSubmit: borrowSchema
		}
	}));

	$effect(() => {
		if (!node) return;
		if (open && !node.open) node.showModal();
		if (!open && node.open) node.close();
	});

	function shown(name: keyof BorrowErrors, issues: unknown[]) {
		if (submitted) return fieldIssue(issues[0]) || undefined;
		return errors[name];
	}

	function check(event: SubmitEvent) {
		submitted = true;
		gateSubmit(form, event, 'Doplň výpožičný lístok.');
	}
</script>

<dialog
	bind:this={node}
	class="borrow-dialog"
	aria-labelledby="borrow-title"
	onclose={() => (open = false)}
>
	<form
		method="POST"
		action="?/borrow"
		class="borrow-slip"
		novalidate
		use:enhance={applyToast()}
		onsubmit={check}
	>
		<span class="borrow-spine" aria-hidden="true"></span>
		<div class="borrow-holes" aria-hidden="true">
			<span></span><span></span><span></span><span></span>
		</div>
		<header class="borrow-head">
			<p class="borrow-mark">výpožičný lístok</p>
			<span class="borrow-stamp" aria-hidden="true">SPŠT</span>
			<h2 id="borrow-title">Vyplň lístok.</h2>
			<p class="borrow-book">{title}</p>
		</header>

		{#if message}
			<p class="borrow-note" role="alert">{message}</p>
		{/if}

		<div class="borrow-grid">
			<form.Field name="firstName">
				{#snippet children(field)}
					{@const err = shown('firstName', field.state.meta.errors)}
					<div class="borrow-field" class:is-bad={Boolean(err)}>
						<label for="borrow-first">Meno</label>
						<input
							id="borrow-first"
							name={field.name}
							type="text"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(event) => field.handleChange(event.currentTarget.value)}
							autocomplete="given-name"
							required
							maxlength={40}
							aria-invalid={err ? 'true' : undefined}
						/>
						{#if err}
							<p class="borrow-error">{err}</p>
						{/if}
					</div>
				{/snippet}
			</form.Field>
			<form.Field name="lastName">
				{#snippet children(field)}
					{@const err = shown('lastName', field.state.meta.errors)}
					<div class="borrow-field" class:is-bad={Boolean(err)}>
						<label for="borrow-last">Priezvisko</label>
						<input
							id="borrow-last"
							name={field.name}
							type="text"
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(event) => field.handleChange(event.currentTarget.value)}
							autocomplete="family-name"
							required
							maxlength={40}
							aria-invalid={err ? 'true' : undefined}
						/>
						{#if err}
							<p class="borrow-error">{err}</p>
						{/if}
					</div>
				{/snippet}
			</form.Field>
		</div>

		<form.Field name="className">
			{#snippet children(field)}
				{@const err = shown('className', field.state.meta.errors)}
				<div class="borrow-field" class:is-bad={Boolean(err)}>
					<label for="borrow-class">Trieda</label>
					<input
						id="borrow-class"
						name={field.name}
						type="text"
						value={field.state.value}
						onblur={field.handleBlur}
						oninput={(event) => field.handleChange(event.currentTarget.value)}
						placeholder="II.A"
						autocomplete="off"
						required
						maxlength={12}
						aria-invalid={err ? 'true' : undefined}
					/>
					{#if err}
						<p class="borrow-error">{err}</p>
					{/if}
				</div>
			{/snippet}
		</form.Field>

		<form.Field name="days">
			{#snippet children(field)}
				{@const err = shown('days', field.state.meta.errors)}
				<fieldset class="borrow-days" class:is-bad={Boolean(err)}>
					<legend>Doba</legend>
					<div class="borrow-stamps">
						{#each LOAN_DAY_OPTIONS as option (option)}
							<button
								class="borrow-choice"
								type="button"
								aria-pressed={field.state.value === option}
								onclick={() => field.handleChange(option)}
							>
								{daysLabel(option)}
							</button>
						{/each}
					</div>
					<div class="borrow-custom">
						<label for="borrow-days">Iná</label>
						<input
							id="borrow-days"
							name={field.name}
							type="number"
							inputmode="numeric"
							min={LOAN_DAYS_MIN}
							max={LOAN_DAYS_MAX}
							step="1"
							required
							value={field.state.value}
							onblur={field.handleBlur}
							oninput={(event) => {
								const next = event.currentTarget.valueAsNumber;
								field.handleChange(Number.isNaN(next) ? 0 : next);
							}}
							aria-invalid={err ? 'true' : undefined}
						/>
						<span>dní</span>
					</div>
					{#if err}
						<p class="borrow-error">{err}</p>
					{/if}
				</fieldset>
			{/snippet}
		</form.Field>

		<div class="borrow-actions">
			<button class="borrow-cancel" type="button" onclick={() => (open = false)}>Zrušiť</button>
			<button class="borrow-go" type="submit">Vypožičať</button>
		</div>
	</form>
</dialog>

<style>
	.borrow-dialog {
		position: fixed;
		inset: 0;
		width: min(28.5rem, calc(100vw - 1.5rem));
		max-width: min(28.5rem, calc(100vw - 1.5rem));
		height: fit-content;
		max-height: calc(100dvh - 2.4rem);
		margin: auto;
		padding: 0;
		overflow: auto;
		border: 0;
		background: transparent;
		color: inherit;
	}

	.borrow-dialog::backdrop {
		background: color-mix(in srgb, #3c2a21 78%, transparent);
		backdrop-filter: blur(5px);
	}

	.borrow-slip {
		--ink: #2c1d16;
		--muted: #7a6554;
		--rule: #d7c4ae;
		--stamp: #c45a38;
		--ticket: #fff8ee;
		position: relative;
		overflow: hidden;
		padding: 1.35rem 1.35rem 1.15rem 2.2rem;
		border: 1px solid color-mix(in srgb, var(--ink) 16%, transparent);
		border-radius: 1.15rem;
		background:
			radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--stamp) 12%, transparent), transparent 46%),
			var(--ticket);
		color: var(--ink);
		box-shadow: 0 1.8rem 3rem -1.3rem color-mix(in srgb, #2c1d16 55%, transparent);
		transform: rotate(-0.8deg);
		animation: borrow-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	:global(html.dark) .borrow-slip {
		--ink: #241710;
		--muted: #6d5848;
		--rule: #cbb79f;
		--ticket: #f4eadc;
	}

	.borrow-slip::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.2;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
	}

	.borrow-spine {
		position: absolute;
		top: 0.85rem;
		bottom: 0.85rem;
		left: 0;
		width: 0.42rem;
		background: linear-gradient(180deg, #c45a38, #3c2a21 62%, #c45a38);
	}

	.borrow-holes {
		position: absolute;
		top: 1.2rem;
		bottom: 1.2rem;
		left: 0.72rem;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		pointer-events: none;
	}

	.borrow-holes span {
		display: block;
		width: 0.7rem;
		height: 0.7rem;
		border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
		border-radius: 999px;
		background: #f6f0e6;
		box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18);
	}

	.borrow-head,
	.borrow-note,
	.borrow-grid,
	.borrow-field,
	.borrow-days,
	.borrow-actions {
		position: relative;
		z-index: 1;
	}

	.borrow-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.2rem 0.8rem;
		margin: 0 0 1.05rem;
	}

	.borrow-mark {
		margin: 0;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.borrow-stamp {
		grid-column: 2;
		grid-row: 1 / 4;
		align-self: start;
		padding: 0.38rem 0.48rem 0.28rem;
		border: 2px solid color-mix(in srgb, var(--stamp) 78%, var(--ink));
		border-radius: 999px;
		color: var(--stamp);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.72rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.14em;
		transform: rotate(8deg);
		mix-blend-mode: multiply;
	}

	.borrow-head h2 {
		grid-column: 1;
		margin: 0.35rem 0 0;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(1.65rem, 5vw, 2.15rem);
		font-weight: 700;
		line-height: 0.98;
		letter-spacing: -0.035em;
	}

	.borrow-book {
		grid-column: 1;
		margin: 0.4rem 0 0;
		max-width: 22ch;
		color: var(--muted);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 1.02rem;
		line-height: 1.35;
		text-wrap: balance;
	}

	.borrow-note {
		margin: 0 0 0.9rem;
		padding: 0.65rem 0.75rem;
		border-left: 3px solid var(--stamp);
		background: color-mix(in srgb, var(--stamp) 10%, var(--ticket));
		color: #9a3b28;
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.95rem;
	}

	.borrow-grid {
		display: grid;
		gap: 0.85rem 1rem;
		margin: 0 0 0.85rem;
	}

	.borrow-field {
		display: grid;
		gap: 0.28rem;
		margin: 0 0 0.9rem;
	}

	.borrow-field label,
	.borrow-days legend {
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.borrow-error {
		margin: 0.15rem 0 0;
		color: var(--stamp);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.88rem;
	}

	.borrow-days {
		margin: 0 0 1.15rem;
		padding: 0;
		border: 0;
	}

	.borrow-stamps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45rem;
		margin: 0.45rem 0 0;
	}

	.borrow-choice {
		appearance: none;
		display: grid;
		place-items: center;
		min-height: 2.7rem;
		padding: 0 0.35rem;
		border: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent);
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.92rem;
		font-style: italic;
		font-weight: 700;
		transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
	}

	.borrow-choice[aria-pressed='true'] {
		border-color: color-mix(in srgb, var(--stamp) 70%, var(--ink));
		background: var(--stamp);
		color: var(--ticket);
		transform: rotate(-4deg);
	}

	.borrow-custom {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: end;
		gap: 0.55rem;
		margin: 0.85rem 0 0;
	}

	.borrow-custom label,
	.borrow-custom span {
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.borrow-custom span {
		padding-bottom: 0.35rem;
	}

	.borrow-custom input,
	.borrow-field input[type='text'] {
		width: 100%;
		height: 2.65rem;
		padding: 0 0.1rem 0.2rem;
		border: 0;
		border-bottom: 1px solid var(--rule);
		border-radius: 0;
		background: transparent;
		color: var(--ink);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 1.12rem;
		box-shadow: none;
		outline: none;
	}

	.borrow-custom input {
		font-variant-numeric: tabular-nums;
		-moz-appearance: textfield;
	}

	.borrow-custom input::-webkit-outer-spin-button,
	.borrow-custom input::-webkit-inner-spin-button {
		appearance: none;
		margin: 0;
	}

	.borrow-field.is-bad input,
	.borrow-days.is-bad .borrow-custom input {
		border-bottom-color: var(--stamp);
	}

	.borrow-choice:focus-visible,
	.borrow-custom input:focus-visible,
	.borrow-field input:focus-visible,
	.borrow-go:focus-visible,
	.borrow-cancel:focus-visible {
		outline: 2px solid var(--stamp);
		outline-offset: 3px;
	}

	.borrow-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.7rem;
	}

	.borrow-cancel,
	.borrow-go {
		appearance: none;
		cursor: pointer;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-weight: 700;
	}

	.borrow-cancel {
		border: 0;
		padding: 0.2rem 0;
		background: transparent;
		color: var(--muted);
		font-size: 0.95rem;
		font-style: italic;
	}

	.borrow-go {
		border: 0;
		padding: 0.78rem 1.2rem;
		background: #3c2a21;
		color: var(--ticket);
		font-size: 1.05rem;
	}

	.borrow-go:hover {
		background: var(--stamp);
	}

	@media (min-width: 520px) {
		.borrow-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.borrow-slip {
			animation: none;
			transform: none;
		}
	}

	@keyframes borrow-in {
		from {
			opacity: 0;
			transform: translateY(0.9rem) rotate(-0.8deg);
		}
		to {
			opacity: 1;
			transform: rotate(-0.8deg);
		}
	}
</style>
