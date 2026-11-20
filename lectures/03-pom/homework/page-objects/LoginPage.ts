import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
	readonly email: Locator;
	readonly password: Locator;
	readonly signInButton: Locator;
	readonly errorMessage: Locator;

	constructor(private readonly page: Page) {
		this.email = page.getByLabel('Work email');
		this.password = page.getByLabel('Password');
		this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
		this.errorMessage = page.getByRole('alert');
	}

	async navigate(): Promise<void> {
		const loginPageUrl = pathToFileURL(resolve(__dirname, '../pages/login.html')).href;
		await this.page.goto(loginPageUrl);
	}

	async login(email: string, password: string): Promise<void> {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.signInButton.click();
	}
}