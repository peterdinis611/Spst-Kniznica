import { notFound, redirect as nextRedirect } from 'next/navigation';
import { HttpError, isHttpError, isRedirect } from '@/http/kit';

export function applyKit(cause: unknown): never {
	if (isRedirect(cause)) {
		nextRedirect('location' in cause ? cause.location : '/');
	}
	if (isHttpError(cause) && cause.status === 404) {
		notFound();
	}
	throw cause;
}

export async function runKit<T>(fn: () => Promise<T> | T): Promise<T> {
	try {
		return await fn();
	} catch (cause) {
		applyKit(cause);
	}
}

export function throwNotFound(message?: string): never {
	throw new HttpError(404, message ?? 'Karta v katalógu chýba.');
}
