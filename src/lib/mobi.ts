import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { BookProject, BookMetadata, Chapter } from '@/types/book'
import { generateEPUB } from './epub'

const execAsync = promisify(exec)

interface MOBIOptions {
  kindlegenPath?: string
  compression?: 'none' | 'standard' | 'huffdic'
  verbose?: boolean
}

/**
 * KindleGen이 설치되어 있는지 확인
 */
export async function checkKindleGen(kindlegenPath?: string): Promise<boolean> {
  const cmd = kindlegenPath || 'kindlegen'

  try {
    await execAsync(`${cmd} -h`)
    return true
  } catch {
    return false
  }
}

/**
 * EPUB을 MOBI로 변환 (KindleGen 사용)
 */
export async function convertEPUBtoMOBI(
  epubBuffer: Buffer,
  options: MOBIOptions = {}
): Promise<Buffer> {
  const { kindlegenPath = 'kindlegen', compression = 'standard', verbose = false } = options

  // 임시 파일 생성
  const tempDir = tmpdir()
  const timestamp = Date.now()
  const epubPath = join(tempDir, `temp-${timestamp}.epub`)
  const mobiPath = join(tempDir, `temp-${timestamp}.mobi`)

  try {
    // EPUB 파일 쓰기
    await writeFile(epubPath, epubBuffer)

    // KindleGen 실행
    const compressionFlag = compression === 'none' ? '-c0' : compression === 'huffdic' ? '-c2' : '-c1'
    const verboseFlag = verbose ? '-verbose' : ''

    const cmd = `${kindlegenPath} "${epubPath}" ${compressionFlag} ${verboseFlag} -o "temp-${timestamp}.mobi"`

    await execAsync(cmd, { cwd: tempDir })

    // MOBI 파일 읽기
    const mobiBuffer = await readFile(mobiPath)

    return mobiBuffer
  } finally {
    // 임시 파일 정리
    try {
      await unlink(epubPath)
      await unlink(mobiPath)
    } catch {
      // 파일이 없을 수 있음
    }
  }
}

/**
 * MOBI 파일 생성 (프로젝트에서 직접)
 */
export async function generateMOBI(
  project: BookProject,
  chapters: Chapter[],
  metadata?: BookMetadata,
  options?: MOBIOptions
): Promise<Buffer> {
  // 먼저 EPUB 생성
  const epubBuffer = await generateEPUB(project, chapters, metadata)

  // EPUB을 MOBI로 변환
  return convertEPUBtoMOBI(epubBuffer, options)
}

/**
 * MOBI 다운로드 (클라이언트용)
 */
export async function downloadMOBI(
  project: BookProject,
  chapters: Chapter[],
  metadata?: BookMetadata
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('downloadMOBI는 브라우저 환경에서만 사용 가능합니다.')
  }

  const response = await fetch(`/api/projects/${project.id}/export/mobi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error || 'MOBI 생성에 실패했습니다.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.title}.mobi`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * KindleGen 설치 안내 메시지
 */
export const KINDLEGEN_INSTALL_MESSAGE = `
MOBI 파일 생성을 위해 KindleGen이 필요합니다.

설치 방법:
1. Amazon KindleGen 다운로드 페이지 방문
2. 운영체제에 맞는 버전 다운로드
3. 압축 해제 후 시스템 PATH에 추가

Windows:
  C:\\Program Files\\KindleGen\\kindlegen.exe

macOS/Linux:
  /usr/local/bin/kindlegen

또는 환경 변수 KINDLEGEN_PATH 설정
`
