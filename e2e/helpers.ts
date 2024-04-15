import { PlaywrightTestArgs } from '@playwright/test';

export const createDefaultUser = async (
  { page, context }: Pick<PlaywrightTestArgs, 'context' | 'page'>,
  options: {
    username?: string;
  } = {}
) => {
  const { username = `user_${Date.now()}` } = options;

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

  const userNumber = await iiPage.getByLabel('usernumber');
  const userNumberParsed = parseInt(await userNumber.innerText(), 10);
  await iiPage.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('heading', { name: "Let's get started" }).click();
  await page.getByLabel('username').fill(username);
  await page.getByRole('button', { name: 'Submit', disabled: false }).click();

  return userNumberParsed;
};

export const login = async (
  { page, context }: Pick<PlaywrightTestArgs, 'context' | 'page'>,
  options: {
    useExisitingIdentity?: number;
    username?: string;
  } = {}
) => {
  const { username = `user_${Date.now()}` } = options;

  await page.goto('/');

  const pagePromise = context.waitForEvent('page');

  // Click the get started link.
  await page.getByRole('button', { name: 'Get started' }).click();

  const iiPage = await pagePromise;
  await iiPage.waitForLoadState();

  if (options.useExisitingIdentity) {
    if (
      // Check if button with the usernumber is visible
      await iiPage
        .getByRole('button', {
          name: options.useExisitingIdentity.toString(),
        })
        .isVisible()
    ) {
      // Click the button with the usernumber
      await iiPage
        .getByRole('button', {
          name: options.useExisitingIdentity.toString(),
        })
        .click();
    } else {
      // Click the "Use existing" button and fill the usernumber
      await iiPage.getByRole('button', { name: 'Use existing' }).click();
      await iiPage
        .getByPlaceholder('Internet Identity')
        .fill(options.useExisitingIdentity.toString());
    }

    await iiPage.getByRole('button', { name: 'Continue', exact: true }).click();
    await iiPage
      .getByRole('button', { name: 'Remind me later', exact: true })
      .click();

    return;
  }

  await iiPage
    .getByRole('button', { name: 'Create Internet Identity' })
    .click();
  await iiPage.getByRole('button', { name: 'Create Passkey' }).click();
  await iiPage.fill('input[id=captchaInput]', 'a');
  await iiPage.getByRole('button', { name: 'Next' }).click();
  await iiPage.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('heading', { name: "Let's get started" }).click();
  await page.getByLabel('username').fill(username);
  await page.getByRole('button', { name: 'Submit', disabled: false }).click();
};
