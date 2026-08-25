import { generateSvelteHelpers } from '@uploadthing/svelte';
import type { OurFileRouter } from '$lib/server/uploadthing';

export const { createUploadThing } = generateSvelteHelpers<OurFileRouter>({
	url: '/api/uploadthing',
	fetch: (input, init) => fetch(input, { ...init, credentials: 'include' })
});
