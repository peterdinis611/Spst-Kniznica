import { Suspense } from 'react';
import { headers } from 'next/headers';
import { AppSidebar } from '@/components/AppSidebar';
import { AppTopbar } from '@/components/AppTopbar';
import { Footer } from '@/components/Footer';
import { layoutChrome } from '@/server/session';

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
	const headerList = await headers();
	const pathname = headerList.get('x-pathname') || headerList.get('x-invoke-path') || '/books';
	const chrome = await layoutChrome(pathname);

	return (
		<div className="desk">
			<div className="hidden h-dvh lg:sticky lg:top-0 lg:block">
				<AppSidebar user={chrome.user} />
			</div>
			<div className="desk-shell">
				<div className="desk-panel">
					<Suspense fallback={<div className="h-20" />}>
						<AppTopbar user={chrome.user} admin={chrome.admin} categories={chrome.categories} />
					</Suspense>
					<main id="obsah" className="desk-main pt-5 sm:pt-6 md:pt-8">
						{children}
					</main>
					<div className="desk-main pt-0">
						<Footer tone="desk" />
					</div>
				</div>
			</div>
		</div>
	);
}
