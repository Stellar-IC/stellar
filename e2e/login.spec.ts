import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Stellar/);
});

test('get started link', async ({ page, context }) => {
  await page.goto('/');

  const pagePromise = context.waitForEvent('page');

  // Click the get started link.
  await page.getByRole('button', { name: 'Get started' }).click();

  const iiPage = await pagePromise;
  await iiPage.waitForLoadState();
  await iiPage
    .getByRole('button', { name: 'Create Internet Identity' })
    .click();
  await iiPage.getByRole('button', { name: 'Create Passkey' }).click();
  await iiPage.fill('input[id=captchaInput]', 'a');
  await iiPage.getByRole('button', { name: 'Next' }).click();
  await iiPage.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('heading', { name: "Let's get started" }).click();
  await page.getByLabel('username').fill(`user_${Date.now()}`);
  await page.getByRole('button', { name: 'Submit', disabled: false }).click();
  await page
    .getByText('Workspace')
    .waitFor({ state: 'visible', timeout: 10000 });
});
