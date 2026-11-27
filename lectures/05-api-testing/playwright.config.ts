// TESTING: Configures the Lecture 5 API server, test projects, and browser authentication.
// PLAYWRIGHT CONFIG for Lecture 5 (separate from the root config, because these tests need
// the local API server).
//
// Run from the repository root:
//   npx playwright test -c lectures/05-api-testing                     all tests
//   npx playwright test -c lectures/05-api-testing --project=api       API tests only
//   npx playwright test -c lectures/05-api-testing --project=ui-chrome UI tests in Chrome
import { defineConfig, devices } from '@playwright/test';
import { join } from 'node:path';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
// Written by ui-tests/auth.setup.ts, loaded by the UI projects.
const AUTH_FILE = join(__dirname, '.auth/qa.json');

export default defineConfig({
	timeout: 30_000,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [['html', { outputFolder: '../../playwright-report', open: 'never' }], ['list']],
	outputDir: '../../test-results',

	// Playwright starts the server before the tests and stops it afterwards. If it is
	// already running locally (you started it by hand), the running one is reused.
	webServer: {
		command: 'node server/server.mjs',
		url: `${BASE_URL}/api/health`,
		reuseExistingServer: !process.env.CI,
		env: { PORT: String(PORT) },
	},

	use: {
		// Used by BOTH `request` and `page`: request.get('/api/posts'), page.goto('/posts.html').
		// Keep it to the origin only. A path here ('.../api') would be dropped by
		// request.get('/posts'), because a leading '/' means "from the root".
		baseURL: BASE_URL,
		trace: 'retain-on-failure',
	},

	projects: [
		// API tests use only `request`, so Playwright never launches a browser for them.
		{ name: 'api', testDir: './api-tests' },

		// Signs in through the API once and saves the session for the UI projects.
		{ name: 'setup', testDir: './ui-tests', testMatch: /.*\.setup\.ts/ },

		{
			name: 'ui-chrome',
			testDir: './ui-tests',
			dependencies: ['setup'],
			use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: AUTH_FILE },
		},
		{
			name: 'ui-firefox',
			testDir: './ui-tests',
			dependencies: ['setup'],
			use: { ...devices['Desktop Firefox'], storageState: AUTH_FILE },
		},
	],
});
