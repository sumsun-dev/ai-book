import mammoth from 'mammoth'
import type { ParsedFile, UploadFileType } from '@/types/book'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export class FileParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileParseError'
  }
}

export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileParseError('파일 크기가 10MB를 초과합니다.')
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['txt', 'docx', 'pdf'].includes(extension)) {
    throw new FileParseError('지원하지 않는 파일 형식입니다. (txt, docx, pdf만 지원)')
  }
}

export function getFileType(fileName: string): UploadFileType {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'txt') return 'txt'
  if (extension === 'docx') return 'docx'
  if (extension === 'pdf') return 'pdf'
  throw new FileParseError('지원하지 않는 파일 형식입니다.')
}

export async function parseTxt(buffer: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder('utf-8')
  let content = decoder.decode(buffer)

  // BOM 제거
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }

  return content.trim()
}

export async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value.trim()
  } catch {
    throw new FileParseError('DOCX 파일을 읽는데 실패했습니다.')
  }
}

export async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  try {
    // pdf-parse는 Node.js 환경에서만 동작하므로 서버에서 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any
    const pdfParse = pdfParseModule.default || pdfParseModule
    const uint8Array = new Uint8Array(buffer)
    const result = await pdfParse(Buffer.from(uint8Array))
    return result.text.trim()
  } catch {
    throw new FileParseError('PDF 파일을 읽는데 실패했습니다.')
  }
}

export async function parseFile(file: File): Promise<ParsedFile> {
  validateFile(file)

  const buffer = await file.arrayBuffer()
  const fileType = getFileType(file.name)

  let content: string

  switch (fileType) {
    case 'txt':
      content = await parseTxt(buffer)
      break
    case 'docx':
      content = await parseDocx(buffer)
      break
    case 'pdf':
      content = await parsePdf(buffer)
      break
  }

  return {
    content,
    fileName: file.name,
    fileType,
    fileSize: file.size
  }
}

export async function parseBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<ParsedFile> {
  const fileType = getFileType(fileName)

  let content: string

  switch (fileType) {
    case 'txt':
      content = await parseTxt(buffer)
      break
    case 'docx':
      content = await parseDocx(buffer)
      break
    case 'pdf':
      content = await parsePdf(buffer)
      break
  }

  return {
    content,
    fileName,
    fileType,
    fileSize
  }
}
