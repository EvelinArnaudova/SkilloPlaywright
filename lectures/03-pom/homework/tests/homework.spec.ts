import { test , expect } from '@playwright/test';
import { AccountPage } from '../page-objects/AccountPage';
import { LoginPage } from '../page-objects/LoginPage';
import { OrdersPage } from '../page-objects/OrdersPage';

test.describe('Northwind Supply partner portal', () => {
	let loginPage: LoginPage;
	let accountPage: AccountPage;
	let ordersPage: OrdersPage;

	test.beforeEach(async ({ page }) => {
			loginPage = new LoginPage(page);
			accountPage = new AccountPage(page);
			ordersPage = new OrdersPage(page);
			await loginPage.navigate();
		});

	test('signs in with valid credentials and opens the orders dashboard', async ({ page }) => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await expect(page).toHaveURL(/index.html/);
	});

	test('shows an error message for an incorrect password', async () => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2027');
		await expect(loginPage.errorMessage).toHaveText('Email or password is incorrect.');
	});

	test('lists all 8 orders in the grid after sign in', async ({page}) => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await expect(page).toHaveURL(/index.html/);
		await expect(ordersPage.ordersTableRows).toHaveCount(8);
		await ordersPage.listOrders();
		expect(await ordersPage.getOrderIds()).toEqual([
			'NW-1042', 'NW-1043', 'NW-1044', 'NW-1045', 'NW-1046', 'NW-1047', 'NW-1048', 'NW-1049'
		]);
	});

	test('able to filter the orders grid by customer name and status', async ({ page }) => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await expect(page).toHaveURL(/index.html/);
		await expect(ordersPage.ordersTableRows).toHaveCount(8);

		await ordersPage.filterByCustomer('Bluebird');
		await expect(ordersPage.ordersTableRows).toHaveCount(2);

		await ordersPage.filterByStatus('Paid');
		await expect(ordersPage.ordersTableRows).toHaveCount(1);
		expect(await ordersPage.getOrderIds()).toEqual(['NW-1042']);
	});

	test('able to sort orders by total from highest to lowest', async ({ page }) => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await expect(page).toHaveURL(/index.html/);
		await ordersPage.sortByTotal();
		await expect(ordersPage.descendingTotalFilter).toBeVisible();
	});

	test('updates the phone number on the account page and shows it in the summary', async () => {

		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await accountPage.navigateToAccountPage();
		await accountPage.updatePhoneNumber('123-456-7890');
		await expect(accountPage.successAlert).toHaveText('Your details have been saved.');
	});

	test('signs out and redirects to sign in when the orders page is opened again', async ({ page }) => {
		await loginPage.login('alex.morgan@example.test', 'Northwind#2026');
		await expect(page).toHaveURL(/index.html/);
		await ordersPage.signOut();
		await expect(page).toHaveURL(/login.html/);
		await ordersPage.navigateToOrdersPage();
		await expect(page).toHaveURL(/login.html/);
		await expect(loginPage.signInButton).toBeVisible();
	});
});
