import { test, expect } from '@playwright/test';

test.describe('Todo App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
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

    test('shows empty state when no items exist', async ({ page }) => {
        // Use the API to clean all items (with retry for CI stability)
        const items = await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
                const res = await fetch('/api/items');
                if (res.ok) return res.json();
                await new Promise((r) => setTimeout(r, 1000));
            }
            return [];
        });
        for (const item of items) {
            await page.evaluate(
                (id) => fetch(`/api/items/${id}`, { method: 'DELETE' }),
                item.id,
            );
        }

        // Reload to see empty state
        await page.reload({ waitUntil: 'networkidle' });

        await expect(
            page.getByText('No items yet! Add one above!'),
        ).toBeVisible();
    });
});
