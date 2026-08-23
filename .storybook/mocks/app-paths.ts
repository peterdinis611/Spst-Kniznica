export const base = '';
export const assets = '';

export function resolve(pathname: string, _params?: Record<string, string>) {
	return pathname;
}

export const resolveRoute = resolve;

export function asset(file: string) {
	return file;
}

export async function match() {
	return null;
}
