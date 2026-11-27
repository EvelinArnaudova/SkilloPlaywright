// TESTING: Verifies the post CRUD lifecycle and validation through the API client.
//
// Compare with request-basics.spec.ts: no URLs, no tokens, no cleanup code in the test.
//   postsApi -> PostsApiClient, already signed in as the QA user (fixtures/api.fixture.ts)
//   posts    -> creates test data and deletes it after the test, even if the test fails
import { test, expect } from '../fixtures/api.fixture';
import { buildPost } from '../api/data/postFactory';
import type { ApiError, Post } from '../api/types';

test('create, read, update, replace and delete a post', async ({ postsApi, posts }) => {
	const input = buildPost({ published: false });
	let id = 0;

	await test.step('POST creates the post: 201 + Location header', async () => {
		const response = await postsApi.create(input);
		expect(response.status()).toBe(201);

		const created: Post = await response.json();
		id = created.id;
		// Register it for cleanup right away, in case a later step fails.
		posts.track(id);
		expect(created).toMatchObject(input);
		expect(response.headers()['location']).toBe(`/api/posts/${id}`);
	});

	await test.step('GET returns the saved post', async () => {
		const response = await postsApi.get(id);
		expect(response.status()).toBe(200);
		expect(await response.json()).toMatchObject({ id, ...input });
	});

	await test.step('PATCH changes only the fields that were sent', async () => {
		const response = await postsApi.update(id, { published: true });
		expect(response.status()).toBe(200);
		expect(await response.json()).toMatchObject({ title: input.title, published: true });
	});

	await test.step('PUT replaces the whole post', async () => {
		const replacement = buildPost({ published: false });
		const response = await postsApi.replace(id, replacement);
		expect(response.status()).toBe(200);
		expect(await response.json()).toEqual({ id, authorId: 2, ...replacement });
	});

	await test.step('DELETE removes it: 204, then GET returns 404', async () => {
		const response = await postsApi.delete(id);
		expect(response.status()).toBe(204);
		expect((await postsApi.get(id)).status()).toBe(404);
	});
});

test('invalid input is rejected with 400 and a helpful message', async ({ postsApi, posts }) => {
	const response = await postsApi.create({ title: '   ' });
	expect(response.status()).toBe(400);
	const error: ApiError = await response.json();
	expect(error.details).toContain('title must be a non-empty string');

	// PUT needs every field, so a partial body is a client error too.
	const post = await posts.create();
	// The cast sends an invalid body on purpose; TypeScript would normally stop us.
	const partialPut = await postsApi.replace(post.id, { title: 'Only a title' } as never);
	expect(partialPut.status()).toBe(400);
});
