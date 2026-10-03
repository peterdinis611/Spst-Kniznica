import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	fullyParallel: true,
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:3000',
		...devices['Desktop Chrome'],
		trace: 'off'
	},
	webServer: ci
		? {
				command: 'bunx next build && bunx next start -p 3000',
				url: 'http://localhost:3000',
				reuseExistingServer: false,
				timeout: 180_000
			}
		: undefined
});
