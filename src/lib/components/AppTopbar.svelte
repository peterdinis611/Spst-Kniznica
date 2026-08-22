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
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuSeparator,
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
	const authorSearch = $derived(page.url.pathname.startsWith('/autori'));
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

<header class="relative z-10 border-b border-border px-8 pt-8 pb-7 md:px-12 md:pt-9 md:pb-8">
	<div class="flex flex-wrap items-center gap-x-8 gap-y-5 lg:flex-nowrap">
		<div class="flex min-w-0 items-center gap-3 lg:order-1 lg:shrink-0">
			<Sheet>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="icon"
							class="size-10 rounded-full lg:hidden"
							aria-label="Menu"
							{...props}
						>
							<MenuIcon />
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="left" class="bg-sidebar w-[18rem] p-0">
					<SheetHeader class="sr-only">
						<SheetTitle>Menu</SheetTitle>
					</SheetHeader>
					<AppSidebar {user} compact />
				</SheetContent>
			</Sheet>
			<h1
				class="font-display whitespace-nowrap text-[1.7rem] leading-none font-semibold tracking-[-0.03em] [font-variation-settings:'SOFT'_28,'WONK'_0] md:text-[1.9rem]"
			>
				{title}
			</h1>
		</div>

		<div class="order-3 flex items-center gap-2.5 lg:order-3">
			<ThemeToggle />
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<button
							type="button"
							class="grid size-10 cursor-pointer place-items-center rounded-full bg-primary font-sans text-[0.72rem] font-bold text-primary-foreground"
							aria-label={displayName}
							{...props}
						>
							{initials}
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
									Moje knihy
								</a>
							{/snippet}
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={submitLogout}>
							<LogOutIcon />
							Odhlásiť
						</DropdownMenuItem>
					{:else}
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a href={resolve('/prihlasenie')} {...props}>
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
				class="order-4 flex h-12 w-full min-w-0 flex-nowrap items-center gap-2 rounded-full bg-wash pr-1.5 pl-2 lg:order-2 lg:min-w-[28rem] lg:flex-1 lg:w-auto"
				method="GET"
				action={resolve('/knihy')}
			>
				<input type="hidden" name="odbor" value={chosen === 'all' ? '' : chosen} />
				<DropdownMenu>
					<DropdownMenuTrigger>
						{#snippet child({ props })}
							<button
								type="button"
								class="flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 font-sans text-[0.78rem] font-semibold text-foreground outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
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
				<SearchIcon class="ml-1 size-4 shrink-0 text-muted-foreground" />
				<label class="sr-only" for="q-desk">Hľadať</label>
				<Input
					id="q-desk"
					class="h-12 min-w-[12rem] flex-1 rounded-none border-0 bg-transparent px-3 shadow-none placeholder:whitespace-nowrap focus-visible:border-0 focus-visible:ring-0"
					type="search"
					name="q"
					value={query}
					placeholder="názov, autor alebo signatúra"
				/>
				<Button class="h-10 shrink-0 rounded-full px-5 text-[0.78rem] font-semibold" type="submit">
					Hľadať
				</Button>
			</form>
		{/if}
	</div>
</header>
