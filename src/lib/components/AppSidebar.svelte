<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { Reader } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import HouseIcon from '@lucide/svelte/icons/house';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import type { Component } from 'svelte';

	let { user, compact = false }: { user: Reader; compact?: boolean } = $props();

	const items: {
		path: '/' | '/odbory' | '/vypozicky' | '/knihy' | '/autori';
		label: string;
		icon: Component;
	}[] = [
		{ path: '/', label: 'Discover', icon: HouseIcon },
		{ path: '/odbory', label: 'Category', icon: LayoutGridIcon },
		{ path: '/vypozicky', label: 'My Library', icon: BookmarkIcon },
		{ path: '/knihy', label: 'Download', icon: DownloadIcon },
		{ path: '/autori', label: 'Favorite', icon: HeartIcon }
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

<aside class="flex h-full flex-col bg-white px-7 py-8" class:px-6={compact}>
	<a href={resolve('/')} class="text-[1.45rem] font-extrabold tracking-tight text-black no-underline">
		THE BOOKS
	</a>

	<p class="mt-12 text-[0.62rem] font-semibold tracking-[0.22em] text-[#b0b0b0] uppercase">Menu</p>
	<nav class="mt-4 flex flex-col gap-1.5" aria-label="Main">
		{#each items as item (item.path)}
			{@const Icon = item.icon}
			{@const on = active(item.path)}
			<a
				href={resolve(item.path)}
				class="flex items-center gap-3 rounded-xl py-1.5 text-[0.92rem] no-underline"
				class:font-semibold={on}
				class:text-black={on}
				class:text-[#9a9a9a]={!on}
			>
				<span
					class="grid size-8 place-items-center rounded-[0.65rem]"
					class:bg-accent={on}
					class:text-white={on}
				>
					<Icon class="size-4" />
				</span>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="mt-auto">
		<nav class="flex flex-col gap-1.5 text-[0.92rem] text-[#9a9a9a]">
			<span class="flex items-center gap-3 py-1.5">
				<span class="grid size-8 place-items-center">
					<SettingsIcon class="size-4" />
				</span>
				Setting
			</span>
			<span class="flex items-center gap-3 py-1.5">
				<span class="grid size-8 place-items-center">
					<CircleHelpIcon class="size-4" />
				</span>
				Help
			</span>
			{#if user}
				<Button
					variant="ghost"
					class="h-auto justify-start px-0 py-1.5 font-normal text-[#9a9a9a] hover:text-black"
					onclick={submitLogout}
				>
					<span class="grid size-8 place-items-center">
						<LogOutIcon class="size-4" />
					</span>
					Log out
				</Button>
			{:else}
				<Button
					href={resolve('/prihlasenie')}
					variant="ghost"
					class="h-auto justify-start px-0 py-1.5 font-normal text-[#9a9a9a]"
				>
					<span class="grid size-8 place-items-center">
						<LogInIcon class="size-4" />
					</span>
					Log in
				</Button>
			{/if}
		</nav>

		<div class="mt-8 flex items-center gap-3">
			<div
				class="grid size-11 place-items-center rounded-2xl bg-[#6c5ce7] text-white"
				aria-hidden="true"
			>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
					<path
						d="M4 15c3.5-7 12.5-7 16 0"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
					/>
					<circle cx="8.2" cy="8.5" r="1.15" fill="currentColor" />
					<circle cx="15.8" cy="8.5" r="1.15" fill="currentColor" />
				</svg>
			</div>
			<p class="text-[0.62rem] font-semibold tracking-[0.14em] text-[#1a1a1a] uppercase">
				Book library
			</p>
		</div>
	</div>
</aside>
