<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { Debouncer } from '@tanstack/pacer';
	import { pultSearchPath } from '$lib/pult-ledger';

	let { query, placeholder = 'hľadať v zásuvke' }: { query: string; placeholder?: string } =
		$props();
	let draft = $state('');
	let pending = $state(false);

	$effect.pre(() => {
		draft = query;
	});

	const search = new Debouncer(
		(value: string) => {
			const next = pultSearchPath(page.url, value);
			if (next === `${page.url.pathname}${page.url.search}`) return;
			void goto(next, { keepFocus: true, noScroll: true, replaceState: true });
		},
		{ wait: 280 }
	);

	const stop = search.store.subscribe((state) => {
		pending = state.isPending;
	});

	onDestroy(() => {
		stop.unsubscribe();
		search.cancel();
	});

	function onInput(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		draft = value;
		search.maybeExecute(value);
	}

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		search.flush();
	}
</script>

<form class="pult-search" class:is-pending={pending} method="GET" onsubmit={onSubmit}>
	<label class="sr-only" for="pult-q">Hľadať</label>
	<input
		id="pult-q"
		type="search"
		name="q"
		value={draft}
		{placeholder}
		aria-busy={pending}
		oninput={onInput}
	/>
	<button
		class="bg-primary text-primary-foreground h-8 shrink-0 rounded-full px-3.5 text-[0.78rem] font-semibold"
		type="submit"
	>
		{pending ? 'Hľadám' : 'Hľadať'}
	</button>
</form>
