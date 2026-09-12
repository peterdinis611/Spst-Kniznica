import { describe, expect, it } from 'vitest';
import { parseFrontMatter, renderHandbookMarkdown, renderInline } from '../markdown';

describe('parseFrontMatter', () => {
	it('reads title, description and order from the leaf', () => {
		const parsed = parseFrontMatter(`---
title: Výpožičky
description: Lehota 7, 14 alebo 21 dní.
order: 5
---

Text kapitoly.
`);

		expect(parsed.data).toEqual({
			title: 'Výpožičky',
			description: 'Lehota 7, 14 alebo 21 dní.',
			order: 5
		});
		expect(parsed.body).toBe('Text kapitoly.');
	});
});

describe('renderHandbookMarkdown', () => {
	it('renders headings, lists, tables, code and links', () => {
		const html = renderHandbookMarkdown(`## Ako si požičať

1. Prihlás sa.
2. Otvor [katalóg](/books).

- **Lehota:** 7 dní
- Signatúra \`INF 004.4 BEL\`

| Pečiatka | Kedy padne |
| --- | --- |
| Vypožičané | Práve si vzal zväzok |

\`\`\`sh
bun run k6:smoke
\`\`\`
`);

		expect(html).toContain('<h2>Ako si požičať</h2>');
		expect(html).toContain('<ol>');
		expect(html).toContain('<a href="/books">katalóg</a>');
		expect(html).toContain('<strong>Lehota:</strong>');
		expect(html).toContain('<code>INF 004.4 BEL</code>');
		expect(html).toContain('<th>Pečiatka</th>');
		expect(html).toContain('<td>Vypožičané</td>');
		expect(html).toContain('<pre><code>bun run k6:smoke</code></pre>');
	});

	it('does not turn a javascript href into a link', () => {
		expect(renderInline('[x](javascript:evil)')).toBe('x');
	});
});
