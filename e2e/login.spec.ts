import { test, expect, Page, BrowserContext } from '@playwright/test';

import { createDefaultUser, login } from './helpers';

let page: Page;
let context: BrowserContext;
let userNumber: number;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  await page.goto('/');
  userNumber = await createDefaultUser({ page, context });
});

test('has title', async () => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Stellar/);
});

test('get started link', async () => {
  await page.goto('/');
  await login({ page, context }, { useExisitingIdentity: userNumber });
  await page
    .getByText('Workspace')
    .waitFor({ state: 'visible', timeout: 30000 });
});
