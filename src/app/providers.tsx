'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { FlashToast } from '@/components/FlashToast';
import { OfflineSlip } from '@/components/OfflineSlip';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Suspense, type ReactNode } from 'react';
import '@/components/folio-toast.css';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
			{children}
			<Toaster
				position="top-right"
				closeButton
				duration={5200}
				gap={10}
				offset="1.15rem"
				toastOptions={{ className: 'folio-toast' }}
				style={{ zIndex: 96 }}
			/>
			<Suspense fallback={null}>
				<FlashToast />
			</Suspense>
			<OfflineSlip />
			<ScrollToTop />
		</ThemeProvider>
	);
}
