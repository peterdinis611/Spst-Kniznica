import type { StorybookConfig } from '@storybook/sveltekit';

function flattenPlugins(plugins: unknown): { name?: string }[] {
	return (Array.isArray(plugins) ? plugins : [])
		.flatMap((plugin) => (Array.isArray(plugin) ? flattenPlugins(plugin) : plugin))
		.filter((plugin): plugin is { name?: string } => Boolean(plugin));
}

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@storybook/addon-docs',
		'@storybook/addon-a11y'
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	async viteFinal(viteConfig) {
		viteConfig.plugins = flattenPlugins(viteConfig.plugins).filter((plugin) => {
			const name = plugin.name ?? '';
			return !name.includes('sveltekit');
		});
		return viteConfig;
	}
};

export default config;
