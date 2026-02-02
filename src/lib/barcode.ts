import JsBarcode from 'jsbarcode'
import { formatISBN, normalizeISBN } from './isbn'

interface BarcodeOptions {
  width?: number
  height?: number
  fontSize?: number
  background?: string
  lineColor?: string
  margin?: number
  displayValue?: boolean
  format?: 'EAN13' | 'CODE128'
}

const DEFAULT_OPTIONS: BarcodeOptions = {
  width: 2,
  height: 100,
  fontSize: 16,
  background: '#ffffff',
  lineColor: '#000000',
  margin: 10,
  displayValue: true,
  format: 'EAN13',
}

/**
 * SVG 바코드 생성
 */
export function generateBarcodeSVG(isbn: string, options: BarcodeOptions = {}): string {
  const normalized = normalizeISBN(isbn)
  if (normalized.length !== 13) {
    throw new Error('바코드 생성을 위해 ISBN-13이 필요합니다.')
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 서버/클라이언트 환경에 따라 다르게 처리
  if (typeof document !== 'undefined') {
    // 브라우저 환경
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svg, normalized, {
      format: opts.format,
      width: opts.width,
      height: opts.height,
      fontSize: opts.fontSize,
      background: opts.background,
      lineColor: opts.lineColor,
      margin: opts.margin,
      displayValue: opts.displayValue,
      text: formatISBN(normalized),
    })
    return svg.outerHTML
  } else {
    // Node.js 환경 - 문자열로 SVG 생성
    // JsBarcode는 브라우저 환경에서만 완전히 작동
    // 서버에서는 간단한 placeholder 반환
    return createPlaceholderSVG(normalized, opts)
  }
}

/**
 * Data URL 바코드 생성 (브라우저 전용)
 */
export function generateBarcodeDataURL(isbn: string, options: BarcodeOptions = {}): string {
  if (typeof document === 'undefined') {
    throw new Error('generateBarcodeDataURL은 브라우저 환경에서만 사용 가능합니다.')
  }

  const normalized = normalizeISBN(isbn)
  if (normalized.length !== 13) {
    throw new Error('바코드 생성을 위해 ISBN-13이 필요합니다.')
  }

  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Canvas에 바코드 렌더링
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, normalized, {
    format: opts.format,
    width: opts.width,
    height: opts.height,
    fontSize: opts.fontSize,
    background: opts.background,
    lineColor: opts.lineColor,
    margin: opts.margin,
    displayValue: opts.displayValue,
    text: formatISBN(normalized),
  })

  return canvas.toDataURL('image/png')
}

/**
 * 인쇄용 고해상도 바코드 생성
 */
export function generatePrintBarcode(isbn: string): string {
  return generateBarcodeSVG(isbn, {
    width: 3,
    height: 150,
    fontSize: 20,
    margin: 20,
  })
}

/**
 * Placeholder SVG 생성 (서버 사이드용)
 */
function createPlaceholderSVG(isbn: string, options: BarcodeOptions): string {
  const width = 200
  const height = (options.height || 100) + 30
  const formattedISBN = formatISBN(isbn)

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${options.background || '#ffffff'}"/>
  <g fill="${options.lineColor || '#000000'}">
    ${generateBarcodeLines(isbn, width, options.height || 100)}
  </g>
  <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="${options.fontSize || 14}">
    ${formattedISBN}
  </text>
</svg>
  `.trim()
}

/**
 * EAN-13 바코드 라인 생성 (간단한 구현)
 */
function generateBarcodeLines(isbn: string, width: number, height: number): string {
  // EAN-13 인코딩 패턴 (간소화된 버전)
  const digits = normalizeISBN(isbn)
  let lines = ''
  const barWidth = width / 95 // EAN-13은 95개 모듈
  let x = 10

  // 시작 가드: 101
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
  x += barWidth * 2
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
  x += barWidth * 2

  // 왼쪽 6자리 (간소화)
  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(digits[i])
    // 각 숫자마다 7개 모듈, 여기서는 패턴을 간소화
    for (let j = 0; j < 4; j++) {
      if ((digit + j) % 2 === 0) {
        lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
      }
      x += barWidth
    }
    x += barWidth * 3
  }

  // 중간 가드: 01010
  x += barWidth
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
  x += barWidth * 2
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
  x += barWidth * 2

  // 오른쪽 6자리 (간소화)
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(digits[i])
    for (let j = 0; j < 4; j++) {
      if ((digit + j) % 2 === 1) {
        lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
      }
      x += barWidth
    }
    x += barWidth * 3
  }

  // 종료 가드: 101
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`
  x += barWidth * 2
  lines += `<rect x="${x}" y="0" width="${barWidth}" height="${height}"/>`

  return lines
}

/**
 * 바코드 다운로드 (PNG)
 */
export async function downloadBarcode(isbn: string, filename?: string): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('downloadBarcode는 브라우저 환경에서만 사용 가능합니다.')
  }

  const dataUrl = generateBarcodeDataURL(isbn, {
    width: 3,
    height: 150,
    fontSize: 18,
    margin: 15,
  })

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename || `isbn-${normalizeISBN(isbn)}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
