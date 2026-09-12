import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type DocMeta, parseFrontMatter } from './markdown';
import { sortDocChapters } from './order';

export type DocChapter = {
	url: string;
	slug: string[];
	data: DocMeta;
	body: string;
};

const DOCS_DIR = join(process.cwd(), 'content/docs');

function loadChapters(): DocChapter[] {
	const files = readdirSync(DOCS_DIR)
		.filter((name) => name.endsWith('.svx'))
		.sort();

	const chapters = files.map((file) => {
		const raw = readFileSync(join(DOCS_DIR, file), 'utf8');
		const { data, body } = parseFrontMatter(raw);
		const name = file.replace(/\.svx$/, '');
		const slug = name === 'index' ? [] : name.split('/');
		const url = slug.length ? `/docs/${slug.join('/')}` : '/docs';
		return { url, slug, data, body };
	});

	return sortDocChapters(chapters);
}

export function listDocChapters() {
	return loadChapters();
}

export function getDocPage(slug: string[] = []) {
	const key = slug.filter(Boolean).join('/');
	return listDocChapters().find((chapter) => chapter.slug.join('/') === key);
}

export const docsSource = {
	getPages() {
		return listDocChapters();
	},
	getPage(slug: string[] = []) {
		return getDocPage(slug);
	}
};
