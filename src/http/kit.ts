export class HttpError extends Error {
	status: number;
	body: { message: string };

	constructor(status: number, body?: { message?: string } | string) {
		const message =
			typeof body === 'string' ? body : (body?.message ?? 'Fond túto kartu teraz neotvorí.');
		super(message);
		this.name = 'HttpError';
		this.status = status;
		this.body = { message };
	}
}

export class Redirect {
	readonly type = 'redirect' as const;
	status: number;
	location: string;

	constructor(status: number, location: string) {
		this.status = status;
		this.location = location;
	}
}

export type ActionFailure<T extends Record<string, unknown> = Record<string, unknown>> = {
	type: 'failure';
	status: number;
	data: T;
};

export type ActionResult =
	| { type: 'success'; status?: number; data?: Record<string, unknown> }
	| ActionFailure
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; error?: unknown };

export type SubmitFunction = () => (input: {
	result: ActionResult;
	update: (opts?: { reset?: boolean }) => Promise<void>;
}) => Promise<void>;

export type RequestEvent = {
	getClientAddress?: () => string;
	request: Request;
};

export function redirect(status: number, location: string): never {
	throw new Redirect(status, location);
}

export function error(status: number, body?: { message?: string } | string): never {
	throw new HttpError(status, body);
}

export function fail<T extends Record<string, unknown>>(status: number, data: T): ActionFailure<T> {
	return { type: 'failure', status, data };
}

export function json(data: unknown, init?: ResponseInit) {
	return Response.json(data, init);
}

export function isRedirect(cause: unknown): cause is Redirect {
	if (cause instanceof Redirect) return true;
	return (
		typeof cause === 'object' &&
		cause !== null &&
		((cause as { type?: string }).type === 'redirect' ||
			String((cause as { digest?: string }).digest ?? '').startsWith('NEXT_REDIRECT'))
	);
}

export function isHttpError(cause: unknown): cause is HttpError {
	return cause instanceof HttpError;
}

export function isActionFailure(value: unknown): value is ActionFailure {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as { type?: string }).type === 'failure' &&
		typeof (value as { status?: unknown }).status === 'number'
	);
}
