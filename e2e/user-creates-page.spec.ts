import { test, Page, BrowserContext } from '@playwright/test';

import { createDefaultUser } from './helpers';

let page: Page;
let context: BrowserContext;

test.describe('user creating a page', async () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('/');
    await createDefaultUser({ page, context });
  });

  test('has title', async () => {
    await page.getByLabel('Create a new page').click();

    let current = await page
      .locator('div')
      .filter({ hasText: /^Start typing here$/ })
      .nth(1);

    await current.click();

    current = await page.getByRole('textbox').nth(1);
    await current.pressSequentially('# Roadmap', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').nth(2);
    await current.pressSequentially('## 1 - Feature X (Weeks 1 - 2)', {
      delay: 100,
    });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('### Tasks', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('* Task 1', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('Task 2', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.press('Tab', { delay: 100 });
    await current.pressSequentially('Sub-task 2a', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.press('Shift+Tab', { delay: 100 });
    await current.pressSequentially('Task 3');
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('### Status', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('[] Not started', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('In Progress', { delay: 100 });
    await current.press('Enter');

    current = await page.getByRole('textbox').last();
    await current.pressSequentially('Done', { delay: 100 });
    await current.press('Enter');

    await page.reload();

    await page.getByText('Roadmap').isVisible();
    await page.getByText('1 - Feature X (Weeks 1 - 2)').isVisible();
    await page.getByText('Tasks').isVisible();
    await page.getByText('Task 1').isVisible();
    await page.getByText('Task 2').isVisible();
    await page.getByText('Sub-task 2a').isVisible();
    await page.getByText('Task 3').isVisible();
    await page.getByText('Status').isVisible();
    await page.getByText('Not started').isVisible();
    await page.getByText('In Progress').isVisible();
    await page.getByText('Done').isVisible();
  });
});
