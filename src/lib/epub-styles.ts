/**
 * EPUB 기본 스타일시트
 */
export const defaultEPUBStyles = `
/* 기본 설정 */
@charset "UTF-8";

body {
  font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  font-size: 1em;
  line-height: 1.8;
  margin: 5%;
  padding: 0;
  text-align: justify;
  word-break: keep-all;
  color: #222222;
  background-color: #ffffff;
}

/* 제목 */
h1 {
  font-size: 1.8em;
  font-weight: 700;
  line-height: 1.3;
  margin: 2em 0 1em 0;
  text-align: center;
  page-break-before: always;
  page-break-after: avoid;
}

h2 {
  font-size: 1.4em;
  font-weight: 600;
  line-height: 1.4;
  margin: 1.5em 0 0.8em 0;
  page-break-after: avoid;
}

h3 {
  font-size: 1.2em;
  font-weight: 600;
  line-height: 1.4;
  margin: 1.2em 0 0.6em 0;
  page-break-after: avoid;
}

/* 단락 */
p {
  margin: 0 0 0.8em 0;
  text-indent: 1em;
}

p:first-of-type,
h1 + p,
h2 + p,
h3 + p {
  text-indent: 0;
}

/* 인용 */
blockquote {
  margin: 1.5em 2em;
  padding: 0.5em 1em;
  border-left: 3px solid #cccccc;
  font-style: italic;
  color: #555555;
}

/* 리스트 */
ul, ol {
  margin: 1em 0 1em 2em;
  padding: 0;
}

li {
  margin: 0.3em 0;
}

/* 강조 */
em {
  font-style: italic;
}

strong {
  font-weight: 700;
}

/* 코드 */
code {
  font-family: "Noto Sans Mono", "D2Coding", monospace;
  font-size: 0.9em;
  background-color: #f4f4f4;
  padding: 0.1em 0.3em;
  border-radius: 2px;
}

pre {
  font-family: "Noto Sans Mono", "D2Coding", monospace;
  font-size: 0.85em;
  background-color: #f4f4f4;
  padding: 1em;
  margin: 1em 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 링크 */
a {
  color: #0066cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 이미지 */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em auto;
}

figure {
  margin: 1.5em 0;
  text-align: center;
}

figcaption {
  font-size: 0.9em;
  color: #666666;
  margin-top: 0.5em;
}

/* 구분선 */
hr {
  border: none;
  border-top: 1px solid #cccccc;
  margin: 2em 0;
}

/* 표 */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.9em;
}

th, td {
  border: 1px solid #cccccc;
  padding: 0.5em;
  text-align: left;
}

th {
  background-color: #f4f4f4;
  font-weight: 600;
}

/* 페이지 관련 */
.page-break {
  page-break-after: always;
}

.no-break {
  page-break-inside: avoid;
}

/* 표지 */
.cover {
  text-align: center;
  page-break-after: always;
}

.cover img {
  max-height: 100vh;
  width: auto;
}

/* 타이틀 페이지 */
.title-page {
  text-align: center;
  page-break-after: always;
  padding-top: 30%;
}

.title-page h1 {
  font-size: 2.5em;
  margin-bottom: 0.5em;
}

.title-page .subtitle {
  font-size: 1.2em;
  color: #666666;
  margin-bottom: 2em;
}

.title-page .author {
  font-size: 1.1em;
  margin-bottom: 0.5em;
}

.title-page .publisher {
  font-size: 0.9em;
  color: #888888;
  margin-top: 3em;
}

/* 목차 */
.toc {
  page-break-after: always;
}

.toc h2 {
  text-align: center;
  margin-bottom: 1.5em;
}

.toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc li {
  margin: 0.8em 0;
  border-bottom: 1px dotted #cccccc;
}

.toc a {
  display: block;
  padding: 0.3em 0;
}

/* 챕터 */
.chapter {
  page-break-before: always;
}

.chapter-number {
  font-size: 0.9em;
  color: #888888;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5em;
}

/* 콜로폰 (판권) */
.colophon {
  page-break-before: always;
  font-size: 0.85em;
  line-height: 1.6;
}

.colophon h2 {
  font-size: 1.1em;
  margin-bottom: 1.5em;
  text-align: center;
}

.colophon p {
  text-indent: 0;
  margin: 0.3em 0;
}

.colophon .copyright {
  margin-top: 2em;
  color: #666666;
}
`

/**
 * 라이트 테마 스타일
 */
export const lightThemeStyles = `
body {
  color: #222222;
  background-color: #ffffff;
}
`

/**
 * 다크 테마 스타일 (일부 리더기 지원)
 */
export const darkThemeStyles = `
body {
  color: #e0e0e0;
  background-color: #1a1a1a;
}

blockquote {
  border-left-color: #555555;
  color: #aaaaaa;
}

code, pre {
  background-color: #2a2a2a;
}

th {
  background-color: #2a2a2a;
}

th, td {
  border-color: #444444;
}
`

/**
 * 세리프 테마 (소설용)
 */
export const serifThemeStyles = `
body {
  font-family: "Noto Serif KR", "Batang", serif;
}
`

/**
 * 스타일 옵션에 따른 CSS 생성
 */
export interface EPUBStyleOptions {
  theme?: 'light' | 'dark' | 'sepia'
  fontFamily?: 'sans-serif' | 'serif'
  fontSize?: 'small' | 'medium' | 'large'
  lineHeight?: 'compact' | 'normal' | 'relaxed'
}

export function getEPUBStyles(options: EPUBStyleOptions = {}): string {
  let css = defaultEPUBStyles

  // 테마
  if (options.theme === 'dark') {
    css += darkThemeStyles
  }

  // 폰트
  if (options.fontFamily === 'serif') {
    css += serifThemeStyles
  }

  // 폰트 크기
  const fontSizes = {
    small: '0.9em',
    medium: '1em',
    large: '1.1em',
  }
  if (options.fontSize) {
    css += `\nbody { font-size: ${fontSizes[options.fontSize]}; }`
  }

  // 줄간격
  const lineHeights = {
    compact: '1.5',
    normal: '1.8',
    relaxed: '2.0',
  }
  if (options.lineHeight) {
    css += `\nbody { line-height: ${lineHeights[options.lineHeight]}; }`
  }

  return css
}
