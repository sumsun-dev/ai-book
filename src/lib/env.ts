import { z } from 'zod'

const serverEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  DATABASE_URL: z.string().default('file:./prisma/dev.db'),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedEnv: ServerEnv | null = null

function getEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv

  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n')
    throw new Error(`Environment variable validation failed:\n${messages}`)
  }

  cachedEnv = result.data
  return cachedEnv
}

export const env: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string) {
    const envObj = getEnv()
    return envObj[prop as keyof ServerEnv]
  },
})

export function resetEnv(): void {
  cachedEnv = null
}
