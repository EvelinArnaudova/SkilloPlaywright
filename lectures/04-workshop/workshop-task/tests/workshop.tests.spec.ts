import { test, expect } from '@playwright/test';
import { Registration } from '../page-objects/Registration';
import { MyProfile } from '../page-objects/MyProfile';

test.describe('My Profile page tests', () => {
    let myProfile: MyProfile;

    test.beforeEach(async ({ page }) => {
        myProfile = new MyProfile(page);
        await myProfile.openMyProfile();
    });

    test('Navigate to My profile page', async () => {
        await expect(myProfile.heading).toHaveText('My profile');
        await expect(myProfile.editButton).toBeVisible();
    });

    test('Edit country in My Profile', async () => {
        await myProfile.clickEditButton();
        await myProfile.selectCountry('United Kingdom');
        await myProfile.clickSaveButton();
        await expect(myProfile.successAlert).toBeVisible();
        await expect(myProfile.updatedCountryDetail).toHaveText('United Kingdom');
    });

    test('Reset profile', async () => {
        await myProfile.resetProfile();
        await expect(myProfile.resetAlert).toBeVisible();
    });

    test('Update first and last name in profile details', async () => {
        await myProfile.clickEditButton();
        await myProfile.updatefirstName('John');
        await myProfile.updateLastName('Doe');
        await myProfile.clickSaveButton();
        await expect(myProfile.successAlert).toBeVisible();
        await expect(myProfile.updatedFullNameDetail).toHaveText('John Doe');
       
    });

});

test.describe('Registration page tests', () => {
    let registration: Registration;

    test.beforeEach(async ({ page }) => {
        registration = new Registration(page);
        await registration.navigate();
    });
    
    test('Register for a workshop', async () => {
        await registration.navigate();
        await registration.selectWorkshop('API Testing (€150)');
        await registration.selectDate('17 March 2026');
        await registration.selectTicket();
        await registration.selectNumberOfSeats(2);
        await registration.addLunchAddOn();
        await registration.updateFullName('John Doe');
        await registration.updateEmail('john.doe@example.com');
        await registration.updateNotes('Looking forward to the workshop!');
        await registration.updateStudentID('S-12345');
        await registration.acceptTerms();
        await registration.clickRegister();

        //add expect
    });


});