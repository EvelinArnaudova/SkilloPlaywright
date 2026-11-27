// TESTING: Encapsulates Team Blog page locators and actions used by browser tests.
//
// Compare it with api/clients/PostsApiClient.ts: same idea, different layer.
//   PostsPage       -> locators + user actions in the browser
//   PostsApiClient  -> endpoints + HTTP calls behind the browser
import type { Locator, Page } from '@playwright/test';

export class PostsPage {
	readonly signedInAs: Locator;
	readonly titleInput: Locator;
	readonly bodyInput: Locator;
	readonly publishedCheckbox: Locator;
	readonly createButton: Locator;
	readonly status: Locator;
	readonly list: Locator;

	constructor(private readonly page: Page) {
		this.signedInAs = page.getByText(/^Signed in as /);
		this.titleInput = page.getByLabel('Title');
		this.bodyInput = page.getByLabel('Body');
		this.publishedCheckbox = page.getByLabel('Published');
		this.createButton = page.getByRole('button', { name: 'Create post' });
		this.status = page.getByRole('status');
		this.list = page.getByRole('list', { name: 'Posts' });
	}

	async goto(): Promise<void> {
		await this.page.goto('/posts.html');
	}

	// One list item, found by its exact title.
	post(title: string): Locator {
		return this.list.getByRole('listitem').filter({ has: this.page.getByText(title, { exact: true }) });
	}

	async createPost(input: { title: string; body?: string; published?: boolean }): Promise<void> {
		await this.titleInput.fill(input.title);
		await this.bodyInput.fill(input.body ?? '');
		await this.publishedCheckbox.setChecked(input.published ?? false);
		await this.createButton.click();
	}
}
