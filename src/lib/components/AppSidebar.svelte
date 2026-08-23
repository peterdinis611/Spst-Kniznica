<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Reader } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import HouseIcon from '@lucide/svelte/icons/house';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils.js';

	let { user, compact = false }: { user: Reader; compact?: boolean } = $props();

	const items: {
		path: '/discover' | '/holdings' | '/departments' | '/loans' | '/books' | '/authors';
		label: string;
		icon: Component;
	}[] = [
		{ path: '/discover', label: 'Objavovať', icon: HouseIcon },
		{ path: '/holdings', label: 'Všetky knihy', icon: LibraryIcon },
		{ path: '/departments', label: 'Odbory', icon: LayoutGridIcon },
		{ path: '/loans', label: 'Moje knihy', icon: BookmarkIcon },
		{ path: '/books', label: 'Katalóg', icon: BookOpenIcon },
		{ path: '/authors', label: 'Autori', icon: UsersIcon }
	];

	function active(path: string) {
		if (path === '/discover') return page.url.pathname === '/discover';
		return page.url.pathname.startsWith(path);
	}

	function submitLogout() {
		const form = document.getElementById('logout-form');
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}

	async function openTour() {
		const { startTour, markTourSeen } = await import('$lib/tour');
		await startTour(markTourSeen);
	}
</script>

<aside
	class="bg-sidebar text-sidebar-foreground flex h-full flex-col px-6 py-7"
	class:px-5={compact}
>
	<a href={resolve('/')} class="font-display no-underline" data-tour={compact ? undefined : 'brand'}>
		<span class="text-primary block text-[0.7rem] font-extrabold tracking-[0.22em] uppercase">SPŠT</span>
		<span class="text-xl font-extrabold tracking-tight">knižnica</span>
	</a>

	<p class="text-muted-foreground mt-10 font-sans text-[0.62rem] tracking-[0.18em] uppercase">
		Fond
	</p>
	<nav class="mt-3 flex flex-col gap-1" aria-label="Hlavná navigácia" data-tour={compact ? undefined : 'nav'}>
		{#each items as item (item.path)}
			{@const Icon = item.icon}
			{@const on = active(item.path)}
			<a
				href={resolve(item.path)}
				class={cn(
					'flex items-center gap-3 rounded-full px-3 py-2 text-sm no-underline',
					on
						? 'bg-primary text-primary-foreground font-semibold'
						: 'text-muted-foreground hover:bg-secondary'
				)}
			>
				<span class="grid size-8 place-items-center">
					<Icon class="size-4" />
				</span>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto">
		<p class="text-muted-foreground font-sans text-[0.68rem] tracking-[0.08em] uppercase">
			Po—pia 7:30—15:30
		</p>
		<div class="mt-3">
			<Button
				variant="ghost"
				class="text-muted-foreground mb-1 h-auto justify-start px-3 py-1.5 font-normal"
				onclick={openTour}
			>
				<CircleHelpIcon />
				Prehliadka
			</Button>
			{#if user}
				<Button
					variant="ghost"
					class="text-muted-foreground h-auto justify-start px-3 py-1.5 font-normal"
					onclick={submitLogout}
				>
					<LogOutIcon />
					Odhlásiť
				</Button>
			{:else}
				<Button
					href={resolve('/login')}
					variant="ghost"
					class="text-muted-foreground h-auto justify-start px-3 py-1.5 font-normal"
				>
					<LogInIcon />
					Prihlásiť sa
				</Button>
			{/if}
		</div>
	</div>
</aside>
