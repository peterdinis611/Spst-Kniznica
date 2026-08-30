<script lang="ts">
	import { fieldIssue } from '$lib/form-kit';
	import type { Snippet } from 'svelte';

	let {
		form,
		name,
		label,
		wide = false,
		as = 'input',
		type = 'text',
		placeholder = '',
		min,
		max,
		maxlength,
		step,
		disabled = false,
		list,
		numeric = false,
		options
	}: {
		form: { Field: any };
		name: string;
		label: string;
		wide?: boolean;
		as?: 'input' | 'textarea' | 'select';
		type?: string;
		placeholder?: string;
		min?: number | string;
		max?: number | string;
		maxlength?: number;
		step?: string | number;
		disabled?: boolean;
		list?: string;
		numeric?: boolean;
		options?: Snippet;
	} = $props();
</script>

<form.Field {name}>
	{#snippet children(field: any)}
		{@const err = fieldIssue(field.state.meta.errors[0])}
		<label class="pult-field" class:is-wide={wide} class:is-bad={Boolean(err)}>
			<span>{label}</span>
			{#if as === 'textarea'}
				<textarea
					name={field.name}
					value={String(field.state.value ?? '')}
					{placeholder}
					{disabled}
					aria-invalid={err ? 'true' : undefined}
					onblur={field.handleBlur}
					oninput={(event) => field.handleChange(event.currentTarget.value)}
				></textarea>
			{:else if as === 'select'}
				<select
					name={field.name}
					value={String(field.state.value ?? '')}
					{disabled}
					aria-invalid={err ? 'true' : undefined}
					onblur={field.handleBlur}
					onchange={(event) => field.handleChange(event.currentTarget.value)}
				>
					{@render options?.()}
				</select>
			{:else}
				<input
					name={field.name}
					{type}
					{placeholder}
					{min}
					{max}
					maxlength={maxlength}
					{step}
					{disabled}
					{list}
					value={field.state.value as string | number}
					aria-invalid={err ? 'true' : undefined}
					onblur={field.handleBlur}
					oninput={(event) => {
						if (numeric) {
							const next = event.currentTarget.valueAsNumber;
							field.handleChange(Number.isNaN(next) ? 0 : next);
						} else {
							field.handleChange(event.currentTarget.value);
						}
					}}
				/>
			{/if}
			{#if err}
				<p class="pult-error">{err}</p>
			{/if}
		</label>
	{/snippet}
</form.Field>
