'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
	BookOpen,
	ChevronDown,
	LogIn,
	LogOut,
	Menu,
	Search,
	Stamp,
	UserRound,
	X
} from 'lucide-react';
import type { CategoryChip, Reader } from '@/types';
import { deskTitle } from '@/desk/desk';
import { readerNumber } from '@/utils/format';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from './ThemeToggle';

export function AppTopbar({
	user,
	categories,
	admin = false
}: {
	user: Reader;
	categories: CategoryChip[];
	admin?: boolean;
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const title = deskTitle(pathname);
	const query = searchParams.get('q') ?? '';
	const odbor = searchParams.get('odbor') ?? '';
	const hideSearch =
		pathname.startsWith('/login') ||
		pathname.startsWith('/auth') ||
		pathname.startsWith('/admin') ||
		pathname.startsWith('/profile');
	const authorSearch = pathname.startsWith('/authors');
	const chosen = odbor || 'all';
	const odborLabel = categories.find((cat) => cat.slug === chosen)?.name ?? 'Všetky odbory';
	const displayName = user?.name ?? 'Hosť';
	const initials = displayName
		.split(/\s+/)
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
	const [menuOpen, setMenuOpen] = useState(false);
	const [accountOpen, setAccountOpen] = useState(false);
	const [odborOpen, setOdborOpen] = useState(false);

	function submitLogout() {
		const form = document.getElementById('logout-form');
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}

	return (
		<header className="sticky top-0 z-20 border-b border-border bg-paper/92 px-3 pt-[max(0.55rem,env(safe-area-inset-top))] pb-2.5 backdrop-blur-md sm:static sm:z-10 sm:bg-transparent sm:px-8 sm:pt-8 sm:pb-7 sm:backdrop-blur-none md:px-12 md:pt-9 md:pb-8">
			<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 sm:gap-x-4 sm:gap-y-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8">
				<div className="flex min-w-0 items-center gap-1 sm:gap-3">
					<button
						type="button"
						className="grid size-9 shrink-0 place-items-center rounded-full lg:hidden"
						aria-label="Menu"
						onClick={() => setMenuOpen(true)}
					>
						<Menu className="size-4" />
					</button>
					<h1 className="font-display min-w-0 truncate text-[1.15rem] leading-none font-semibold tracking-[-0.03em] sm:text-[1.7rem] md:text-[1.9rem]">
						{title}
					</h1>
				</div>
				<div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 lg:col-start-3" data-tour="account">
					<ThemeToggle />
					<div className="relative">
						<button
							type="button"
							className="account-mark grid size-9 cursor-pointer place-items-center rounded-full bg-primary font-sans text-[0.68rem] font-bold text-primary-foreground sm:size-10 sm:text-[0.72rem]"
							aria-label={displayName}
							onClick={() => setAccountOpen((open) => !open)}
						>
							{initials}
						</button>
						{accountOpen ? (
							<div className="account-pass absolute right-0 z-30 mt-3 min-w-56 rounded-2xl bg-card p-2 shadow-[0_18px_40px_rgb(60_42_33/0.14)] ring-1 ring-border">
								<div className="account-pass-head">
									<span className="account-pass-initials">{initials}</span>
									<div>
										<strong>{displayName}</strong>
										<em>{user ? `preukaz ${readerNumber(user.id)}` : 'hosť v sieni'}</em>
									</div>
									<span className="account-pass-stamp" aria-hidden="true">
										SPŠT
									</span>
								</div>
								{user ? (
									<>
										<a href="/profile" className="flex items-center gap-2 rounded-full px-3 py-2 no-underline">
											<UserRound className="size-4" />
											Môj profil
										</a>
										<a href="/loans" className="flex items-center gap-2 rounded-full px-3 py-2 no-underline">
											<BookOpen className="size-4" />
											Moje knihy
										</a>
										{admin ? (
											<a href="/admin" className="flex items-center gap-2 rounded-full px-3 py-2 no-underline">
												<Stamp className="size-4" />
												Pult
											</a>
										) : null}
										<button
											type="button"
											className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-destructive"
											onClick={submitLogout}
										>
											<LogOut className="size-4" />
											Odhlásiť
										</button>
									</>
								) : (
									<a href="/login" className="flex items-center gap-2 rounded-full px-3 py-2 no-underline">
										<LogIn className="size-4" />
										Prihlásiť sa
									</a>
								)}
							</div>
						) : null}
					</div>
				</div>
				{hideSearch ? null : (
					<form
						className="col-span-2 flex h-10 min-w-0 w-full items-center gap-1 rounded-full bg-wash pr-1 pl-2 sm:h-12 sm:gap-2 sm:pr-1.5 sm:pl-2 lg:col-span-1 lg:col-start-2 lg:row-start-1"
						method="GET"
						action={authorSearch ? '/authors' : '/books'}
						data-tour="search"
					>
						{authorSearch ? null : (
							<>
								<input type="hidden" name="odbor" value={chosen === 'all' ? '' : chosen} />
								<div className="relative hidden md:block">
									<button
										type="button"
										className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-sans text-[0.78rem] font-semibold text-foreground outline-none hover:bg-card"
										aria-label="Odbor"
										onClick={() => setOdborOpen((open) => !open)}
									>
										{odborLabel}
										<ChevronDown className="size-3.5 text-muted-foreground" />
									</button>
									{odborOpen ? (
										<div className="absolute top-12 z-20 min-w-56 rounded-2xl bg-card p-2 shadow-[0_18px_40px_rgb(60_42_33/0.14)] ring-1 ring-border">
											<a
												href={query ? `/books?q=${encodeURIComponent(query)}` : '/books'}
												className="block rounded-full px-3 py-2 font-sans text-[0.82rem] no-underline"
											>
												Všetky odbory
											</a>
											{categories.map((cat) => (
												<a
													key={cat.id}
													href={`/books?odbor=${cat.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
													className="block rounded-full px-3 py-2 font-sans text-[0.82rem] no-underline"
												>
													<span className="mr-2 font-mono text-[0.68rem] font-semibold tracking-wider opacity-70">
														{cat.code}
													</span>
													{cat.name}
												</a>
											))}
										</div>
									) : null}
								</div>
							</>
						)}
						<Search className="size-4 shrink-0 text-muted-foreground sm:ml-1" />
						<label className="sr-only" htmlFor="q-desk">
							Hľadať
						</label>
						<input
							id="q-desk"
							className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent px-1.5 shadow-none placeholder:truncate focus-visible:border-0 focus-visible:ring-0 sm:h-12 sm:px-3"
							type="search"
							name="q"
							defaultValue={query}
							placeholder={authorSearch ? 'priezvisko' : 'názov alebo autor'}
						/>
						<button
							className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground md:h-10 md:w-auto md:px-5 md:text-[0.78rem] md:font-semibold"
							type="submit"
							aria-label="Hľadať"
						>
							<Search className="size-3.5 md:hidden" />
							<span className="hidden md:inline">Hľadať</span>
						</button>
					</form>
				)}
			</div>
			{menuOpen ? (
				<div className="fixed inset-0 z-40 lg:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-black/40"
						aria-label="Zavrieť menu"
						onClick={() => setMenuOpen(false)}
					/>
					<div className="bg-sidebar relative h-full w-[min(18rem,88vw)]">
						<button
							type="button"
							className="absolute top-3 right-3 grid size-8 place-items-center rounded-full"
							aria-label="Zavrieť"
							onClick={() => setMenuOpen(false)}
						>
							<X className="size-4" />
						</button>
						<AppSidebar user={user} compact pathname={pathname} />
					</div>
				</div>
			) : null}
		</header>
	);
}
