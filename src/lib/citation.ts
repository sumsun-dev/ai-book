export interface CitationEntry {
  sourceId: string
  index: number
}

export interface SourceInfo {
  id: string
  title: string
  author: string | null
  url: string | null
  type: string
  notes: string | null
}

export function extractCitations(html: string): CitationEntry[] {
  const regex = /data-citation="([^"]+)"[^>]*data-index="(\d+)"/g
  const citations: CitationEntry[] = []
  let match

  while ((match = regex.exec(html)) !== null) {
    citations.push({
      sourceId: match[1],
      index: parseInt(match[2]),
    })
  }

  return citations
}

export function reindexCitations(html: string): string {
  let index = 0
  return html.replace(
    /(<span[^>]*data-citation="[^"]+")[^>]*(data-index=")(\d+)("[^>]*>)\[(\d+)\](<\/span>)/g,
    (_match, prefix, indexAttr, _oldIndex, suffix, _oldDisplay, closing) => {
      index++
      return `${prefix} ${indexAttr}${index}${suffix}[${index}]${closing}`
    }
  )
}

export function buildBibliographyHTML(
  citations: CitationEntry[],
  sources: SourceInfo[]
): string {
  const usedSourceIds = Array.from(new Set(citations.map((c) => c.sourceId)))
  const usedSources = usedSourceIds
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean) as SourceInfo[]

  if (usedSources.length === 0) return ''

  let html = '<h2>참고문헌</h2>\n<ol>\n'
  for (const source of usedSources) {
    const parts: string[] = []
    if (source.author) parts.push(source.author)
    parts.push(`<em>${source.title}</em>`)
    if (source.url)
      parts.push(`<a href="${source.url}">${source.url}</a>`)

    html += `  <li>${parts.join('. ')}.</li>\n`
  }
  html += '</ol>'

  return html
}

export function buildBibliographyText(
  citations: CitationEntry[],
  sources: SourceInfo[]
): string {
  const usedSourceIds = Array.from(new Set(citations.map((c) => c.sourceId)))
  const usedSources = usedSourceIds
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean) as SourceInfo[]

  if (usedSources.length === 0) return ''

  let text = '참고문헌\n\n'
  usedSources.forEach((source, i) => {
    const parts: string[] = []
    if (source.author) parts.push(source.author)
    parts.push(source.title)
    if (source.url) parts.push(source.url)

    text += `[${i + 1}] ${parts.join('. ')}.\n`
  })

  return text
}
