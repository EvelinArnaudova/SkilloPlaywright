// TESTING: Verifies login responses and role-based access to protected API endpoints.
//
//   401 Unauthorized -> "I don't know who you are" (no token, wrong password)
//   403 Forbidden    -> "I know who you are, but you may not do this"
import { test, expect } from '../fixtures/api.fixture';
import { AuthApiClient } from '../api/clients/AuthApiClient';
import { PostsApiClient } from '../api/clients/PostsApiClient';
import { buildPost } from '../api/data/postFactory';
import { users } from '../api/data/users';
import type { LoginResponse } from '../api/types';

test.describe('login', () => {
	test('valid credentials return a token and the user', async ({ request }) => {
		const response = await new AuthApiClient(request).login(users.qa);
		expect(response.status()).toBe(200);

		const body: LoginResponse = await response.json();
		expect(body.token).toBeTruthy();
		expect(body.user).toMatchObject({ email: users.qa.email, role: 'qa' });
	});

	test('a wrong password returns 401, a missing one returns 400', async ({ request }) => {
		const auth = new AuthApiClient(request);
		expect((await auth.login({ ...users.qa, password: 'wrong' })).status()).toBe(401);
		expect((await request.post('/api/login', { data: { email: users.qa.email } })).status()).toBe(400);
	});
});

test.describe('protected endpoints', () => {
	test('writing without a token returns 401', async ({ request }) => {
		// The built-in `request` sends no Authorization header: an anonymous client.
		const anonymous = new PostsApiClient(request);
		expect((await anonymous.create(buildPost())).status()).toBe(401);
	});

	test('a QA user cannot delete a post written by the admin (403)', async ({ postsApi }) => {
		// Post 1 belongs to the admin (seed data). `postsApi` is signed in as QA.
		expect((await postsApi.delete(1)).status()).toBe(403);
		expect((await postsApi.get(1)).status()).toBe(200);
	});
});
