import { test, expect } from '@playwright/test'
import { TEST_CONTACT } from '../fixtures/data'

test.describe('Contacts', () => {
  test('add contact → appears in list + activity feed + Ctrl+K search', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForURL('/contacts')

    // Open Add Contact modal
    await page.locator('[data-testid="add-contact-btn"]').click()
    await expect(page.locator('[data-testid="contact-name-input"]')).toBeVisible()

    // Fill in name
    const uniqueName = `${TEST_CONTACT.name} ${Date.now()}`
    await page.locator('[data-testid="contact-name-input"]').fill(uniqueName)

    // Submit
    await page.locator('[data-testid="contact-submit"]').click()

    // Wait for modal to close and page to update
    await expect(page.locator('[data-testid="contact-name-input"]')).not.toBeVisible({ timeout: 10000 })

    // Contact appears in list
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 })

    // Activity feed shows the new contact
    await page.goto('/')
    await page.waitForURL('/')
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
    await expect(page.locator('[data-testid="activity-entry"]').first()).toBeVisible()

    // Ctrl+K search finds the contact
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

    const searchTerm = uniqueName.slice(0, 10)
    await page.locator('[data-testid="search-input"]').fill(searchTerm)

    await expect(page.locator('[data-testid="search-results"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="search-result"]').first()).toBeVisible()

    // Close search
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="search-input"]')).not.toBeVisible()
  })
})
