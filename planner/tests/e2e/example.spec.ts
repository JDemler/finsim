import { test, expect } from '@playwright/test';

test('has title and essential components', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Planner/);
  await expect(page.locator('app-monte-carlo-simulation')).toBeVisible();
  await expect(page.locator('app-moneydisplay')).toBeVisible();
});
