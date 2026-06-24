import { test, expect } from '@playwright/test';

test.describe('Todo App', () => {
    // Each test registers a brand-new account, so it starts authenticated with
    // an empty, isolated todo list. Registration redirects to the todo page.
    test.beforeEach(async ({ page }) => {
        const email = `e2e-${Date.now()}-${Math.floor(
            performance.now() * 1000,
        )}@example.com`;

        await page.goto('/register', { waitUntil: 'load' });
        await page.getByLabel('Email', { exact: true }).fill(email);
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('checkbox').check(); // Consent to GDPR
        await page.getByRole('button', { name: 'Register' }).click();

        // Land on the todo page (greeting is only shown once authenticated).
        await expect(page.locator('h1')).toBeVisible();
    });

    test('redirects unauthenticated users to the login page', async ({
        page,
    }) => {
        // A fresh context with no token should be bounced to /login.
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await page.goto('/', { waitUntil: 'load' });
        await expect(
            page.getByRole('button', { name: 'Log in' }),
        ).toBeVisible();
    });

    test('displays the greeting', async ({ page }) => {
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
        await expect(heading).toHaveText('Hello world!');
    });

    test('add button is disabled when input is empty', async ({ page }) => {
        const addButton = page.getByRole('button', { name: 'Add Item' });
        await expect(addButton).toBeDisabled();
    });

    test('can add a new todo item', async ({ page }) => {
        const itemName = `Test item ${Date.now()}`;
        const input = page.getByPlaceholder('New Item');
        const addButton = page.getByRole('button', { name: 'Add Item' });

        await input.fill(itemName);
        await expect(addButton).toBeEnabled();
        await addButton.click();

        await expect(page.getByText(itemName)).toBeVisible();
        await expect(input).toHaveValue('');
    });

    test('can toggle item completion', async ({ page }) => {
        const itemName = `Toggle item ${Date.now()}`;
        const input = page.getByPlaceholder('New Item');

        // Add an item
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add Item' }).click();
        await expect(page.getByText(itemName)).toBeVisible();

        // Find the item row and toggle it
        const itemRow = page.locator('.item', { hasText: itemName });
        const toggleButton = itemRow.getByRole('button', {
            name: 'Mark item as complete',
        });
        await toggleButton.click();

        // After toggle, the button label should change
        await expect(
            itemRow.getByRole('button', { name: 'Mark item as incomplete' }),
        ).toBeVisible();
    });

    test('can delete a todo item', async ({ page }) => {
        const itemName = `Delete item ${Date.now()}`;
        const input = page.getByPlaceholder('New Item');

        // Add an item
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add Item' }).click();
        await expect(page.getByText(itemName)).toBeVisible();

        // Delete it
        const itemRow = page.locator('.item', { hasText: itemName });
        await itemRow.getByRole('button', { name: 'Remove Item' }).click();

        // Item should disappear
        await expect(page.getByText(itemName)).not.toBeVisible();
    });

    test('shows empty state for a new account', async ({ page }) => {
        // A freshly registered user has no items yet.
        await expect(
            page.getByText('No items yet! Add one above!'),
        ).toBeVisible();
    });

    test('can delete the account (RGPD erasure)', async ({ page }) => {
        // Add an item so the cascade purge has something to remove.
        await page.getByPlaceholder('New Item').fill('To be erased');
        await page.getByRole('button', { name: 'Add Item' }).click();
        await expect(page.getByText('To be erased')).toBeVisible();

        await page.getByRole('link', { name: 'My account' }).click();

        // Auto-accept the confirmation dialog.
        page.on('dialog', (dialog) => dialog.accept());
        await page
            .getByRole('button', { name: 'Delete my account' })
            .click();

        // Back to the login screen once the account is gone.
        await expect(
            page.getByRole('button', { name: 'Log in' }),
        ).toBeVisible();
    });
});
