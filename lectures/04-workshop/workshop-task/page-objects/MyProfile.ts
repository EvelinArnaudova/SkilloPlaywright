import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Locator, type Page } from '@playwright/test';

export class MyProfile {
    readonly heading: Locator;
    readonly editButton: Locator;
    readonly resetButton: Locator;
    readonly resetAlert: Locator;
    readonly countryDropdown: Locator;
    readonly saveButton: Locator;
    readonly successAlert: Locator;
    readonly updatedCountryDetail: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly emailInput: Locator;
    readonly phoneInput: Locator;
    readonly phoneRadio: Locator;
    readonly interestsCheckbox: Locator;
    readonly bioField: Locator;
    readonly updatedFullNameDetail: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'My profile' });
        this.editButton = page.getByRole('button', { name: 'Edit' });
        this.countryDropdown = page.locator('#country');
        this.resetButton = page.locator('#reset-button');
        this.resetAlert   = page.getByRole('status').filter({ hasText: 'Demo profile restored.' });
        this.saveButton = page.getByRole('button', { name: 'Save changes' });
        this.successAlert = page.getByRole('status').filter({ hasText: 'Profile saved.' });
        this.updatedCountryDetail = page.getByTestId('profile-country');
        this.firstNameInput = page.locator('#first-name');
        this.lastNameInput = page.locator('#last-name');
        this.emailInput = page.locator('#email');
        this.phoneInput = page.locator('#phone');
        this.phoneRadio = page.getByRole('radio', { name: 'Phone' });
        this.interestsCheckbox = page.getByRole('checkbox', { name: 'API testing' });
        this.bioField = page.locator('#bio');
        this.updatedFullNameDetail = page.getByTestId('profile-full-name');
    }

    async openMyProfile() {
        const myProfileUrl = pathToFileURL(resolve(__dirname, '../pages', 'profile.html')).href;
        await this.page.goto(myProfileUrl);
    }

    async selectCountry(country: string) {
        await this.countryDropdown.selectOption(country);
    }

    async clickEditButton() {
        await this.editButton.click();
    }

    async clickSaveButton() {
        await this.saveButton.click();
    }

    async clickResetButton() {
        await this.resetButton.click();
    }

    async resetProfile() {
        await this.clickResetButton();
        await this.resetAlert.waitFor();
    }

    async updatefirstName(firstName: string) {
        await this.firstNameInput.fill(firstName);
    }
    
    async updateLastName(lastName: string) {
        await this.lastNameInput.fill(lastName);
    }

    async updateEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async updatePhone(phone: string) {
        await this.phoneInput.fill(phone);
    }

    async clickRadioPhone() {
        await this.phoneRadio.click();
    }

    async clickInterestsCheckbox() {
        await this.interestsCheckbox.click();
    }

    async updateBio(bio: string) {
        await this.bioField.fill(bio);
    }

}