export const base = '';
export const assets = '';

export function resolve(pathname: string, params?: Record<string, string>) {
	if (!params) return pathname;
	return pathname.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (_, key: string) => params[key] ?? `[${key}]`);
}

export const resolveRoute = resolve;

export function asset(file: string) {
	return file;
}

export async function match() {
	return null;
}
