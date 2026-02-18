import { describe, it, expect } from 'vitest'
import {
  extractCitations,
  reindexCitations,
  buildBibliographyHTML,
  buildBibliographyText,
  type SourceInfo,
} from './citation'

const mockSources: SourceInfo[] = [
  {
    id: 'src-1',
    title: '한국의 역사',
    author: '김철수',
    url: 'https://example.com/history',
    type: 'book',
    notes: null,
  },
  {
    id: 'src-2',
    title: 'React 가이드',
    author: null,
    url: 'https://react.dev',
    type: 'website',
    notes: null,
  },
]

describe('extractCitations', () => {
  it('should extract citations from HTML', () => {
    const html =
      'text <span data-citation="src-1" data-index="1">[1]</span> more <span data-citation="src-2" data-index="2">[2]</span>'
    const result = extractCitations(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ sourceId: 'src-1', index: 1 })
    expect(result[1]).toEqual({ sourceId: 'src-2', index: 2 })
  })

  it('should return empty array when no citations', () => {
    expect(extractCitations('<p>no citations</p>')).toEqual([])
  })
})

describe('reindexCitations', () => {
  it('should reindex citation numbers sequentially', () => {
    const html =
      '<span data-citation="src-1" data-index="3">[3]</span> <span data-citation="src-2" data-index="5">[5]</span>'
    const result = reindexCitations(html)
    expect(result).toContain('data-index="1"')
    expect(result).toContain('[1]')
    expect(result).toContain('data-index="2"')
    expect(result).toContain('[2]')
  })
})

describe('buildBibliographyHTML', () => {
  it('should build HTML bibliography from citations', () => {
    const citations = [
      { sourceId: 'src-1', index: 1 },
      { sourceId: 'src-2', index: 2 },
    ]
    const result = buildBibliographyHTML(citations, mockSources)
    expect(result).toContain('참고문헌')
    expect(result).toContain('한국의 역사')
    expect(result).toContain('김철수')
    expect(result).toContain('<em>')
  })

  it('should return empty for no citations', () => {
    expect(buildBibliographyHTML([], mockSources)).toBe('')
  })

  it('should deduplicate source IDs', () => {
    const citations = [
      { sourceId: 'src-1', index: 1 },
      { sourceId: 'src-1', index: 2 },
    ]
    const result = buildBibliographyHTML(citations, mockSources)
    const matches = result.match(/<li>/g)
    expect(matches).toHaveLength(1)
  })
})

describe('buildBibliographyText', () => {
  it('should build text bibliography', () => {
    const citations = [{ sourceId: 'src-1', index: 1 }]
    const result = buildBibliographyText(citations, mockSources)
    expect(result).toContain('참고문헌')
    expect(result).toContain('[1]')
    expect(result).toContain('한국의 역사')
  })

  it('should return empty for no citations', () => {
    expect(buildBibliographyText([], mockSources)).toBe('')
  })

  it('should include URL when available', () => {
    const citations = [{ sourceId: 'src-1', index: 1 }]
    const result = buildBibliographyText(citations, mockSources)
    expect(result).toContain('https://example.com/history')
  })
})
