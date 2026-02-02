import { ISBNComponents, ISBNData } from '@/types/book'

/**
 * ISBN-13 체크 디지트 계산
 * @param isbn12 처음 12자리 숫자
 * @returns 체크 디지트 (0-9)
 */
export function calculateISBN13CheckDigit(isbn12: string): string {
  const digits = isbn12.replace(/\D/g, '')
  if (digits.length !== 12) {
    throw new Error('ISBN-13 체크 디지트 계산을 위해 12자리가 필요합니다.')
  }

  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }

  const remainder = sum % 10
  return remainder === 0 ? '0' : (10 - remainder).toString()
}

/**
 * ISBN-10 체크 디지트 계산
 * @param isbn9 처음 9자리 숫자
 * @returns 체크 디지트 (0-9 또는 X)
 */
export function calculateISBN10CheckDigit(isbn9: string): string {
  const digits = isbn9.replace(/\D/g, '')
  if (digits.length !== 9) {
    throw new Error('ISBN-10 체크 디지트 계산을 위해 9자리가 필요합니다.')
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }

  const remainder = (11 - (sum % 11)) % 11
  return remainder === 10 ? 'X' : remainder.toString()
}

/**
 * ISBN-13 유효성 검증
 */
export function validateISBN13(isbn: string): boolean {
  const digits = isbn.replace(/\D/g, '')
  if (digits.length !== 13) return false

  // 978 또는 979로 시작해야 함
  if (!digits.startsWith('978') && !digits.startsWith('979')) return false

  // 체크 디지트 검증
  const checkDigit = calculateISBN13CheckDigit(digits.substring(0, 12))
  return checkDigit === digits[12]
}

/**
 * ISBN-10 유효성 검증
 */
export function validateISBN10(isbn: string): boolean {
  const normalized = isbn.replace(/\D/g, '').toUpperCase().replace(/X/g, 'X')
  if (normalized.length !== 10) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(normalized[i]) * (10 - i)
  }

  const lastChar = normalized[9]
  const lastValue = lastChar === 'X' ? 10 : parseInt(lastChar)
  sum += lastValue

  return sum % 11 === 0
}

/**
 * ISBN-10을 ISBN-13으로 변환
 */
export function convertISBN10to13(isbn10: string): string {
  const digits = isbn10.replace(/\D/g, '')
  if (digits.length !== 10) {
    throw new Error('유효한 ISBN-10이 아닙니다.')
  }

  const isbn12 = '978' + digits.substring(0, 9)
  const checkDigit = calculateISBN13CheckDigit(isbn12)
  return isbn12 + checkDigit
}

/**
 * ISBN-13을 ISBN-10으로 변환 (978로 시작하는 경우만 가능)
 */
export function convertISBN13to10(isbn13: string): string | null {
  const digits = isbn13.replace(/\D/g, '')
  if (digits.length !== 13 || !digits.startsWith('978')) {
    return null // 979로 시작하는 ISBN-13은 ISBN-10으로 변환 불가
  }

  const isbn9 = digits.substring(3, 12)
  const checkDigit = calculateISBN10CheckDigit(isbn9)
  return isbn9 + checkDigit
}

/**
 * ISBN-13 파싱 (구성 요소 분리)
 */
export function parseISBN13(isbn: string): ISBNComponents | null {
  const digits = isbn.replace(/\D/g, '')
  if (digits.length !== 13) return null

  // 한국 ISBN의 경우 (978-89-xxxxx-xx-x)
  // 실제로는 등록 그룹에 따라 다양한 형식이 있음
  // 여기서는 한국 표준 형식을 가정

  const prefix = digits.substring(0, 3)      // 978 또는 979
  const groupCode = digits.substring(3, 5)   // 국가/언어 그룹 (89 = 한국)
  const registrant = digits.substring(5, 10) // 출판사 코드 (가변 길이, 여기서는 5자리 가정)
  const publication = digits.substring(10, 12) // 도서 코드
  const checkDigit = digits.substring(12, 13)

  return {
    prefix,
    groupCode,
    registrant,
    publication,
    checkDigit,
  }
}

/**
 * ISBN 포맷팅 (하이픈 포함)
 * 한국 ISBN 형식: 978-89-xxxxx-xx-x
 */
export function formatISBN(isbn: string): string {
  const digits = isbn.replace(/\D/g, '')

  if (digits.length === 13) {
    // ISBN-13: 978-89-xxxxx-xx-x (한국 표준)
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`
  }

  if (digits.length === 10) {
    // ISBN-10: 89-xxxxx-xx-x
    return `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }

  return isbn
}

/**
 * ISBN 정규화 (하이픈 제거)
 */
export function normalizeISBN(isbn: string): string {
  return isbn.replace(/\D/g, '')
}

/**
 * 드래프트 ISBN 생성 (개발/테스트용)
 * 실제 ISBN은 국제 ISBN 기관을 통해 발급받아야 함
 */
export function generateDraftISBN(publisherCode: string = '00000'): string {
  const prefix = '978'
  const groupCode = '89' // 한국
  const registrant = publisherCode.padStart(5, '0').substring(0, 5)
  const publication = Math.floor(Math.random() * 100).toString().padStart(2, '0')

  const isbn12 = `${prefix}${groupCode}${registrant}${publication}`
  const checkDigit = calculateISBN13CheckDigit(isbn12)

  return isbn12 + checkDigit
}

/**
 * ISBN 입력 검증 및 파싱
 */
export function validateAndParseISBN(input: string): {
  isValid: boolean
  isbn13?: string
  isbn10?: string
  components?: ISBNComponents
  error?: string
} {
  const normalized = normalizeISBN(input)

  if (normalized.length === 10) {
    if (!validateISBN10(input)) {
      return { isValid: false, error: '유효하지 않은 ISBN-10입니다.' }
    }
    const isbn13 = convertISBN10to13(normalized)
    const components = parseISBN13(isbn13)
    return {
      isValid: true,
      isbn13,
      isbn10: normalized,
      components: components || undefined,
    }
  }

  if (normalized.length === 13) {
    if (!validateISBN13(normalized)) {
      return { isValid: false, error: '유효하지 않은 ISBN-13입니다.' }
    }
    const isbn10 = convertISBN13to10(normalized)
    const components = parseISBN13(normalized)
    return {
      isValid: true,
      isbn13: normalized,
      isbn10: isbn10 || undefined,
      components: components || undefined,
    }
  }

  return { isValid: false, error: 'ISBN은 10자리 또는 13자리여야 합니다.' }
}
