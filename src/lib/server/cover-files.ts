import { env } from '$env/dynamic/private';

export function parseCover(url: string, key: string) {
	const coverUrl = url.trim();
	const coverKey = key.trim();
	if (!coverUrl) return { coverUrl: null, coverKey: null };

	try {
		const parsed = new URL(coverUrl);
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return { coverUrl: null, coverKey: null };
		}
	} catch {
		return { coverUrl: null, coverKey: null };
	}

	return { coverUrl, coverKey: coverKey || null };
}

export function forgetCover(key: string | null | undefined) {
	const fileKey = key?.trim();
	if (!fileKey) return;
	void deleteCoverFile(fileKey);
}

async function deleteCoverFile(key: string) {
	const token = env.UPLOADTHING_TOKEN?.trim();
	if (!token) return;

	try {
		const { UTApi } = await import('uploadthing/server');
		await new UTApi({ token }).deleteFiles(key);
	} catch {
		// Orphaned file is acceptable; the catalog row is already gone or replaced.
	}
}
