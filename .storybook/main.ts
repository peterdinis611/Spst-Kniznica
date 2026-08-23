import type { StorybookConfig } from '@storybook/sveltekit';
import { storybookKitResolve } from './kit-resolve.ts';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: ['@storybook/addon-svelte-csf', '@storybook/addon-docs', '@storybook/addon-a11y'],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	async viteFinal(viteConfig) {
		viteConfig.plugins = [storybookKitResolve(), ...(viteConfig.plugins ?? [])];
		return viteConfig;
	}
};

export default config;
