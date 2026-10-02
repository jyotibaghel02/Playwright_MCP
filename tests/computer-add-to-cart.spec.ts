import { test, expect } from '@playwright/test';

test('search computer, add first product to cart, and verify success message @e2e', async ({ page }) => {
  await page.goto('https://demowebshop.tricentis.com/');

  await page.locator('input.search-box-text').fill('computer');
  await page.locator('input[value="Search"]').click();

  const firstProductLink = page.locator('.product-item h2 a').first();
  await expect(firstProductLink).toBeVisible();
  await firstProductLink.click();

  const addToCartButton = page.locator('input[value="Add to cart"]').first();
  await expect(addToCartButton).toBeVisible();
  await addToCartButton.click();

  const successMessage = page.locator('.bar-notification.success');
  await expect(successMessage).toBeVisible();

  const messageText = (await successMessage.textContent()) ?? '';
  console.log('Success message:', messageText.trim());

  await expect(successMessage).toContainText('The product has been added to your shopping cart');
});
