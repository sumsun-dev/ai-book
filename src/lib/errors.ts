export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_CONTEXT_TOO_LONG: 'AI_CONTEXT_TOO_LONG',
  AI_GENERATION_CANCELLED: 'AI_GENERATION_CANCELLED',
  SAVE_FAILED: 'SAVE_FAILED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인해주세요',
  [ERROR_CODES.AI_RATE_LIMIT]: 'AI 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요',
  [ERROR_CODES.AI_CONTEXT_TOO_LONG]: '내용이 너무 깁니다. 내용을 줄여주세요',
  [ERROR_CODES.AI_GENERATION_CANCELLED]: 'AI 작성이 취소되었습니다',
  [ERROR_CODES.SAVE_FAILED]: '저장에 실패했습니다. 잠시 후 다시 시도합니다',
  [ERROR_CODES.QUOTA_EXCEEDED]: '이번 달 AI 사용량 한도에 도달했습니다.',
  [ERROR_CODES.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다',
}

export class AppError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode, message?: string) {
    super(message || ERROR_MESSAGES[code])
    this.code = code
    this.name = 'AppError'
  }
}

export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (error.name === 'AbortError' || message.includes('abort')) {
      return ERROR_CODES.AI_GENERATION_CANCELLED
    }

    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_CODES.NETWORK_ERROR
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return ERROR_CODES.AI_RATE_LIMIT
    }

    if (message.includes('too long') || message.includes('context')) {
      return ERROR_CODES.AI_CONTEXT_TOO_LONG
    }
  }

  return ERROR_CODES.UNKNOWN_ERROR
}

export function getErrorMessage(error: unknown): string {
  const code = getErrorCode(error)
  return ERROR_MESSAGES[code]
}
