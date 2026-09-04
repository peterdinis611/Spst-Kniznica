'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { OfflineSlip } from '@/components/OfflineSlip';
import { ScrollToTop } from '@/components/ScrollToTop';
import { WaitStamp } from '@/components/WaitStamp';
import { Suspense, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			{children}
			<Toaster position="top-right" closeButton richColors />
			<Suspense fallback={null}>
				<WaitStamp />
			</Suspense>
			<OfflineSlip />
			<ScrollToTop />
		</ThemeProvider>
	);
}
