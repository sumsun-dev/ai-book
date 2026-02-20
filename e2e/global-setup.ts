import { execSync } from 'child_process'
import path from 'path'

export default async function globalSetup() {
  const projectRoot = path.resolve(__dirname, '..')
  const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL

  if (!dbUrl) {
    throw new Error('DATABASE_URL_TEST or DATABASE_URL required for E2E tests')
  }

  process.env.DATABASE_URL = dbUrl

  // Push schema to test database (creates or updates tables)
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: dbUrl,
    },
    stdio: 'pipe',
  })
}
