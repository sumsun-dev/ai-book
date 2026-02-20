export default async function globalTeardown() {
  // PostgreSQL: no file cleanup needed
  // Schema is recreated by `prisma db push` on next run
}
