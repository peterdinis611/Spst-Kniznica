<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData, PageProps } from './$types';

	let { data, form }: PageProps & { form: ActionData } = $props();

	const register = $derived(form?.mode === 'novy' || data.mode === 'novy');
</script>

<svelte:head>
	<title>{register ? 'Registrácia' : 'Prihlásenie'} · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap grid gap-10 pt-10 md:grid-cols-[0.9fr_1.1fr] md:pt-14">
	<div>
		<p class="kicker">Čitateľský účet</p>
		<h1 class="display mt-2 text-5xl md:text-6xl">
			{register ? 'Nový účet' : 'Prihlásenie'}
		</h1>
		<p class="mt-4 max-w-sm text-mute">
			Žiaci aj učitelia. Heslo aspoň 8 znakov. Výpožička platí 21 dní, naraz najviac 5 kníh.
		</p>
		<ul class="mt-8 space-y-3 text-sm text-mute">
			<li class="flex gap-3"><span class="text-brass">01</span> Nájsť knihu so zelenou bodkou</li>
			<li class="flex gap-3"><span class="text-brass">02</span> Vypožičať jedným ťahom</li>
			<li class="flex gap-3"><span class="text-brass">03</span> Vrátiť v sekcii Moje knihy</li>
		</ul>
	</div>

	<div class="panel p-6 md:p-8">
		<div class="flex gap-2">
			<a href={resolve('/prihlasenie')} class="chip {!register ? 'is-on' : ''}">Už mám účet</a>
			<a href="{resolve('/prihlasenie')}?mod=novy" class="chip {register ? 'is-on' : ''}">Chcem účet</a>
		</div>

		<form method="POST" action={register ? '?/signUp' : '?/signIn'} use:enhance class="mt-7 space-y-4">
			{#if register}
				<label class="field">
					Meno
					<input type="text" name="name" autocomplete="name" required placeholder="Ako ťa volajú v škole" />
				</label>
			{/if}
			<label class="field">
				E-mail
				<input type="email" name="email" autocomplete="email" required placeholder="meno@spst.sk" />
			</label>
			<label class="field">
				Heslo
				<input
					type="password"
					name="password"
					autocomplete={register ? 'new-password' : 'current-password'}
					required
					minlength="8"
					placeholder="Minimálne 8 znakov"
				/>
			</label>

			{#if form?.message}
				<p class="text-sm text-ember">{form.message}</p>
			{/if}

			<button class="btn w-full" type="submit">
				{register ? 'Vytvoriť účet' : 'Prihlásiť sa'}
			</button>
		</form>
	</div>
</section>
