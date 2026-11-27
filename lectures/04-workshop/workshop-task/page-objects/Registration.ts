import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Locator, type Page } from '@playwright/test';


export class Registration {
    readonly heading: Locator;
    readonly workshopDropdown: Locator;
    readonly dateDropdown: Locator;
    readonly ticketRadioStudent: Locator;
    readonly numberOfSeatsInput: Locator;
    readonly lunchAddOnCheckbox: Locator;
    readonly fullNameInput: Locator;
    readonly emailInput: Locator;
    readonly notesInput: Locator;
    readonly registerButton: Locator;
    readonly clearFormButton: Locator;
    readonly termsCheckbox: Locator;
    readonly studentIDinput: Locator;
    
    
    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', { name: 'Workshop registration' });
        this.workshopDropdown = page.locator('#workshop');
        this.dateDropdown = page.locator('#date');
        this.ticketRadioStudent = page.locator('input[value="Student"]');
        this.numberOfSeatsInput = page.locator('#seats');
        this.lunchAddOnCheckbox = page.getByRole('checkbox', { name: 'Lunch (+€15 per seat)' });
        this.fullNameInput = page.locator('#full-name');
        this.emailInput = page.locator('#email');
        this.notesInput = page.locator('#notes');
        this.registerButton = page.locator('#register-button');
        this.clearFormButton = page.getByRole('button', { name: 'Clear form' });
        this.termsCheckbox = page.locator('#terms');
        this.studentIDinput = page.locator('#student-id');

    }

    async navigate() {
        const registrationUrl = pathToFileURL(resolve(__dirname, '../pages', 'registration.html')).href;
        await this.page.goto(registrationUrl);
    }

    async selectWorkshop(option: string) {
        await this.workshopDropdown.selectOption(option);
    }

    async selectDate(date: string) {
        await this.dateDropdown.selectOption(date);
    }

    async selectTicket() {
        await this.ticketRadioStudent.check();
    }

    async selectNumberOfSeats(seats: number) {
        await this.numberOfSeatsInput.fill(seats.toString());
    }

    async addLunchAddOn() {
        await this.lunchAddOnCheckbox.check();
    }

    async updateFullName(fullName: string) {
        await this.fullNameInput.fill(fullName);
    }

    async updateEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async updateNotes(notes: string) {
        await this.notesInput.fill(notes);
    }

    async clickRegister() {
        await this.registerButton.click();
    }

    async clickClearForm() {
        await this.clearFormButton.click();
    }

    async acceptTerms() {
        await this.termsCheckbox.check();
    }

    async updateStudentID(studentID: string) {
        await this.studentIDinput.fill(studentID);
    }
}
