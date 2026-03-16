import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { MOCK_IMPORT_RESPONSE } from '../fixtures/data'

test.describe('Import', () => {
  test('upload .docx → extracted results appear → save as Note → appears in Notes tab', async ({ page }) => {
    // Mock the /api/import endpoint to avoid real Claude API calls
    await page.route('**/api/import', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_IMPORT_RESPONSE),
      })
    })

    // Mock the /api/notes creation (server action via form submission - not mocked, uses real DB)

    await page.goto('/import')
    await page.waitForURL('/import')

    // Create a minimal test .docx file in memory (just bytes)
    // Use a Buffer that resembles a valid file for the file input
    const tmpDir = path.join(process.cwd(), 'tests', '.tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    const testFilePath = path.join(tmpDir, 'test-document.docx')

    // Write minimal file content (Playwright just needs the file to exist for setInputFiles)
    fs.writeFileSync(testFilePath, 'Test document content for E2E testing')

    try {
      // Set file on the hidden input
      await page.locator('[data-testid="file-input"]').setInputFiles(testFilePath)

      // Verify file selected (upload button should now be enabled)
      await expect(page.locator('[data-testid="upload-btn"]')).toBeEnabled()

      // Click upload
      await page.locator('[data-testid="upload-btn"]').click()

      // Wait for results to appear
      await expect(page.locator('[data-testid="import-results"]')).toBeVisible({ timeout: 15000 })

      // Extracted title shows
      await expect(page.locator('[data-testid="extracted-title"]')).toContainText(
        MOCK_IMPORT_RESPONSE.data.structured.title
      )

      // Save to Notes
      await page.locator('[data-testid="save-note-btn"]').click()

      // Should redirect to /notes
      await page.waitForURL('/notes', { timeout: 15000 })

      // The saved note should appear in the notes list
      await expect(page.locator('[data-testid="note-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="note-card"]').first()).toBeVisible()
    } finally {
      // Clean up temp file
      if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath)
    }
  })
})
