'use client';

import { usePathname } from 'next/navigation';
import {
	Bookmark,
	BookOpen,
	CircleHelp,
	House,
	LayoutGrid,
	Library,
	LogIn,
	LogOut,
	UserRound,
	Users
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Reader } from '@/types';

const items = [
	{ path: '/discover', label: 'Objavovať', icon: House },
	{ path: '/holdings', label: 'Všetky knihy', icon: Library },
	{ path: '/departments', label: 'Odbory', icon: LayoutGrid },
	{ path: '/loans', label: 'Moje knihy', icon: Bookmark },
	{ path: '/books', label: 'Katalóg', icon: BookOpen },
	{ path: '/authors', label: 'Autori', icon: Users }
] as const;

export function AppSidebar({ user, compact = false }: { user: Reader; compact?: boolean }) {
	const pathname = usePathname();

	function active(path: string) {
		if (path === '/discover') return pathname === '/discover';
		return pathname.startsWith(path);
	}

	function submitLogout() {
		const form = document.getElementById('logout-form');
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}

	return (
		<aside className={cn('bg-sidebar text-sidebar-foreground flex h-full flex-col px-6 py-7', compact && 'px-5')}>
			<a href="/" className="font-display no-underline" data-tour={compact ? undefined : 'brand'}>
				<span className="text-primary block text-[0.7rem] font-extrabold tracking-[0.22em] uppercase">SPŠT</span>
				<span className="text-xl font-extrabold tracking-tight">knižnica</span>
			</a>
			<p className="text-muted-foreground mt-10 font-sans text-[0.62rem] tracking-[0.18em] uppercase">Fond</p>
			<nav
				className="mt-3 flex flex-col gap-1"
				aria-label="Hlavná navigácia"
				data-tour={compact ? undefined : 'nav'}
			>
				{items.map((item) => {
					const Icon = item.icon;
					const on = active(item.path);
					return (
						<a
							key={item.path}
							href={item.path}
							className={cn(
								'flex items-center gap-3 rounded-full px-3 py-2 text-sm no-underline',
								on ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-secondary'
							)}
						>
							<span className="grid size-8 place-items-center">
								<Icon className="size-4" />
							</span>
							{item.label}
						</a>
					);
				})}
			</nav>
			<div className="mt-auto">
				<p className="text-muted-foreground font-sans text-[0.68rem] tracking-[0.08em] uppercase">
					Po—pia 7:30—15:30
				</p>
				<div className="mt-3">
					<button
						type="button"
						className="text-muted-foreground mb-1 flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal"
						onClick={async () => {
							const { startTour, markTourSeen } = await import('@/tour');
							await startTour(markTourSeen);
						}}
					>
						<CircleHelp className="size-4" />
						Prehliadka
					</button>
					{user ? (
						<>
							<a
								href="/profile"
								className={cn(
									'text-muted-foreground mb-1 flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal no-underline',
									pathname.startsWith('/profile') && 'bg-secondary text-foreground'
								)}
							>
								<UserRound className="size-4" />
								Môj profil
							</a>
							<button
								type="button"
								className="text-muted-foreground flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal"
								onClick={submitLogout}
							>
								<LogOut className="size-4" />
								Odhlásiť
							</button>
						</>
					) : (
						<a
							href="/login"
							className="text-muted-foreground flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal no-underline"
						>
							<LogIn className="size-4" />
							Prihlásiť sa
						</a>
					)}
				</div>
			</div>
		</aside>
	);
}
