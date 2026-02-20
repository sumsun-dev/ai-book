import { NextResponse } from 'next/server'
import { AppError, ERROR_CODES } from './errors'

export function handleApiError(
  error: unknown,
  context: Record<string, string> = {}
): NextResponse {
  console.error('API Error:', error)

  if (process.env.SENTRY_DSN) {
    import('@sentry/nextjs').then(({ captureException }) => {
      captureException(error, { tags: context })
    }).catch(() => {
      // Sentry import failed silently
    })
  }

  if (error instanceof AppError) {
    const status = error.code === ERROR_CODES.QUOTA_EXCEEDED ? 429 : 400
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status }
    )
  }

  const message = error instanceof Error ? error.message : 'Internal server error'

  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  )
}
