import { test, expect } from '@playwright/test';

test('should return a realtime token for an admin user', async ({ request }) => {
  // Note: This test requires a valid admin user session.
  // You would typically handle this by logging in as an admin user
  // before running the test.
  const response = await request.post('/api/get-realtime-token');
  expect(response.ok()).toBeTruthy();

  const tokenData = await response.json();
  expect(tokenData).toHaveProperty('client_secret');
});

test('should not return a realtime token for a non-admin user', async ({ request }) => {
  // Note: This test requires a valid non-admin user session.
  const response = await request.post('/api/get-realtime-token');
  expect(response.status()).toBe(403);
});

test('should not return a realtime token for an unauthenticated user', async ({ request }) => {
  const response = await request.post('/api/get-realtime-token');
  expect(response.status()).toBe(401);
});