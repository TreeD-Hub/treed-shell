import { expect, test } from '@playwright/test'

test('shell frame matches 960x544 contract', async ({ page }) => {
  await page.goto('/')

  const shell = page.getByTestId('screen-shell')
  await expect(shell).toBeVisible()

  const box = await shell.boundingBox()

  expect(box?.width).toBe(960)
  expect(box?.height).toBe(544)
})
