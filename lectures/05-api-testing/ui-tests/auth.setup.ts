// TESTING: Signs in through the API and saves browser state for the UI test projects.
//
// This runs as the `setup` project, before the UI projects (see `dependencies` in
// playwright.config.ts). Every UI test then starts with this saved state already loaded,
// so no test has to fill in the login form.
//
// Why this works: POST /api/login answers with a `Set-Cookie: session=...` header. The
// `request` context keeps that cookie, and `request.storageState()` writes it to a file in
// the same format a browser context uses. Docs: https://playwright.dev/docs/auth
import { test as setup, expect } from '@playwright/test';
import { join } from 'node:path';
import { AuthApiClient } from '../api/clients/AuthApiClient';
import { users } from '../api/data/users';

// Same path as `storageState` in playwright.config.ts. The .auth folder is git-ignored:
// it contains a live session.
const authFile = join(__dirname, '../.auth/qa.json');

setup('sign in as the QA user through the API', async ({ request }) => {
	const response = await new AuthApiClient(request).login(users.qa);
	expect(response.status()).toBe(200);

	await request.storageState({ path: authFile });
});
