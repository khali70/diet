import { expect, test } from '@playwright/test'

/**
 * These run against the built site at the GitHub Pages subpath. They exist to
 * catch the failures unit tests cannot see: a wrong base path, a route that
 * 404s on reload, data that does not survive a restart, and the app failing
 * with the network off.
 */

test('loads at the Pages subpath and shows the plan', async ({ page }) => {
  await page.goto('./')

  await expect(page.getByRole('heading', { name: 'أكل النهارده' })).toBeVisible()
  await expect(page.getByText('أرز')).toBeVisible()
})

test('renders right to left', async ({ page }) => {
  await page.goto('./')

  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
})

test('a logged meal survives a reload', async ({ page }) => {
  await page.goto('./')

  const riceLine = page.locator('li').filter({ hasText: 'أرز' }).first()
  await riceLine.getByRole('button', { name: 'سجل الباقي' }).click()
  await expect(riceLine.getByText('تمام')).toBeVisible()

  await page.reload()

  await expect(page.locator('li').filter({ hasText: 'أرز' }).first().getByText('تمام')).toBeVisible()
})

test('a deep link survives a reload, which is why routing is hash based', async ({ page }) => {
  await page.goto('./#/reference')
  await expect(page.getByRole('heading', { name: 'إرشادات الخطة' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'إرشادات الخطة' })).toBeVisible()
})

test('converts a plan line through the exchange calculator', async ({ page }) => {
  await page.goto('./')

  await page
    .locator('li')
    .filter({ hasText: 'أرز' })
    .first()
    .getByRole('link', { name: 'بدل' })
    .click()

  const results = page.getByRole('region', { name: 'تقدر تاكل بدالها' })
  await expect(results.getByText('بطاطس')).toBeVisible()
  // 150 g of planned rice is 150 * 260 / 60 = 650 g of potato.
  await expect(results.getByText('650 جم')).toBeVisible()
})

test('switches the interface to English and back', async ({ page }) => {
  await page.goto('./#/settings')

  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')

  await page.getByRole('button', { name: 'العربية' }).click()
  await expect(page.getByRole('heading', { name: 'الإعدادات' })).toBeVisible()
})

test('works with the network switched off', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'أكل النهارده' })).toBeVisible()

  // Give the service worker time to take control of the page.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 })

  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'أكل النهارده' })).toBeVisible()
  await context.setOffline(false)
})
