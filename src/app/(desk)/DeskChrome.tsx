import { Suspense } from 'react';
import { headers } from 'next/headers';
import { AppSidebar } from '@/components/AppSidebar';
import { AppTopbar } from '@/components/AppTopbar';
import { layoutChrome } from '@/server/session';

async function deskPath() {
	const headerList = await headers();
	return headerList.get('x-pathname') || headerList.get('x-invoke-path') || '/books';
}

export async function DeskRail() {
	const pathname = await deskPath();
	const chrome = await layoutChrome(pathname);
	return (
		<div className="hidden h-dvh lg:sticky lg:top-0 lg:block">
			<AppSidebar user={chrome.user} pathname={pathname} />
		</div>
	);
}

export async function DeskHead() {
	const pathname = await deskPath();
	const chrome = await layoutChrome(pathname);
	return (
		<Suspense fallback={<div className="h-20" />}>
			<AppTopbar user={chrome.user} admin={chrome.admin} categories={chrome.categories} />
		</Suspense>
	);
}
