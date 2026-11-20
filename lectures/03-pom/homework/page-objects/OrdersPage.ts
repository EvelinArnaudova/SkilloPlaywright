import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Locator, type Page } from '@playwright/test';


export type Order = {
	id: string;
	customer: string;
	date: string;
	status: string;
	total: string;
};

export class OrdersPage {
	readonly ordersTableRows: Locator;
	readonly searchInput: Locator;
	readonly statusSelect: Locator;
	readonly resultsCount: Locator;
    readonly ordersTotalFilter: Locator;
    readonly descendingTotalFilter: Locator;

	constructor(private readonly page: Page) {
		this.ordersTableRows = page.locator('#orders-table tbody tr');
		this.searchInput = page.getByLabel('Search customer');
		this.statusSelect = page.getByLabel('Status');
		this.resultsCount = page.getByRole('status');
		this.ordersTotalFilter = page.getByRole('button', { name: 'Total' });
		this.descendingTotalFilter = page.locator('th[aria-sort="descending"]');
	}

    async sortByTotal(): Promise<void> {
        await this.ordersTotalFilter.click();
    }

    async isSortedDescendingByTotal(): Promise<boolean> {
        return await this.descendingTotalFilter.isVisible();
    }

	async filterByCustomer(name: string): Promise<void> {
		await this.searchInput.fill(name);
	}

	async filterByStatus(status: string): Promise<void> {
		await this.statusSelect.selectOption(status);
	}

	async getOrders(): Promise<Order[]> {
		const rows = await this.ordersTableRows.all();
		return Promise.all(
			rows.map(async (row) => {
				const cells = row.locator('td');
				return {
					id: await cells.nth(0).innerText(),
					customer: await cells.nth(1).innerText(),
					date: await cells.nth(2).innerText(),
					status: await cells.nth(3).innerText(),
					total: await cells.nth(4).innerText(),
				};
			}),
		);
	}
	async listOrders(): Promise<Order[]> {
		const orders = await this.getOrders();
		console.table(orders);
		return orders;
	}

	async getOrderIds(): Promise<string[]> {
		return (await this.getOrders()).map((order) => order.id);
	}
}

