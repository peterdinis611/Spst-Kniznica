import { notFound } from 'next/navigation';
import { FolioLink as Link } from '@/components/FolioLink';
import { Handbook } from '@/components/Handbook';
import { docsHref } from '@/docs/href';
import { renderHandbookMarkdown } from '@/docs/markdown';
import { getDocPage, listDocChapters } from '@/docs/source';
import { pageMeta } from '@/utils/metadata';

type DocsParams = { slug?: string[] };

export const dynamicParams = false;

export function generateStaticParams() {
	return listDocChapters().map((chapter) => ({ slug: chapter.slug }));
}

export async function generateMetadata({ params }: { params: Promise<DocsParams> }) {
	const { slug } = await params;
	const page = getDocPage(slug);
	if (!page) {
		return pageMeta({
			title: 'Kapitola chýba',
			description: 'Tento list príručky vo fonde nie je.',
			index: false
		});
	}
	return pageMeta({
		title: page.data.title,
		description: page.data.description ?? 'Príručka školskej knižnice SPŠT.',
		type: 'article'
	});
}

export default async function DocsPage({ params }: { params: Promise<DocsParams> }) {
	const { slug } = await params;
	const page = getDocPage(slug);
	if (!page) notFound();

	const chapters = listDocChapters();
	const index = chapters.findIndex((entry) => entry.url === page.url);
	const previous = index > 0 ? chapters[index - 1] : undefined;
	const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : undefined;

	return (
		<Handbook
			currentUrl={page.url}
			chapters={chapters.map((chapter) => ({
				url: chapter.url,
				title: chapter.data.title ?? chapter.url
			}))}
		>
			<article className="docs-leaf" data-tour="docs-leaf">
				<p className="docs-kicker">Príručka fondu</p>
				<header>
					<h1>{page.data.title}</h1>
					{page.data.description ? <p className="docs-lead">{page.data.description}</p> : null}
				</header>
				<div
					className="docs-prose"
					dangerouslySetInnerHTML={{ __html: renderHandbookMarkdown(page.body) }}
				/>
				{previous || next ? (
					<nav className="docs-pager" aria-label="Ďalšie kapitoly">
						{previous ? (
							<Link href={docsHref(previous.url)}>
								<span>Predchádzajúca</span>
								<strong>{previous.data.title}</strong>
							</Link>
						) : null}
						{next ? (
							<Link className="is-next" href={docsHref(next.url)}>
								<span>Ďalšia</span>
								<strong>{next.data.title}</strong>
							</Link>
						) : null}
					</nav>
				) : null}
			</article>
		</Handbook>
	);
}
