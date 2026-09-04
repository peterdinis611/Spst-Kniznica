import {
	Bookmark,
	BookOpen,
	House,
	LayoutGrid,
	Library,
	LogIn,
	UserRound,
	Users
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Reader } from '@/types';
import { LogoutButton } from './LogoutButton';
import { TourButton } from './TourButton';

const items = [
	{ path: '/discover', label: 'Objavovať', icon: House },
	{ path: '/holdings', label: 'Všetky knihy', icon: Library },
	{ path: '/departments', label: 'Odbory', icon: LayoutGrid },
	{ path: '/loans', label: 'Moje knihy', icon: Bookmark },
	{ path: '/books', label: 'Katalóg', icon: BookOpen },
	{ path: '/authors', label: 'Autori', icon: Users }
] as const;

export function AppSidebar({
	user,
	compact = false,
	pathname
}: {
	user: Reader;
	compact?: boolean;
	pathname: string;
}) {
	function active(path: string) {
		if (path === '/discover') return pathname === '/discover';
		return pathname.startsWith(path);
	}

	return (
		<aside
			className={cn(
				'flex h-full flex-col bg-sidebar px-6 py-7 text-sidebar-foreground',
				compact && 'px-5'
			)}
		>
			<a href="/" className="font-display no-underline" data-tour={compact ? undefined : 'brand'}>
				<span className="block text-[0.7rem] font-extrabold tracking-[0.22em] text-stamp uppercase">
					SPŠT
				</span>
				<span className="text-xl font-extrabold tracking-tight text-sidebar-foreground">knižnica</span>
			</a>
			<p className="mt-10 font-sans text-[0.62rem] tracking-[0.18em] text-sidebar-foreground/65 uppercase">
				Fond
			</p>
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
								on
									? 'bg-stamp font-semibold text-stamp-ink'
									: 'text-sidebar-foreground/82 hover:bg-white/10'
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
				<p className="font-sans text-[0.68rem] tracking-[0.08em] text-sidebar-foreground/65 uppercase">
					Po—pia 7:30—15:30
				</p>
				<div className="mt-3">
					<TourButton />
					{user ? (
						<>
							<a
								href="/profile"
								className={cn(
									'mb-1 flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal text-sidebar-foreground/82 no-underline',
									pathname.startsWith('/profile') && 'bg-white/10 text-sidebar-foreground'
								)}
							>
								<UserRound className="size-4" />
								Môj profil
							</a>
							<LogoutButton />
						</>
					) : (
						<a
							href="/login"
							className="flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal text-sidebar-foreground/82 no-underline"
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
