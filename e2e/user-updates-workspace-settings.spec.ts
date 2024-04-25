import { test, Page, BrowserContext, expect } from '@playwright/test';

import { createDefaultUser } from './helpers';

let page: Page;
let context: BrowserContext;

test.describe('workspace admin updating workspace settings', async () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await createDefaultUser({ page, context });
  });

  test('has changes persisted to the backend', async () => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByLabel('Name').fill('Stellar');
    // await page.getByLabel('Settings').click();

    expect(await page.getByRole('radio', { name: 'Private' })).toBeChecked();

    await page.getByRole('radio', { name: 'Public' }).click();

    // Reload the page to make sure the settings are saved
    await page.goto('/settings');

    expect(await page.getByLabel('Name')).toHaveValue('Stellar');
    expect(
      await page.getByRole('radio', { name: 'Private' })
    ).not.toBeChecked();
    expect(await page.getByRole('radio', { name: 'Public' })).toBeChecked();
  });
});
