// TESTING: Demonstrates direct API requests and response assertions with Playwright.
//
// No custom fixtures and no client classes here: just `request.get(...)` and assertions,
// so students see the raw building blocks first. Only public (no-auth) endpoints are used.
//
// `baseURL` comes from playwright.config.ts, so '/api/posts' means
// 'http://localhost:3001/api/posts'.
import { test, expect } from '@playwright/test';
import type { Post, User } from '../api/types';

test('GET a collection, then a missing item returns 404', async ({ request }) => {
	const response = await request.get('/api/posts');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/json');

	const posts: Post[] = await response.json();
	expect(posts.length).toBeGreaterThan(0);
	const published = posts.filter((post) => post.published);
	expect(published.every((post) => typeof post.title === 'string')).toBe(true);

	const missing = await request.get('/api/posts/non-existent-id');
	expect(missing.status()).toBe(404);
});

test('GET a single user and check its typed fields', async ({ request }) => {
	const response = await request.get('/api/users/1');
	expect(response.ok()).toBeTruthy();

	const user: User = await response.json();
	expect(user).toMatchObject({ id: 1, role: 'admin' });
	expect(user.email).toContain('@');
	// A good API never leaks secrets. Checking what is NOT in the response is also a test.
	expect(user).not.toHaveProperty('password');
});

test('query parameters and custom headers', async ({ request }) => {
	const response = await request.get('/api/posts', {
		// Becomes ?published=true&_limit=2. Playwright encodes the values for you.
		params: { published: true, _limit: 2 },
		headers: { 'x-client-name': 'playwright-lecture' },
	});

	expect(response.status()).toBe(200);
	const posts: Post[] = await response.json();
	expect(posts.length).toBeLessThanOrEqual(2);
	expect(posts.every((post) => post.published)).toBe(true);
});
