import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/__tests__/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/components/**'],
		expect: { requireAssertions: true }
	},
	resolve: {
		alias: {
			'@': import.meta.dirname + '/src'
		}
	}
});
