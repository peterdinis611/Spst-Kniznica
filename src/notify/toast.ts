'use client';

import { toast } from 'sonner';
import { notices, type NoticeKey, type NoticeKind } from './notices';

type StampOpts = {
	description?: string;
	className: string;
};

function stampClass(kind: NoticeKind) {
	if (kind === 'success') return 'folio-toast is-ok';
	if (kind === 'error') return 'folio-toast is-out';
	return 'folio-toast is-ink';
}

export function showStamp(kind: NoticeKind, text: string, sub?: string) {
	const opts: StampOpts = { className: stampClass(kind) };
	if (sub) opts.description = sub;
	if (kind === 'success') toast.success(text, opts);
	else if (kind === 'error') toast.error(text, opts);
	else toast(text, opts);
}

export function showNotice(key: NoticeKey) {
	const item = notices[key];
	showStamp(item.kind, item.text, 'sub' in item ? item.sub : undefined);
}

export function toastMessage(ok: boolean, text: string) {
	showStamp(ok ? 'success' : 'error', text);
}

export function toastFill(message = 'Doplň lístok.') {
	showStamp('error', message);
}

export function toastServerError(message?: string) {
	showStamp('error', message ?? 'Fond túto kartu teraz neotvorí.');
}

export const formToasts = {
	onSuccess({ data }: { data?: { ok?: boolean; message?: string } }) {
		if (!data?.message) return;
		toastMessage(Boolean(data.ok), data.message);
	},
	onError({ error }: { error: { serverError?: string; validationErrors?: unknown } }) {
		if (error.serverError) {
			toastServerError(error.serverError);
			return;
		}
		if (error.validationErrors) toastFill();
	}
};

export function mutationToasts(fail: string) {
	return {
		throwOnNavigation: true as const,
		onError({ error }: { error: { serverError?: string } }) {
			toastServerError(error.serverError ?? fail);
		}
	};
}
