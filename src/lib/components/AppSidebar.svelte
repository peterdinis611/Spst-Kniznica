<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Reader } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import HouseIcon from '@lucide/svelte/icons/house';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import type { Component } from 'svelte';

	let { user, compact = false }: { user: Reader; compact?: boolean } = $props();

	const items: { path: '/' | '/odbory' | '/vypozicky' | '/knihy' | '/autori'; label: string; icon: Component }[] = [
		{ path: '/', label: 'Objavovať', icon: HouseIcon },
		{ path: '/odbory', label: 'Odbory', icon: LayoutGridIcon },
		{ path: '/vypozicky', label: 'Moja knižnica', icon: BookmarkIcon },
		{ path: '/knihy', label: 'Katalóg', icon: BookOpenIcon },
		{ path: '/autori', label: 'Autori', icon: UsersIcon }
	];

	function active(path: string) {
		if (path === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(path);
	}

	function submitLogout() {
		const form = document.getElementById('logout-form');
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}
</script>

<aside
	class="bg-sidebar text-sidebar-foreground relative z-20 flex h-full flex-col border-r px-6 py-7"
	class:border-0={compact}
>
	<a href={resolve('/')} class="text-[1.35rem] font-extrabold tracking-tight no-underline">
		THE BOOKS
	</a>

	<p class="text-muted-foreground mt-10 text-[0.68rem] font-semibold tracking-[0.22em] uppercase">
		Menu
	</p>
	<nav class="mt-4 flex flex-col gap-1" aria-label="Hlavná navigácia">
		{#each items as item (item.path)}
			{@const Icon = item.icon}
			<a
				href={resolve(item.path)}
				class="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm no-underline transition-colors"
				class:font-semibold={active(item.path)}
				class:text-foreground={active(item.path)}
				class:text-muted-foreground={!active(item.path)}
			>
				<Icon class={active(item.path) ? 'text-accent size-[1.15rem]' : 'size-[1.15rem]'} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto">
		<p class="text-muted-foreground text-[0.68rem] font-semibold tracking-[0.22em] uppercase">
			Účet
		</p>
		<div class="mt-3 flex flex-col gap-1">
			<p class="text-muted-foreground flex items-center gap-3 px-2 py-2 text-sm">
				<CircleHelpIcon class="size-[1.15rem]" />
				Po—Pia 7:30—15:30
			</p>
			{#if user}
				<Button
					variant="ghost"
					class="text-muted-foreground justify-start px-2"
					onclick={submitLogout}
				>
					<LogOutIcon />
					Odhlásiť
				</Button>
			{:else}
				<Button href={resolve('/prihlasenie')} variant="ghost" class="justify-start px-2">
					<LogInIcon />
					Prihlásiť sa
				</Button>
			{/if}
		</div>
		<Separator class="my-5" />
		<div class="flex items-center gap-3">
			<div
				class="grid size-11 place-items-center rounded-2xl bg-[#5b4bdc] text-white shadow-md"
				aria-hidden="true"
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
					<path
						d="M4 16c4-8 12-8 16 0"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
					/>
					<circle cx="8" cy="9" r="1.2" fill="currentColor" />
					<circle cx="16" cy="9" r="1.2" fill="currentColor" />
				</svg>
			</div>
			<div>
				<p class="text-[0.62rem] font-semibold tracking-[0.16em] uppercase">Book library</p>
				<p class="text-muted-foreground text-xs">SPŠT knižnica</p>
			</div>
		</div>
	</div>
</aside>
