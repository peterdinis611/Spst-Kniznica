<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { CategoryRecord, Reader } from '$lib/types';
	import { deskTitle } from '$lib/desk';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet/index.js';
	import AppSidebar from './AppSidebar.svelte';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import SearchIcon from '@lucide/svelte/icons/search';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		user,
		categories
	}: {
		user: Reader;
		categories: CategoryRecord[];
	} = $props();

	const title = $derived(deskTitle(page.url.pathname));
	const query = $derived(page.url.searchParams.get('q') ?? '');
	const odbor = $derived(page.url.searchParams.get('odbor') ?? '');
	const hideSearch = $derived(page.url.pathname.startsWith('/prihlasenie'));
	const displayName = $derived(user?.name ?? 'Guest');
	const photo = $derived(
		user ? `https://i.pravatar.cc/80?u=${encodeURIComponent(user.id)}` : undefined
	);

	const initials = $derived(
		displayName
			.split(/\s+/)
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);

	function submitLogout() {
		const form = document.getElementById('logout-form');
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}
</script>

<div class="relative z-10 px-5 pt-7 md:px-10 md:pt-8">
	<div class="flex items-start justify-between gap-4 pr-4 lg:pr-64">
		<div class="flex items-center gap-3">
			<Sheet>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon" class="lg:hidden" aria-label="Menu" {...props}>
							<MenuIcon />
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="left" class="w-[18rem] p-0">
					<SheetHeader class="sr-only">
						<SheetTitle>Menu</SheetTitle>
					</SheetHeader>
					<AppSidebar {user} compact />
				</SheetContent>
			</Sheet>
			<h1 class="text-[2.35rem] leading-none font-extrabold md:text-[2.75rem]">{title}</h1>
		</div>
		<div class="flex items-center gap-2 lg:hidden">
			<Button href={user ? resolve('/vypozicky') : resolve('/prihlasenie')} variant="ghost" size="icon" class="rounded-full">
				<Avatar class="size-9">
					{#if photo}
						<AvatarImage src={photo} alt={displayName} />
					{/if}
					<AvatarFallback class="text-xs font-semibold">{initials}</AvatarFallback>
				</Avatar>
			</Button>
		</div>
	</div>

	<div class="profile-bay hidden lg:flex">
		<DropdownMenu>
			<DropdownMenuTrigger>
				{#snippet child({ props })}
					<button type="button" class="flex items-center gap-2.5 no-underline" {...props}>
						<Avatar class="size-10">
							{#if photo}
								<AvatarImage src={photo} alt={displayName} />
							{/if}
							<AvatarFallback class="font-semibold">{initials}</AvatarFallback>
						</Avatar>
						<span class="text-sm font-semibold">{displayName}</span>
						<ChevronDownIcon class="size-4 text-[#8a8a8a]" />
					</button>
				{/snippet}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{displayName}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{#if user}
					<DropdownMenuItem>
						{#snippet child({ props })}
							<a href={resolve('/vypozicky')} {...props}>
								<BookOpenIcon />
								My Library
							</a>
						{/snippet}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={submitLogout}>
						<LogOutIcon />
						Log out
					</DropdownMenuItem>
				{:else}
					<DropdownMenuItem>
						{#snippet child({ props })}
							<a href={resolve('/prihlasenie')} {...props}>Log in</a>
						{/snippet}
					</DropdownMenuItem>
				{/if}
			</DropdownMenuContent>
		</DropdownMenu>
		<a
			href={resolve('/vypozicky')}
			class="relative grid size-10 place-items-center rounded-full no-underline"
			aria-label="Notifications"
		>
			<BellIcon class="size-[1.15rem]" />
			<span class="absolute top-1.5 right-2 size-2 rounded-full bg-[#ef4444]"></span>
		</a>
	</div>

	{#if !hideSearch}
		<form class="search-bar mt-7" method="GET" action={resolve('/knihy')}>
			<label class="sr-only" for="odbor">Category</label>
			<select id="odbor" name="odbor" value={odbor}>
				<option value="">All Categories</option>
				{#each categories as cat (cat.id)}
					<option value={cat.slug}>{cat.name}</option>
				{/each}
			</select>
			<SearchIcon class="ml-1 size-4 shrink-0 text-[#b0b0b0]" />
			<label class="sr-only" for="q-desk">Search</label>
			<Input
				id="q-desk"
				class="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
				type="search"
				name="q"
				value={query}
				placeholder="find the book you like..."
			/>
			<Button class="m-1.5 h-10 rounded-xl px-6 text-[0.82rem] font-semibold" type="submit">
				Search
			</Button>
		</form>
	{/if}
</div>
