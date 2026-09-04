'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import './theme-toggle.css';

export function ThemeToggle({ variant = 'desk' }: { variant?: 'desk' | 'hall' }) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const isDark = mounted && resolvedTheme === 'dark';
	const label = isDark ? 'Zapnúť svetlé zobrazenie' : 'Zapnúť tmavé zobrazenie';

	return (
		<button
			type="button"
			className={
				variant === 'hall'
					? 'hall-theme-btn'
					: 'grid size-9 cursor-pointer place-items-center rounded-full bg-stamp text-stamp-ink hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring sm:size-10'
			}
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			aria-label={label}
			title={label}
		>
			{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</button>
	);
}
