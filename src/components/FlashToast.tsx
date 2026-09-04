'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { noticeFromSearch } from '@/notify/notices';
import { showNotice } from '@/notify/toast';

const SHOWN_KEY = 'folio-notice-shown';

export function FlashToast() {
	const params = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		const key = noticeFromSearch(params.get('notice'), params.get('ok'));
		if (!key) return;

		const stamp = `${pathname}:${key}`;
		const now = Date.now();
		const prev = sessionStorage.getItem(SHOWN_KEY);
		const [prevStamp, prevTime] = prev?.split('|') ?? [];
		const replay = prevStamp === stamp && now - Number(prevTime) < 1600;
		if (!replay) {
			sessionStorage.setItem(SHOWN_KEY, `${stamp}|${now}`);
			showNotice(key);
		}

		const next = new URLSearchParams(params.toString());
		next.delete('notice');
		next.delete('ok');
		const query = next.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
	}, [params, pathname, router]);

	return null;
}
