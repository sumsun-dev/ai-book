import sharp from 'sharp'
import { PaperSize } from '@/types/book'

export interface CMYKOptions {
  dpi?: 300 | 400 | 600
  profile?: 'FOGRA39' | 'FOGRA51' | 'sRGB'
  bleed?: number // mm
  cropMarks?: boolean
  colorBars?: boolean
}

export interface CoverDimensions {
  width: number   // mm
  height: number  // mm
  spineWidth: number  // mm
  bleed: number   // mm
}

// 용지 크기별 기본 치수 (mm)
export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  b5: { width: 176, height: 250 },
  letter: { width: 216, height: 279 },
  novel: { width: 128, height: 188 },
}

// mm를 픽셀로 변환 (DPI 기반)
function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

/**
 * 페이지 수 기반 책등 두께 계산
 * 일반적인 80g/m² 용지 기준
 */
export function calculateSpineWidth(pageCount: number, paperWeight: number = 80): number {
  // 용지 두께 (g/m² 기준, 대략적인 계산)
  const paperThickness = paperWeight / 1000 // mm per sheet
  // 표지 두께 (일반적으로 0.3mm)
  const coverThickness = 0.3

  return Math.max(3, pageCount * paperThickness * 0.5 + coverThickness * 2)
}

/**
 * 이미지를 인쇄용 고해상도로 변환
 */
export async function prepareForPrint(
  imageBuffer: Buffer,
  options: CMYKOptions = {}
): Promise<Buffer> {
  const { dpi = 300 } = options

  let image = sharp(imageBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('이미지 메타데이터를 읽을 수 없습니다.')
  }

  // 현재 DPI 계산 (기본 72dpi 가정)
  const currentDpi = metadata.density || 72
  const scaleFactor = dpi / currentDpi

  // 해상도 조정
  if (scaleFactor > 1) {
    image = image.resize(
      Math.round(metadata.width * scaleFactor),
      Math.round(metadata.height * scaleFactor),
      {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill',
      }
    )
  }

  // DPI 메타데이터 설정
  image = image.withMetadata({ density: dpi })

  // TIFF로 출력 (인쇄용)
  return image
    .tiff({
      compression: 'lzw',
      predictor: 'horizontal',
    })
    .toBuffer()
}

/**
 * RGB를 CMYK로 변환 (근사 변환)
 * 실제 인쇄용으로는 ICC 프로파일 기반 변환 권장
 */
export function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  // 0-255 범위를 0-1로 정규화
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  // K (Key/Black) 계산
  const k = 1 - Math.max(rNorm, gNorm, bNorm)

  if (k === 1) {
    return [0, 0, 0, 100]
  }

  // CMY 계산
  const c = (1 - rNorm - k) / (1 - k)
  const m = (1 - gNorm - k) / (1 - k)
  const y = (1 - bNorm - k) / (1 - k)

  // 퍼센트로 변환
  return [
    Math.round(c * 100),
    Math.round(m * 100),
    Math.round(y * 100),
    Math.round(k * 100),
  ]
}

/**
 * 인쇄용 표지 생성 (펼침 표지)
 */
export async function preparePrintReadyCover(
  coverBuffer: Buffer,
  dimensions: CoverDimensions,
  options: CMYKOptions = {}
): Promise<Buffer> {
  const { dpi = 300 } = options

  // 전체 크기 계산 (앞표지 + 책등 + 뒤표지 + 도련)
  const totalWidth = dimensions.width * 2 + dimensions.spineWidth + dimensions.bleed * 2
  const totalHeight = dimensions.height + dimensions.bleed * 2

  const widthPx = mmToPixels(totalWidth, dpi)
  const heightPx = mmToPixels(totalHeight, dpi)

  // 원본 이미지 크기 조회
  const coverImage = sharp(coverBuffer)
  const meta = await coverImage.metadata()

  if (!meta.width || !meta.height) {
    throw new Error('표지 이미지를 읽을 수 없습니다.')
  }

  // 앞표지 크기로 리사이즈
  const frontCoverWidth = mmToPixels(dimensions.width, dpi)
  const frontCoverHeight = mmToPixels(dimensions.height, dpi)

  const resizedCover = await coverImage
    .resize(frontCoverWidth, frontCoverHeight, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer()

  // 펼침 표지 생성
  const bleedPx = mmToPixels(dimensions.bleed, dpi)
  const spinePx = mmToPixels(dimensions.spineWidth, dpi)

  // 기본 캔버스 (흰색 배경)
  let fullCover = sharp({
    create: {
      width: widthPx,
      height: heightPx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })

  // 앞표지 합성 (오른쪽)
  fullCover = fullCover.composite([
    {
      input: resizedCover,
      left: bleedPx + frontCoverWidth + spinePx,
      top: bleedPx,
    },
  ])

  // DPI 설정 및 TIFF 출력
  return fullCover
    .withMetadata({ density: dpi })
    .tiff({
      compression: 'lzw',
    })
    .toBuffer()
}

/**
 * 인쇄용 PDF 표지 생성 (간단한 버전)
 */
export async function generatePrintCoverPNG(
  coverBuffer: Buffer,
  options: CMYKOptions = {}
): Promise<Buffer> {
  const { dpi = 300 } = options

  return sharp(coverBuffer)
    .withMetadata({ density: dpi })
    .png({
      quality: 100,
      compressionLevel: 0,
    })
    .toBuffer()
}

/**
 * 이미지 색상 모드 정보 조회
 */
export async function getImageInfo(imageBuffer: Buffer): Promise<{
  width: number
  height: number
  format: string
  colorSpace: string
  dpi: number
}> {
  const meta = await sharp(imageBuffer).metadata()

  return {
    width: meta.width || 0,
    height: meta.height || 0,
    format: meta.format || 'unknown',
    colorSpace: meta.space || 'unknown',
    dpi: meta.density || 72,
  }
}

/**
 * 인쇄 품질 검사
 */
export async function validatePrintQuality(
  imageBuffer: Buffer,
  minDpi: number = 300
): Promise<{
  isValid: boolean
  issues: string[]
  info: {
    width: number
    height: number
    dpi: number
    colorSpace: string
  }
}> {
  const info = await getImageInfo(imageBuffer)
  const issues: string[] = []

  if (info.dpi < minDpi) {
    issues.push(`해상도가 낮습니다 (${info.dpi}dpi). 인쇄용으로는 최소 ${minDpi}dpi가 권장됩니다.`)
  }

  if (info.colorSpace === 'rgb' || info.colorSpace === 'srgb') {
    issues.push('RGB 색상 모드입니다. 인쇄용으로는 CMYK 변환이 권장됩니다.')
  }

  return {
    isValid: issues.length === 0,
    issues,
    info: {
      width: info.width,
      height: info.height,
      dpi: info.dpi,
      colorSpace: info.colorSpace,
    },
  }
}
