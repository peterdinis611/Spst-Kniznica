<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const message = $derived(page.error?.message ?? 'Túto stránku sa nepodarilo nájsť.');
</script>

<svelte:head>
	<title>Chyba · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap py-24">
	<p class="kicker">Niečo sa pokazilo</p>
	<p class="display mt-3 text-7xl text-ember">{page.status}</p>
	<h1 class="mt-3 max-w-xl text-2xl">{message}</h1>
	<a href={resolve('/')} class="btn mt-8">Späť na prehľad</a>
</section>
