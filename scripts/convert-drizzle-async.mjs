/**
 * One-shot SQLite Drizzle sync → Postgres async.
 * Patterns: .all()/.run() drop, .get() → first row, await db/tx calls.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
	console.error('usage: convert-drizzle-async.mjs <file>...');
	process.exit(1);
}

function convert(src) {
	let text = src;
	text = text.replaceAll(/\blike\(/g, 'ilike(');
	text = text.replaceAll('.get()?.c ?? 0', '.then((rows) => rows[0]?.c ?? 0)');
	text = text.replaceAll('.get() ?? null', '.then((rows) => rows[0] ?? null)');
	text = text.replaceAll('.get()', '.then((rows) => rows[0])');
	text = text.replaceAll('.all()', '');
	text = text.replaceAll('.run()', '');
	text = text.replaceAll(/db\.transaction\(\((tx)\) => \{/g, 'await db.transaction(async ($1) => {');
	text = text.replaceAll(/\.transaction\(\((tx)\) => \{/g, '.transaction(async ($1) => {');

	text = text.replaceAll(
		/^export function (\w+)/gm,
		'export async function $1'
	);
	text = text.replaceAll(
		/^function (syncCopies|nextInventory|insertCatalog|ensureHoldings|ensureCategoryOrder|ensureSeeded|catalog|loadCategories|loadAuthors|listBooksByIds|bookQuery)/gm,
		'async function $1'
	);

	const lines = text.split('\n');
	const out = [];
	for (const line of lines) {
		if (/\b(db|tx)\.(select|insert|update|delete|transaction)\b/.test(line) && !/\bawait\b/.test(line)) {
			if (/^\s*return\s/.test(line)) {
				out.push(line.replace(/^(\s*return)\s+/, '$1 await '));
				continue;
			}
			if (/^\s*(const|let)\s.+=\s/.test(line)) {
				out.push(line.replace(/^(\s*(?:const|let)\s[^=]+=\s)/, '$1await '));
				continue;
			}
			if (/^\s*(db|tx)\./.test(line)) {
				out.push(line.replace(/^(\s*)/, '$1await '));
				continue;
			}
		}
		out.push(line);
	}
	return out.join('\n');
}

for (const file of files) {
	const src = readFileSync(file, 'utf8');
	writeFileSync(file, convert(src));
	console.log('converted', file);
}
