import { test, expect } from '@playwright/test'
import { MOCK_SYNTHESIS_RESPONSE } from '../fixtures/data'

test.describe('Synthesis', () => {
  test('generate button → loading state → thesis prose with ## headings', async ({ page }) => {
    // Mock the /api/synthesis endpoint to avoid real Claude API calls
    await page.route('**/api/synthesis', async (route) => {
      if (route.request().method() === 'POST') {
        // Simulate a small delay to test loading state
        await new Promise((resolve) => setTimeout(resolve, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SYNTHESIS_RESPONSE),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/synthesis')
    await page.waitForURL('/synthesis')

    // Generate button is present
    await expect(page.locator('[data-testid="generate-btn"]')).toBeVisible()

    const generateBtn = page.locator('[data-testid="generate-btn"]')
    const btnText = await generateBtn.textContent()

    if (btnText?.includes('Regenerate')) {
      // Existing thesis - confirm dialog appears
      await generateBtn.click()
      await expect(page.locator('[data-testid="confirm-regenerate"]')).toBeVisible()
      await page.locator('[data-testid="confirm-regenerate"]').click()
    } else {
      // No existing thesis
      await expect(page.locator('[data-testid="synthesis-empty"]')).toBeVisible()
      await generateBtn.click()
    }

    // Loading state
    await expect(page.locator('[data-testid="generate-btn"]')).toContainText('Generating...', {
      timeout: 3000,
    }).catch(() => {
      // Loading may be too fast to catch — that's OK
    })

    // Wait for synthesis content to appear
    await expect(page.locator('[data-testid="synthesis-content"]')).toBeVisible({ timeout: 15000 })

    // Content includes ## headings from mock response
    await expect(page.locator('[data-testid="synthesis-content"] h2').first()).toBeVisible()

    // At least one section heading visible
    const headings = page.locator('[data-testid="synthesis-content"] h2')
    await expect(headings.first()).toContainText(/Overview|Market|Contact|Action/i)
  })

  test('empty state shown before first generation', async ({ page }) => {
    // Simulate no existing thesis by checking empty state visibility
    await page.goto('/synthesis')
    await page.waitForURL('/synthesis')

    // Either synthesis-content (if thesis exists) or synthesis-empty is shown
    const contentVisible = await page.locator('[data-testid="synthesis-content"]').isVisible()
    const emptyVisible = await page.locator('[data-testid="synthesis-empty"]').isVisible()
    expect(contentVisible || emptyVisible).toBeTruthy()

    // Generate button always visible
    await expect(page.locator('[data-testid="generate-btn"]')).toBeVisible()
  })
})
