<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Reader } from '$lib/types';

	let { user }: { user: Reader } = $props();

	const links = [
		{ href: resolve('/'), path: '/', label: 'Domov' },
		{ href: resolve('/knihy'), path: '/knihy', label: 'Knihy' },
		{ href: resolve('/odbory'), path: '/odbory', label: 'Odbory' },
		{ href: resolve('/autori'), path: '/autori', label: 'Autori' }
	];

	const query = $derived(page.url.searchParams.get('q') ?? '');

	function active(path: string) {
		if (path === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(path);
	}
</script>

<a class="skip-link" href="#obsah">Preskočiť na obsah</a>

<header class="site-header">
	<div class="flex flex-col gap-3 px-3 py-3 md:px-4">
		<div class="flex items-center gap-3">
			<a href={resolve('/')} class="badge-logo" aria-label="SPŠT knižnica">Š</a>

			<form class="search hidden min-w-0 flex-1 md:flex" method="GET" action={resolve('/knihy')}>
				<label class="sr-only" for="q-desk">Hľadať knihu</label>
				<input id="q-desk" type="search" name="q" value={query} placeholder="Hľadaj v skrinkách…" />
				<button class="btn btn-navy min-h-9 px-4 text-[0.95rem] shadow-none" type="submit">Hľadaj</button>
			</form>

			<nav class="ml-auto hidden lg:flex" aria-label="Hlavná navigácia">
				{#each links as link (link.path)}
					<a href={link.href} class="nav-link {active(link.path) ? 'is-on' : ''}">{link.label}</a>
				{/each}
			</nav>

			<div class="ml-auto flex items-center gap-2 lg:ml-2">
				{#if user}
					<a href={resolve('/vypozicky')} class="btn btn-butter">Moje</a>
					<form method="POST" action={resolve('/odhlasenie')}>
						<button class="btn btn-ghost" type="submit">Von</button>
					</form>
				{:else}
					<a href={resolve('/prihlasenie')} class="btn">Prihlás sa</a>
				{/if}
			</div>
		</div>

		<form class="search md:hidden" method="GET" action={resolve('/knihy')}>
			<label class="sr-only" for="q-mob">Hľadať knihu</label>
			<input id="q-mob" type="search" name="q" value={query} placeholder="Hľadaj knihu…" />
			<button class="btn btn-navy px-3 text-sm" type="submit">OK</button>
		</form>

		<nav class="-mx-1 flex gap-1 overflow-x-auto lg:hidden" aria-label="Sekcie">
			{#each [...links, { href: resolve('/vypozicky'), path: '/vypozicky', label: 'Moje' }] as link (link.path)}
				<a href={link.href} class="nav-link shrink-0 {active(link.path) ? 'is-on' : ''}">{link.label}</a>
			{/each}
		</nav>
	</div>
</header>
