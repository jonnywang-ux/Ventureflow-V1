import { test as base } from '@playwright/test'
import path from 'path'

export const test = base.extend({
  storageState: path.join(__dirname, '../.auth/user.json'),
})

export { expect } from '@playwright/test'
