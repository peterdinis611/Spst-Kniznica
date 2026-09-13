import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: 0,
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:3000',
		...devices['Desktop Chrome'],
		trace: 'off'
	}
});
