import fs from 'fs'
import path from 'path'

export default async function globalTeardown() {
  // Only clean up in CI environments
  if (process.env.CI) {
    const dbPath = path.resolve(__dirname, '..', 'prisma', 'test-e2e.db')
    const journalPath = `${dbPath}-journal`
    const walPath = `${dbPath}-wal`

    for (const filePath of [dbPath, journalPath, walPath]) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
  }
}
