// TESTING: Combines API setup/assertions with browser checks of Team Blog posts.
//
//   page / postsPage -> already signed in (storageState from ui-tests/auth.setup.ts)
//   posts            -> creates posts through the API and deletes them after the test
//   postsApi         -> reads the saved data back to confirm what the UI did
import { test, expect } from '../fixtures/ui.fixture';
import { buildPost } from '../api/data/postFactory';
import type { Post } from '../api/types';

test('a post seeded through the API is shown in the UI', async ({ posts, postsPage }) => {
	// Arrange: one fast API call instead of filling in the form.
	const post = await posts.create({ published: true });

	// Act + Assert: the UI is what we really test here.
	await postsPage.goto();
	await expect(postsPage.signedInAs).toHaveText('Signed in as Dev QA');
	await expect(postsPage.post(post.title)).toContainText('by Dev QA');
	await expect(postsPage.post(post.title)).toContainText('Published');
	// No cleanup code: the `posts` fixture deletes the post after the test.
});

test('a post created in the UI is saved by the API', async ({ postsPage, postsApi, posts }) => {
	const input = buildPost({ published: true });

	await postsPage.goto();
	await postsPage.createPost(input);
	await expect(postsPage.status).toHaveText(`Post "${input.title}" created`);
	await expect(postsPage.post(input.title)).toBeVisible();

	// Assert the backend state, not only the screen.
	const response = await postsApi.list({ authorId: 2 });
	const saved = ((await response.json()) as Post[]).find((post) => post.title === input.title);
	expect(saved).toMatchObject(input);

	// The UI created it, so tell the fixture to clean it up.
	if (saved) posts.track(saved.id);
});

test.describe('without a saved session', () => {
	// Override the project's storageState: this browser starts with no cookies.
	test.use({ storageState: { cookies: [], origins: [] } });

	test('the posts page sends the visitor to the login page', async ({ page }) => {
		await page.goto('/posts.html');
		await expect(page).toHaveURL(/login\.html$/);
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	});
});
