import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('VentureFlow')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="email-input"]').fill('invalid@example.com')
    await page.locator('[data-testid="password-input"]').fill('wrongpassword')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 })
  })

  test('redirects unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Dashboard after login', () => {
  test('dashboard renders stat cards and activity feed', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/')

    // Stat cards
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)

    // Nav links present
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-contacts"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-ideas"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-notes"]')).toBeVisible()

    // Activity feed or empty state
    const hasFeed = await page.locator('[data-testid="activity-feed"]').isVisible()
    const hasEmpty = await page.locator('p:has-text("No activity yet")').isVisible()
    expect(hasFeed || hasEmpty).toBeTruthy()
  })
})
