import { execSync } from 'child_process'
import path from 'path'

export default async function globalSetup() {
  const projectRoot = path.resolve(__dirname, '..')

  // Set DATABASE_URL for test-e2e.db
  process.env.DATABASE_URL = 'file:./prisma/test-e2e.db'

  // Push schema to test-e2e.db (creates or updates the database)
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/test-e2e.db',
    },
    stdio: 'pipe',
  })
}
