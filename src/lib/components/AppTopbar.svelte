<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { CategoryRecord, Reader } from '$lib/types';
	import { deskTitle } from '$lib/desk';
	import { firstName } from '$lib/format';
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
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
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
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		user,
		categories,
		loanCount = 0
	}: {
		user: Reader;
		categories: CategoryRecord[];
		loanCount?: number;
	} = $props();

	const title = $derived(deskTitle(page.url.pathname));
	const query = $derived(page.url.searchParams.get('q') ?? '');
	const odbor = $derived(page.url.searchParams.get('odbor') ?? '');
	const hideSearch = $derived(page.url.pathname.startsWith('/prihlasenie'));

	const initials = $derived(
		(user?.name ?? 'Š')
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

<div class="relative z-10 px-5 pt-6 md:px-9 md:pt-8">
	<div class="flex items-start justify-between gap-4 pr-4 lg:pr-56">
		<div class="flex items-center gap-3">
			<Sheet>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon" class="lg:hidden" aria-label="Menu" {...props}>
							<MenuIcon />
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="left" class="w-[19rem] p-0">
					<SheetHeader class="sr-only">
						<SheetTitle>Navigácia</SheetTitle>
					</SheetHeader>
					<AppSidebar {user} compact />
				</SheetContent>
			</Sheet>
			<h1 class="text-4xl font-extrabold md:text-5xl">{title}</h1>
		</div>
		<div class="flex items-center gap-2 lg:hidden">
			{#if user}
				<Button href={resolve('/vypozicky')} variant="ghost" size="icon" class="rounded-full">
					<Avatar class="size-9">
						<AvatarFallback class="bg-accent text-accent-foreground text-xs font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>
				</Button>
			{:else}
				<Button href={resolve('/prihlasenie')} size="sm">Prihlásiť sa</Button>
			{/if}
		</div>
	</div>

	<div class="profile-bay hidden lg:flex">
		{#if user}
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<button type="button" class="flex items-center gap-2 no-underline" {...props}>
							<Avatar class="size-10">
								<AvatarFallback class="bg-accent text-accent-foreground font-semibold">
									{initials}
								</AvatarFallback>
							</Avatar>
							<span class="text-sm font-semibold">{firstName(user.name)}</span>
							<ChevronDownIcon class="text-muted-foreground size-4" />
						</button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>{user.name}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						{#snippet child({ props })}
							<a href={resolve('/vypozicky')} {...props}>
								<BookOpenIcon />
								Moja knižnica
							</a>
						{/snippet}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={submitLogout}>
						<LogOutIcon />
						Odhlásiť
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{:else}
			<Button href={resolve('/prihlasenie')} size="sm">Prihlásiť sa</Button>
		{/if}
		<Button
			href={resolve('/vypozicky')}
			variant="ghost"
			size="icon"
			class="relative rounded-full"
			aria-label="Moje knihy"
		>
			<BellIcon />
			{#if loanCount > 0}
				<span class="bg-destructive absolute top-1 right-1 size-2 rounded-full"></span>
			{/if}
		</Button>
	</div>

	{#if !hideSearch}
		<form class="search-bar mt-6" method="GET" action={resolve('/knihy')}>
			<label class="sr-only" for="odbor">Odbor</label>
			<select id="odbor" name="odbor" value={odbor}>
				<option value="">Všetky odbory</option>
				{#each categories as cat (cat.id)}
					<option value={cat.slug}>{cat.name}</option>
				{/each}
			</select>
			<span class="bg-border hidden h-6 w-px sm:block" aria-hidden="true"></span>
			<label class="sr-only" for="q-desk">Hľadať knihu</label>
			<Input
				id="q-desk"
				class="h-12 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
				type="search"
				name="q"
				value={query}
				placeholder="nájdi knihu, ktorá sa ti páči…"
			/>
			<Button class="m-1 h-10 rounded-full px-5" type="submit">Hľadať</Button>
		</form>
	{/if}
</div>
