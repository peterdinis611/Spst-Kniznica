<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();
	const register = $derived(form?.mode === 'novy' || data.mode === 'novy');
</script>

<svelte:head>
	<title>{register ? 'Registrácia' : 'Prihlásenie'} · SPŠT Knižnica</title>
</svelte:head>

<section class="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
	<div>
		<p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">Čitateľský účet</p>
		<p class="mt-3 max-w-sm font-serif text-lg">
			Meno, e-mail, heslo (8+). Potom môžeš brať knihy — 21 dní, max päť.
		</p>
	</div>

	<Card.Root>
		<Card.Header>
			<div class="flex gap-2">
				<Button href={resolve('/prihlasenie')} variant={register ? 'outline' : 'secondary'} size="sm">
					Mám účet
				</Button>
				<Button
					href="{resolve('/prihlasenie')}?mod=novy"
					variant={register ? 'secondary' : 'outline'}
					size="sm"
				>
					Som nový
				</Button>
			</div>
		</Card.Header>
		<Card.Content>
			<form method="POST" action={register ? '?/signUp' : '?/signIn'} use:enhance class="space-y-4">
				{#if register}
					<div class="space-y-2">
						<Label for="name">Meno</Label>
						<Input id="name" class="h-10" name="name" autocomplete="name" required />
					</div>
				{/if}
				<div class="space-y-2">
					<Label for="email">E-mail</Label>
					<Input id="email" class="h-10" type="email" name="email" autocomplete="email" required />
				</div>
				<div class="space-y-2">
					<Label for="password">Heslo</Label>
					<Input
						id="password"
						class="h-10"
						type="password"
						name="password"
						autocomplete={register ? 'new-password' : 'current-password'}
						required
						minlength={8}
					/>
				</div>
				{#if form?.message}
					<Alert.Root variant="destructive">
						<Alert.Description>{form.message}</Alert.Description>
					</Alert.Root>
				{/if}
				<Button class="w-full" type="submit">{register ? 'Vytvoriť účet' : 'Prihlásiť sa'}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</section>
