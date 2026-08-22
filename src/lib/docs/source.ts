import { createFileSystemSource, type RawSvxModule } from 'fumadocs-svelte';

const modules = import.meta.glob<RawSvxModule>('/src/content/docs/**/*.svx', { eager: true });

export const docsSource = createFileSystemSource({
	glob: modules,
	rootDir: 'docs',
	baseUrl: '/docs'
});
