import { Suspense } from 'react';
import { Footer } from '@/components/Footer';
import { HallSplash } from '@/components/HallSplash';
import { DeskHead, DeskRail } from './DeskChrome';

export default function DeskLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="desk">
			<Suspense fallback={<div className="hidden h-dvh lg:sticky lg:top-0 lg:block" />}>
				<DeskRail />
			</Suspense>
			<div className="desk-shell">
				<div className="desk-panel">
					<Suspense fallback={<div className="h-20" />}>
						<DeskHead />
					</Suspense>
					<main id="obsah" className="desk-main pt-5 sm:pt-6 md:pt-8">
						<Suspense fallback={<HallSplash copy="Listujem." />}>{children}</Suspense>
					</main>
					<div className="desk-main pt-0">
						<Footer tone="desk" />
					</div>
				</div>
			</div>
		</div>
	);
}
