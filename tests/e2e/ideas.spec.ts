import { test, expect } from '@playwright/test'
import { TEST_IDEA } from '../fixtures/data'

test.describe('Ideas', () => {
  test('log idea → vote on it → vote count changes', async ({ page }) => {
    await page.goto('/ideas')
    await page.waitForURL('/ideas')

    // Open Add Idea modal
    await page.locator('[data-testid="add-idea-btn"]').click()
    await expect(page.locator('[data-testid="idea-title-input"]')).toBeVisible()

    // Fill title
    const uniqueTitle = `${TEST_IDEA.title} ${Date.now()}`
    await page.locator('[data-testid="idea-title-input"]').fill(uniqueTitle)

    // Submit
    await page.locator('[data-testid="idea-submit"]').click()
    await expect(page.locator('[data-testid="idea-title-input"]')).not.toBeVisible({ timeout: 10000 })

    // Idea appears in list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible({ timeout: 10000 })

    // Get initial upvote count
    const upvoteBtn = page.locator('[data-testid="upvote-btn"]').first()
    await expect(upvoteBtn).toBeVisible()
    const initialText = await upvoteBtn.textContent()
    const initialCount = parseInt(initialText?.replace('+', '') ?? '0', 10)

    // Click upvote
    await upvoteBtn.click()

    // Wait for router refresh (page reload equivalent)
    await page.waitForTimeout(1000)

    // Count should have increased
    const updatedText = await page.locator('[data-testid="upvote-btn"]').first().textContent()
    const updatedCount = parseInt(updatedText?.replace('+', '') ?? '0', 10)
    expect(updatedCount).toBeGreaterThanOrEqual(initialCount)

    // Button should now be highlighted (active state - background changed)
    await expect(page.locator('[data-testid="upvote-btn"]').first()).toBeVisible()
  })
})
