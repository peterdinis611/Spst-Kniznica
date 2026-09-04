export function publicErrorMessage(error: unknown, status: number) {
	const raw = error instanceof Error ? error.message : String(error);
	const internal = /ENOENT|EACCES|EPERM|\.next|node_modules|\/Users\/|\/home\/|\\\\/.test(raw);

	if (status === 404) {
		return 'Túto stránku sme v katalógu nenašli.';
	}

	if (status === 429) {
		return 'Príliš veľa pokusov. Počkaj chvíľu a skús to znova.';
	}

	if (internal || status >= 500) {
		return 'Fond túto kartu teraz neotvorí.';
	}

	return raw;
}
