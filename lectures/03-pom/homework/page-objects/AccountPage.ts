import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Locator, type Page } from '@playwright/test';
import { LoginPage } from './LoginPage'; 

export class AccountPage {
	readonly loginPage: LoginPage;
    readonly accountLink: Locator;
    readonly accountHeading: Locator;
	//readonly accountName: Locator;
    readonly phoneNumberInput: Locator;
    readonly saveChangesButton: Locator;
    readonly successAlert: Locator;

	constructor(private readonly page: Page) {
		this.loginPage = new LoginPage(page);
		this.accountLink = page.getByRole('link', { name: 'Account' });
		this.accountHeading = page.getByRole('heading', {name: 'Personal information'});
		//this.accountName = page.getByTestId('summary-name');
        this.phoneNumberInput = page.getByLabel('Phone number');
        this.saveChangesButton = page.getByRole('button', { name: 'Save changes' });
        this.successAlert = page.getByRole('status');
	}

	async navigateToAccountPage(): Promise<void> {
		const accountPageUrl = pathToFileURL(resolve(__dirname, '../pages/account.html')).href;

        await this.accountLink.click();
		await this.page.waitForURL(accountPageUrl);
        await this.accountHeading.waitFor();
	}

    async updatePhoneNumber(phoneNumber: string): Promise<void> {
        await this.phoneNumberInput.fill(phoneNumber);
        await this.saveChangesButton.click();
         
    }
}