import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AccountPage } from './AccountPage';

export class LoginPage {
	readonly email: Locator;
	readonly password: Locator;
	readonly submitButton: Locator;
	readonly errorMessage: Locator;

	constructor(private readonly page: Page) {
		this.email = page.getByLabel('Email address');
		this.password = page.getByLabel('Password');
		this.submitButton = page.getByRole('button', { name: 'Sign in', exact: true });
		this.errorMessage = page.getByRole('alert');
	}

	async navigate(): Promise<void> {
		const loginPageUrl = pathToFileURL(resolve(__dirname, '../pages/login.html')).href;
		await this.page.goto(loginPageUrl);
	}

	async login(email: string, password: string): Promise<void> {
		await this.email.fill(email);
		await this.password.fill(password);
		await this.submitButton.click();
	}

	async loginAndOpenAccount(email: string, password: string): Promise<AccountPage> {
		await this.login(email, password);
		await this.page.waitForURL(/\/index\.html$/);
		return new AccountPage(this.page);
	}
}
