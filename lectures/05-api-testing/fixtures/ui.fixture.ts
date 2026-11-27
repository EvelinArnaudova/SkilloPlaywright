// TESTING: Extends API fixtures with the PostsPage object for browser tests.
//
// A UI test can ask for `postsPage` (the browser) and `posts` / `postsApi` (the API) at the
// same time. The browser is already signed in: the `setup` project saved the session in
// .auth/qa.json and the UI projects load it through `storageState` (see playwright.config.ts).
import { test as apiTest, expect } from './api.fixture';
import { PostsPage } from '../pages/PostsPage';

export const test = apiTest.extend<{ postsPage: PostsPage }>({
	postsPage: async ({ page }, use) => {
		await use(new PostsPage(page));
	},
});

export { expect };
