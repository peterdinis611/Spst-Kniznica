import { describe, expect, it } from 'vitest';
import { tokenizeXml, toXml, xmlEscape, xmlResponse } from '../xml';

describe('toXml', () => {
	it('writes a declaration, indent, and escaped text', () => {
		const body = toXml({
			name: 'fond',
			attrs: { xmlns: 'urn:spst:kniznica:vykaz', pocet: 1 },
			children: [{ name: 'nazov', text: 'Stroje <A> & "B"' }]
		});

		expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
		expect(body).toContain('<fond xmlns="urn:spst:kniznica:vykaz" pocet="1">');
		expect(body).toContain('\t<nazov>Stroje &lt;A&gt; &amp; &quot;B&quot;</nazov>');
		expect(body.endsWith('</fond>\n')).toBe(true);
	});

	it('self-closes an empty root', () => {
		expect(toXml({ name: 'fond', attrs: { pocet: 0 } })).toContain('<fond pocet="0"/>');
	});
});

describe('tokenizeXml', () => {
	it('marks tags, attributes, and text', () => {
		const lines = tokenizeXml(
			toXml({
				name: 'fond',
				attrs: { druh: 'inventura' },
				children: [{ name: 'inventar', text: 'INF-001' }]
			})
		);
		const kinds = lines.flatMap((line) => line.tokens.map((token) => token.kind));
		expect(kinds).toContain('decl');
		expect(kinds).toContain('name');
		expect(kinds).toContain('attr');
		expect(kinds).toContain('string');
		expect(kinds).toContain('text');
		expect(lines.some((line) => line.tokens.some((token) => token.value === 'INF-001'))).toBe(true);
	});
});

describe('xmlResponse', () => {
	it('stamps an xml attachment', async () => {
		const response = xmlResponse('inventura.xml', '<fond/>');
		expect(response.headers.get('content-type')).toMatch(/application\/xml/);
		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="inventura.xml"'
		);
		expect(xmlEscape('a&b')).toBe('a&amp;b');
		await expect(response.text()).resolves.toBe('<fond/>');
	});
});
