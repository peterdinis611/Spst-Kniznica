export function resolve(path: string, params?: Record<string, string | undefined>) {
	if (!params) return path;
	let out = path;
	for (const [key, value] of Object.entries(params)) {
		if (value == null) continue;
		out = out.replaceAll(`[...${key}]`, value).replaceAll(`[${key}]`, value);
	}
	return out;
}
