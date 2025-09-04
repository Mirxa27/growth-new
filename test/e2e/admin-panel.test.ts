import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as an admin user before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should display the admin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Admin Dashboard');
  });

  test('should allow an admin to view and update voice agent settings', async ({ page }) => {
    await page.click('text="Voice Agent"');
    await expect(page.locator('h2')).toHaveText('Voice Agent Settings');

    // Update a setting
    await page.fill('input[name="model"]', 'gpt-4');
    await page.click('button:has-text("Save")');

    // Verify the setting was updated
    await page.reload();
    await expect(page.locator('input[name="model"]')).toHaveValue('gpt-4');
  });

  test('should allow an admin to view general settings', async ({ page }) => {
    await page.click('text="General Settings"');
    await expect(page.locator('h2')).toHaveText('General Settings');
  });

  test('should allow an admin to use the live preview', async ({ page }) => {
    await page.click('text="Live Preview"');
    await expect(page.locator('div:has-text("Disconnected")')).toBeVisible();

    // Start a call
    await page.click('button:has-text("Phone")');
    await expect(page.locator('div:has-text("Connected")')).toBeVisible();

    // End the call
    await page.click('button:has-text("PhoneOff")');
    await expect(page.locator('div:has-text("Disconnected")')).toBeVisible();
  });
});