<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet/index.js';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import type { Reader } from '$lib/types';
	import { firstName } from '$lib/format';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import SearchIcon from '@lucide/svelte/icons/search';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let { user }: { user: Reader } = $props();

	const links = [
		{ href: resolve('/'), path: '/', label: 'Domov' },
		{ href: resolve('/books'), path: '/books', label: 'Knihy' },
		{ href: resolve('/departments'), path: '/departments', label: 'Odbory' },
		{ href: resolve('/authors'), path: '/authors', label: 'Autori' }
	];

	const query = $derived(page.url.searchParams.get('q') ?? '');

	function active(path: string) {
		if (path === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(path);
	}

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

<a class="skip-link" href="#obsah">Preskočiť na obsah</a>

<header class="bg-card/90 sticky top-0 z-50 border-b backdrop-blur-md">
	<div class="wrap flex items-center gap-3 py-3">
		<a href={resolve('/')} class="flex items-center gap-2 font-bold no-underline">
			<span
				class="bg-secondary text-secondary-foreground ring-border grid size-9 place-items-center rounded-full ring-1"
			>
				Š
			</span>
			<span class="hidden sm:inline">SPŠT knižnica</span>
		</a>

		<form
			class="relative mx-auto hidden min-w-0 flex-1 md:block"
			method="GET"
			action={resolve('/books')}
		>
			<SearchIcon
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
			/>
			<label class="sr-only" for="q-desk">Hľadať knihu</label>
			<Input
				id="q-desk"
				class="h-9 pl-8"
				type="search"
				name="q"
				value={query}
				placeholder="Hľadaj názov, autora, signatúru…"
			/>
		</form>

		<nav class="ml-auto hidden items-center gap-1 lg:flex" aria-label="Hlavná navigácia">
			{#each links as link (link.path)}
				<Button href={link.href} variant={active(link.path) ? 'secondary' : 'ghost'} size="sm">
					{link.label}
				</Button>
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			{#if user}
				<form id="logout-form" method="POST" action={resolve('/logout')} class="hidden"></form>
				<DropdownMenu>
					<DropdownMenuTrigger>
						{#snippet child({ props })}
							<Button variant="ghost" size="icon" class="rounded-full" aria-label="Účet" {...props}>
								<Avatar class="size-8">
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
							</Button>
						{/snippet}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{firstName(user.name)}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a href={resolve('/loans')} {...props}>
									<BookOpenIcon />
									Moje knihy
								</a>
							{/snippet}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={submitLogout}>
							<LogOutIcon />
							Odhlásiť
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			{:else}
				<Button href={resolve('/login')} size="sm">Prihlásiť sa</Button>
			{/if}

			<Sheet>
				<SheetTrigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon" class="lg:hidden" aria-label="Menu" {...props}>
							<MenuIcon />
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Navigácia</SheetTitle>
					</SheetHeader>
					<nav class="mt-4 flex flex-col gap-1 px-4">
						{#each [...links, { href: resolve('/loans'), path: '/loans', label: 'Moje knihy' }] as link (link.path)}
							<Button
								href={link.href}
								variant={active(link.path) ? 'secondary' : 'ghost'}
								class="justify-start"
							>
								{link.label}
							</Button>
						{/each}
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	</div>
	<form class="wrap pb-3 md:hidden" method="GET" action={resolve('/books')}>
		<label class="sr-only" for="q-mob">Hľadať knihu</label>
		<Input id="q-mob" class="h-9" type="search" name="q" value={query} placeholder="Hľadaj knihu…" />
	</form>
</header>
