import { describe, it, expect, vi } from 'vitest'

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}))

vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}))

import {
  FileParseError,
  validateFile,
  getFileType,
  parseTxt,
  parseDocx,
  parsePdf,
  parseFile,
  parseBuffer,
} from './file-parser'
import mammoth from 'mammoth'
// @ts-expect-error pdf-parse has no default export type but vi.mock provides one
import pdfParse from 'pdf-parse'

const mockMammoth = vi.mocked(mammoth)
const mockPdfParse = vi.mocked(pdfParse)

describe('FileParseError', () => {
  it('올바른 name으로 생성된다', () => {
    const error = new FileParseError('테스트 에러')
    expect(error.name).toBe('FileParseError')
    expect(error.message).toBe('테스트 에러')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('validateFile', () => {
  it('유효한 txt 파일을 통과시킨다', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    expect(() => validateFile(file)).not.toThrow()
  })

  it('유효한 docx 파일을 통과시킨다', () => {
    const file = new File(['content'], 'test.docx')
    expect(() => validateFile(file)).not.toThrow()
  })

  it('유효한 pdf 파일을 통과시킨다', () => {
    const file = new File(['content'], 'test.pdf')
    expect(() => validateFile(file)).not.toThrow()
  })

  it('지원하지 않는 확장자를 거부한다', () => {
    const file = new File(['content'], 'test.jpg')
    expect(() => validateFile(file)).toThrow(FileParseError)
    expect(() => validateFile(file)).toThrow('지원하지 않는 파일 형식')
  })

  it('확장자가 없는 파일을 거부한다', () => {
    const file = new File(['content'], 'noextension')
    expect(() => validateFile(file)).toThrow(FileParseError)
  })

  it('10MB 초과 파일을 거부한다', () => {
    // Create a large mock file
    const largeContent = new ArrayBuffer(11 * 1024 * 1024)
    const file = new File([largeContent], 'large.txt')
    expect(() => validateFile(file)).toThrow('10MB')
  })
})

describe('getFileType', () => {
  it('txt 파일을 인식한다', () => {
    expect(getFileType('file.txt')).toBe('txt')
  })

  it('docx 파일을 인식한다', () => {
    expect(getFileType('file.docx')).toBe('docx')
  })

  it('pdf 파일을 인식한다', () => {
    expect(getFileType('file.pdf')).toBe('pdf')
  })

  it('대소문자를 무시한다', () => {
    expect(getFileType('FILE.TXT')).toBe('txt')
  })

  it('지원하지 않는 형식은 에러를 던진다', () => {
    expect(() => getFileType('file.jpg')).toThrow(FileParseError)
  })
})

describe('parseTxt', () => {
  it('텍스트를 디코딩한다', async () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('Hello World').buffer
    const result = await parseTxt(buffer as ArrayBuffer)
    expect(result).toBe('Hello World')
  })

  it('BOM을 제거한다', async () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('\uFEFFHello').buffer
    const result = await parseTxt(buffer as ArrayBuffer)
    expect(result).toBe('Hello')
  })

  it('앞뒤 공백을 제거한다', async () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('  Hello  ').buffer
    const result = await parseTxt(buffer as ArrayBuffer)
    expect(result).toBe('Hello')
  })
})

describe('parseDocx', () => {
  it('mammoth으로 텍스트를 추출한다', async () => {
    mockMammoth.extractRawText.mockResolvedValue({
      value: 'DOCX 내용입니다',
      messages: [],
    })

    const buffer = new ArrayBuffer(10)
    const result = await parseDocx(buffer)
    expect(result).toBe('DOCX 내용입니다')
  })

  it('mammoth 실패 시 FileParseError를 던진다', async () => {
    mockMammoth.extractRawText.mockRejectedValue(new Error('fail'))

    const buffer = new ArrayBuffer(10)
    await expect(parseDocx(buffer)).rejects.toThrow(FileParseError)
    await expect(parseDocx(buffer)).rejects.toThrow('DOCX')
  })
})

