import { error } from '@sveltejs/kit';
import { docsSource } from '$lib/docs/source';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async ({ params }) => {
	const slugString = params.slug || '';
	const slug = slugString ? slugString.split('/') : [];
	const page = docsSource.getPage(slug);

	if (!page) {
		error(404, { message: `Stránka sa nenašla: /docs/${slugString}` });
	}

	return {
		page,
		pageTree: docsSource.pageTree
	};
};
