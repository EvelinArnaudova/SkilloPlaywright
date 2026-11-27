// TESTING: Provides authenticated API clients and post data with automatic per-test cleanup.
//
// Dependency chain (Playwright builds it on demand, only for the fixtures a test asks for):
//
//   user (option, 'qa')
//     └─> apiToken          logs in through POST /api/login, returns the token
//           └─> authedRequest   APIRequestContext that sends `Authorization: Bearer <token>`
//                 └─> postsApi        PostsApiClient that acts as the signed-in user
//                       └─> posts           creates posts and DELETES them after the test
//
// All fixtures are test-scoped: they depend on `baseURL`, which is a test-scoped option.
// Logging in through the API takes a few milliseconds, so doing it per test is fine.
import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { AuthApiClient } from '../api/clients/AuthApiClient';
import { PostsApiClient } from '../api/clients/PostsApiClient';
import { buildPost } from '../api/data/postFactory';
import { users, type UserKey } from '../api/data/users';
import type { CreatePostInput, LoginResponse, Post } from '../api/types';

// Test data manager: the test creates, the fixture remembers and cleans up.
export interface PostsData {
	// Creates a valid post through the API (any field can be overridden) and tracks it.
	create(overrides?: Partial<CreatePostInput>): Promise<Post>;
	// Tracks a post that was created some other way (for example through the UI).
	track(id: number): void;
}

export type ApiFixtures = {
	// Option fixture: who the API fixtures sign in as. Change it with test.use({ user: 'admin' }).
	user: UserKey;
	apiToken: string;
	authedRequest: APIRequestContext;
	postsApi: PostsApiClient;
	posts: PostsData;
};

export const test = base.extend<ApiFixtures>({
	user: ['qa', { option: true }],

	apiToken: async ({ playwright, baseURL, user }, use) => {
		// A separate, short-lived context just for logging in. Using the built-in `request`
		// would store the session cookie in it, and anonymous `request` calls in the same
		// test would suddenly be signed in.
		const loginContext = await playwright.request.newContext({ baseURL });
		const response = await new AuthApiClient(loginContext).login(users[user]);
		expect(response.status(), `login as "${user}" should succeed`).toBe(200);
		const { token } = (await response.json()) as LoginResponse;
		await loginContext.dispose();

		await use(token);
	},

	authedRequest: async ({ playwright, baseURL, apiToken }, use) => {
		const context = await playwright.request.newContext({
			baseURL,
			extraHTTPHeaders: { Authorization: `Bearer ${apiToken}` },
		});
		await use(context);
		// Teardown: a context we create, we must close. The built-in `request` is closed for us.
		await context.dispose();
	},

	postsApi: async ({ authedRequest }, use) => {
		await use(new PostsApiClient(authedRequest));
	},

	posts: async ({ postsApi }, use) => {
		const createdIds: number[] = [];

		await use({
			async create(overrides) {
				const response = await postsApi.create(buildPost(overrides));
				expect(response.status(), 'seeding a post should return 201').toBe(201);
				const post = (await response.json()) as Post;
				createdIds.push(post.id);
				return post;
			},
			track(id) {
				createdIds.push(id);
			},
		});

		// Teardown runs after the test, even when it failed. 404 is fine: the test
		// may have deleted the post itself.
		for (const id of createdIds) {
			const response = await postsApi.delete(id);
			expect([204, 404], `cleanup of post ${id}`).toContain(response.status());
		}
	},
});

export { expect };
