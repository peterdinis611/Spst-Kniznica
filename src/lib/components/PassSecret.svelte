<script lang="ts">
	import { passwordStrength, strengthLabel } from '$lib/auth-fields';

	let {
		id,
		name = 'password',
		label,
		autocomplete,
		value = $bindable(''),
		error = '',
		meter = false,
		onValue,
		onBlur
	}: {
		id: string;
		name?: string;
		label: string;
		autocomplete: AutoFill;
		value?: string;
		error?: string;
		meter?: boolean;
		onValue?: (value: string) => void;
		onBlur?: () => void;
	} = $props();

	let shown = $state(false);
	const strength = $derived(passwordStrength(value));
	const errorId = $derived(`${id}-chyba`);
	const meterId = $derived(`${id}-sila`);
</script>

<div class="pass-field" class:is-bad={Boolean(error)}>
	<label for={id}>{label}</label>
	<div class="pass-secret">
		<input
			{id}
			{name}
			class="pass-secret-input"
			type={shown ? 'text' : 'password'}
			{autocomplete}
			bind:value
			oninput={() => onValue?.(value)}
			onblur={onBlur}
			required
			minlength={8}
			maxlength={72}
			spellcheck="false"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={[error ? errorId : '', meter ? meterId : ''].filter(Boolean).join(' ') ||
				undefined}
		/>
		<button
			class="pass-peek"
			type="button"
			aria-pressed={shown}
			aria-label={shown ? 'Skryť heslo' : 'Ukázať heslo'}
			onclick={() => (shown = !shown)}
		>
			{shown ? 'skry' : 'ukáž'}
		</button>
	</div>
	{#if error}
		<p class="pass-error" id={errorId}>{error}</p>
	{/if}
	{#if meter && value}
		<p class="pass-meter" id={meterId} data-sila={strength} aria-live="polite">
			<span class="pass-meter-bars" aria-hidden="true">
				<i></i><i></i><i></i>
			</span>
			{strengthLabel[strength]}
		</p>
	{/if}
</div>
