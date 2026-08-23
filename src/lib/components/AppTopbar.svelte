<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { CategoryChip, Reader } from '$lib/types';
	import { deskTitle } from '$lib/desk';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet/index.js';
	import AppSidebar from './AppSidebar.svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import SearchIcon from '@lucide/svelte/icons/search';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import ThemeToggle from './ThemeToggle.svelte';
	import { readerNumber } from '$lib/format';

	let {
		user,
		categories
	}: {
		user: Reader;
		categories: CategoryChip[];
	} = $props();

	const title = $derived(deskTitle(page.url.pathname));
	const query = $derived(page.url.searchParams.get('q') ?? '');
	const odbor = $derived(page.url.searchParams.get('odbor') ?? '');
	const hideSearch = $derived(
		page.url.pathname.startsWith('/login') || page.url.pathname.startsWith('/auth')
	);
	const authorSearch = $derived(page.url.pathname.startsWith('/authors'));
	let chosen = $state('all');
	const odborLabel = $derived(
		categories.find((cat) => cat.slug === chosen)?.name ?? 'Všetky odbory'
	);

	$effect(() => {
		chosen = odbor || 'all';
	});
	const displayName = $derived(user?.name ?? 'Hosť');

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

<header
	class="sticky top-0 z-20 border-b border-border bg-paper/92 px-3 pt-[max(0.55rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md sm:static sm:z-10 sm:bg-transparent sm:px-8 sm:pt-8 sm:pb-7 sm:backdrop-blur-none md:px-12 md:pt-9 md:pb-8"
>
	<div
		class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 sm:gap-x-4 sm:gap-y-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8"
	>
		<div class="flex min-w-0 items-center gap-1 sm:gap-3">
			<Sheet>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="icon"
							class="size-9 shrink-0 rounded-full lg:hidden"
							aria-label="Menu"
							{...props}
						>
							<MenuIcon />
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="left" class="bg-sidebar w-[min(18rem,88vw)] p-0">
					<SheetHeader class="sr-only">
						<SheetTitle>Menu</SheetTitle>
					</SheetHeader>
					<AppSidebar {user} compact />
				</SheetContent>
			</Sheet>
			<h1
				class="font-display min-w-0 truncate text-[1.15rem] leading-none font-semibold tracking-[-0.03em] [font-variation-settings:'SOFT'_28,'WONK'_0] sm:text-[1.7rem] md:text-[1.9rem]"
			>
				{title}
			</h1>
		</div>

		<div class="flex shrink-0 items-center gap-1.5 sm:gap-2.5 lg:col-start-3" data-tour="account">
			<ThemeToggle />
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<button
							type="button"
							class="account-mark grid size-9 cursor-pointer place-items-center rounded-full bg-primary font-sans text-[0.68rem] font-bold text-primary-foreground sm:size-10 sm:text-[0.72rem]"
							aria-label={displayName}
							{...props}
						>
							{initials}
						</button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={12} class="account-pass">
					<div class="account-pass-head">
						<span class="account-pass-initials">{initials}</span>
						<div>
							<strong>{displayName}</strong>
							<em>{user ? `preukaz ${readerNumber(user.id)}` : 'hosť v sieni'}</em>
						</div>
						<span class="account-pass-stamp" aria-hidden="true">SPŠT</span>
					</div>
					{#if user}
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a href={resolve('/loans')} {...props}>
									<BookOpenIcon />
									Moje knihy
								</a>
							{/snippet}
						</DropdownMenuItem>
						<DropdownMenuItem variant="destructive" onSelect={submitLogout}>
							<LogOutIcon />
							Odhlásiť
						</DropdownMenuItem>
					{:else}
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a href={resolve('/login')} {...props}>
									<LogInIcon />
									Prihlásiť sa
								</a>
							{/snippet}
						</DropdownMenuItem>
					{/if}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>

		{#if !hideSearch}
			<form
				class="col-span-2 flex h-10 min-w-0 w-full items-center gap-1 rounded-full bg-wash pr-1 pl-2 sm:h-12 sm:gap-2 sm:pr-1.5 sm:pl-2 lg:col-span-1 lg:col-start-2 lg:row-start-1"
				method="GET"
				action={authorSearch ? resolve('/authors') : resolve('/books')}
				data-tour="search"
			>
				{#if !authorSearch}
					<input type="hidden" name="odbor" value={chosen === 'all' ? '' : chosen} />
					<div class="hidden md:block">
					<DropdownMenu>
						<DropdownMenuTrigger>
							{#snippet child({ props })}
								<button
									type="button"
									class="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-sans text-[0.78rem] font-semibold text-foreground outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
									aria-label="Odbor"
									{...props}
								>
									{odborLabel}
									<ChevronDownIcon class="size-3.5 text-muted-foreground" />
								</button>
							{/snippet}
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							sideOffset={10}
							class="min-w-56 rounded-2xl border-0 bg-card p-2 text-card-foreground shadow-[0_18px_40px_rgb(60_42_33/0.14)] ring-1 ring-border"
						>
							<DropdownMenuRadioGroup bind:value={chosen}>
								<DropdownMenuRadioItem
									value="all"
									class="rounded-full px-3 py-2 font-sans text-[0.82rem] whitespace-nowrap focus:bg-primary focus:text-primary-foreground"
								>
									Všetky odbory
								</DropdownMenuRadioItem>
								{#each categories as cat (cat.id)}
									<DropdownMenuRadioItem
										value={cat.slug}
										class="rounded-full px-3 py-2 font-sans text-[0.82rem] whitespace-nowrap focus:bg-primary focus:text-primary-foreground"
									>
										<span class="mr-2 font-mono text-[0.68rem] font-semibold tracking-wider opacity-70">
											{cat.code}
										</span>
										{cat.name}
									</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					</div>
				{/if}
				<SearchIcon class="size-4 shrink-0 text-muted-foreground sm:ml-1" />
				<label class="sr-only" for="q-desk">Hľadať</label>
				<Input
					id="q-desk"
					class="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1.5 shadow-none placeholder:truncate focus-visible:border-0 focus-visible:ring-0 sm:h-12 sm:px-3"
					type="search"
					name="q"
					value={query}
					placeholder={authorSearch ? 'priezvisko' : 'názov alebo autor'}
				/>
				<Button
					class="size-8 shrink-0 rounded-full px-0 md:h-10 md:w-auto md:px-5 md:text-[0.78rem] md:font-semibold"
					type="submit"
					aria-label="Hľadať"
				>
					<SearchIcon class="size-3.5 md:hidden" />
					<span class="hidden md:inline">Hľadať</span>
				</Button>
			</form>
		{/if}
	</div>
</header>
