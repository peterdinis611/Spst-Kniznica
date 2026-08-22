import { resolve } from '$app/paths';

export function docsHref(url: string) {
	const rest = url.replace(/^\/docs\/?/, '');
	return rest ? resolve('/docs/[...slug]', { slug: rest }) : resolve('/docs');
}
