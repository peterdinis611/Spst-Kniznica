import { describe, expect, it } from 'vitest';
import { lookupIsbnCard, parseOpenLibrary } from '../isbn';

describe('parseOpenLibrary', () => {
	it('reads a search document onto a desk card', () => {
		expect(
			parseOpenLibrary('978-80-123-4501-1', {
				docs: [
					{
						title: 'Algoritmy v dielni',
						subtitle: 'Céčko na pulte',
						publisher: ['SPŠT'],
						first_publish_year: 2020,
						number_of_pages_median: 240,
						isbn: ['9788012345011'],
						author_name: ['Ján Belko'],
						first_sentence: ['Učebnica pre druhý ročník.']
					}
				]
			})
		).toEqual({
			isbn: '9788012345011',
			title: 'Algoritmy v dielni',
			subtitle: 'Céčko na pulte',
			year: 2020,
			pages: 240,
			publisher: 'SPŠT',
			description: 'Učebnica pre druhý ročník.',
			authors: ['Ján Belko']
		});
	});

	it('drops a payload without a title', () => {
		expect(parseOpenLibrary('97880', { docs: [{ publisher: ['SPŠT'] }] })).toBeNull();
	});
});

describe('lookupIsbnCard', () => {
	it('rejects a thin code before calling Open Library', async () => {
		expect(await lookupIsbnCard('97880')).toEqual({
			ok: false,
			message: 'ISBN má mať 10 alebo 13 číslic.'
		});
	});

	it('maps the first search hit', async () => {
		const result = await lookupIsbnCard('9788012345011', async () => ({
			docs: [
				{
					title: 'Stroje',
					publisher: ['Alfa'],
					first_publish_year: 2018,
					number_of_pages_median: 120
				}
			]
		}));
		expect(result).toEqual({
			ok: true,
			card: {
				isbn: '9788012345011',
				title: 'Stroje',
				subtitle: '',
				year: 2018,
				pages: 120,
				publisher: 'Alfa',
				description: '',
				authors: []
			}
		});
	});
});
