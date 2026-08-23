import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const lib = path.resolve(root, '../src/lib');
const appPaths = path.resolve(root, 'mocks/app-paths.ts');
const appEnvironment = path.resolve(root, 'mocks/app-environment.ts');

const aliases = [
	{ find: '$app/paths', replacement: appPaths },
	{ find: '$app/environment', replacement: appEnvironment },
	{ find: '$lib', replacement: lib }
];

function existingFile(file: string) {
	try {
		return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
	} catch {
		return null;
	}
}

function resolveLib(id: string) {
	if (id !== '$lib' && !id.startsWith('$lib/')) return null;

	const q = id.indexOf('?');
	const bare = q === -1 ? id : id.slice(0, q);
	const suffix = q === -1 ? '' : id.slice(q);
	const rest = bare === '$lib' ? '' : bare.slice('$lib/'.length);
	const base = rest ? path.resolve(lib, rest) : lib;
	const candidates = [base];

	if (base.endsWith('.js')) candidates.push(`${base.slice(0, -3)}.ts`);
	if (!path.extname(path.basename(base))) {
		candidates.push(`${base}.ts`, `${base}.js`, path.join(base, 'index.ts'), path.join(base, 'index.js'));
	}

	for (const file of candidates) {
		const hit = existingFile(file);
		if (hit) return hit + suffix;
	}

	return null;
}

export function storybookKitResolve(): Plugin {
	return {
		name: 'storybook-kit-resolve',
		enforce: 'pre',
		config() {
			return { resolve: { alias: aliases } };
		},
		configEnvironment() {
			return { resolve: { alias: aliases } };
		},
		resolveId(id) {
			if (id === '$app/paths' || id.startsWith('$app/paths?')) return appPaths;
			if (id === '$app/environment' || id.startsWith('$app/environment?')) return appEnvironment;
			return resolveLib(id);
		}
	};
}