describe('parsePdf', () => {
  it('pdf-parse로 텍스트를 추출한다', async () => {
    mockPdfParse.mockResolvedValue({ text: 'PDF 내용입니다 ', numpages: 1, numrender: 1, info: {}, metadata: null, version: '1.0' } as Awaited<ReturnType<typeof pdfParse>>)

    const buffer = new ArrayBuffer(10)
    const result = await parsePdf(buffer)
    expect(result).toBe('PDF 내용입니다')
  })

  it('pdf-parse 실패 시 FileParseError를 던진다', async () => {
    mockPdfParse.mockRejectedValue(new Error('fail'))

    const buffer = new ArrayBuffer(10)
    await expect(parsePdf(buffer)).rejects.toThrow(FileParseError)
    await expect(parsePdf(buffer)).rejects.toThrow('PDF')
  })
})

describe('parseFile', () => {
  function createFileWithArrayBuffer(content: string, name: string): File {
    const file = new File([content], name)
    const encoder = new TextEncoder()
    const buffer = encoder.encode(content).buffer as ArrayBuffer
    file.arrayBuffer = () => Promise.resolve(buffer)
    return file
  }

  it('txt 파일을 파싱한다', async () => {
    const file = createFileWithArrayBuffer('Hello World', 'test.txt')

    const result = await parseFile(file)
    expect(result.content).toBe('Hello World')
    expect(result.fileName).toBe('test.txt')
    expect(result.fileType).toBe('txt')
    expect(result.fileSize).toBe(file.size)
  })

  it('docx 파일을 파싱한다', async () => {
    mockMammoth.extractRawText.mockResolvedValue({
      value: 'DOCX 내용',
      messages: [],
    })

    const file = createFileWithArrayBuffer('fake-docx', 'test.docx')

    const result = await parseFile(file)
    expect(result.content).toBe('DOCX 내용')
    expect(result.fileName).toBe('test.docx')
    expect(result.fileType).toBe('docx')
  })

  it('pdf 파일을 파싱한다', async () => {
    mockPdfParse.mockResolvedValue({ text: 'PDF 내용', numpages: 1, numrender: 1, info: {}, metadata: null, version: '1.0' } as Awaited<ReturnType<typeof pdfParse>>)

    const file = createFileWithArrayBuffer('fake-pdf', 'test.pdf')

    const result = await parseFile(file)
    expect(result.content).toBe('PDF 내용')
    expect(result.fileName).toBe('test.pdf')
    expect(result.fileType).toBe('pdf')
  })
})

describe('parseBuffer', () => {
  it('txt 버퍼를 파싱한다', async () => {
    const encoder = new TextEncoder()
    const buffer = encoder.encode('텍스트 내용').buffer as ArrayBuffer

    const result = await parseBuffer(buffer, 'file.txt', 100)
    expect(result.content).toBe('텍스트 내용')
    expect(result.fileName).toBe('file.txt')
    expect(result.fileType).toBe('txt')
    expect(result.fileSize).toBe(100)
  })

  it('docx 버퍼를 파싱한다', async () => {
    mockMammoth.extractRawText.mockResolvedValue({
      value: 'DOCX 버퍼 내용',
      messages: [],
    })

    const buffer = new ArrayBuffer(10)

    const result = await parseBuffer(buffer, 'file.docx', 200)
    expect(result.content).toBe('DOCX 버퍼 내용')
    expect(result.fileType).toBe('docx')
  })

  it('pdf 버퍼를 파싱한다', async () => {
    mockPdfParse.mockResolvedValue({ text: 'PDF 버퍼 내용', numpages: 1, numrender: 1, info: {}, metadata: null, version: '1.0' } as Awaited<ReturnType<typeof pdfParse>>)

    const buffer = new ArrayBuffer(10)

    const result = await parseBuffer(buffer, 'file.pdf', 300)
    expect(result.content).toBe('PDF 버퍼 내용')
    expect(result.fileType).toBe('pdf')
  })
})
