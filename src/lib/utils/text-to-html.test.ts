import { describe, it, expect } from 'vitest'
import { textToHtml } from './text-to-html'

describe('textToHtml', () => {
  describe('기본 동작', () => {
    it('빈 문자열을 빈 문자열로 반환한다', () => {
      expect(textToHtml('')).toBe('')
    })

    it('null/undefined를 빈 문자열로 처리한다', () => {
      expect(textToHtml(null as unknown as string)).toBe('')
      expect(textToHtml(undefined as unknown as string)).toBe('')
    })
  })

  describe('이미 HTML인 경우', () => {
    it('<p> 태그가 있으면 그대로 반환한다', () => {
      const html = '<p>첫 번째 문단</p><p>두 번째 문단</p>'
      expect(textToHtml(html)).toBe(html)
    })

    it('<h1> 태그가 있으면 그대로 반환한다', () => {
      const html = '<h1>제목</h1><p>내용</p>'
      expect(textToHtml(html)).toBe(html)
    })
  })

  describe('평문 텍스트 변환', () => {
    it('단일 문단을 <p> 태그로 감싼다', () => {
      const text = '이것은 단일 문단입니다.'
      expect(textToHtml(text)).toBe('<p>이것은 단일 문단입니다.</p>')
    })

    it('빈 줄로 구분된 문단을 각각 <p> 태그로 감싼다', () => {
      const text = '첫 번째 문단입니다.\n\n두 번째 문단입니다.'
      expect(textToHtml(text)).toBe('<p>첫 번째 문단입니다.</p><p>두 번째 문단입니다.</p>')
    })

    it('단일 줄바꿈은 <br>로 변환한다', () => {
      const text = '첫 번째 줄\n두 번째 줄'
      expect(textToHtml(text)).toBe('<p>첫 번째 줄<br>두 번째 줄</p>')
    })

    it('여러 빈 줄은 하나의 문단 구분자로 처리한다', () => {
      const text = '첫 번째 문단\n\n\n\n두 번째 문단'
      expect(textToHtml(text)).toBe('<p>첫 번째 문단</p><p>두 번째 문단</p>')
    })

    it('앞뒤 공백을 제거한다', () => {
      const text = '  첫 번째 문단  \n\n  두 번째 문단  '
      expect(textToHtml(text)).toBe('<p>첫 번째 문단</p><p>두 번째 문단</p>')
    })

    it('빈 문단은 무시한다', () => {
      const text = '첫 번째 문단\n\n\n\n\n\n두 번째 문단'
      expect(textToHtml(text)).toBe('<p>첫 번째 문단</p><p>두 번째 문단</p>')
    })
  })

  describe('복잡한 케이스', () => {
    it('혼합된 줄바꿈 패턴을 올바르게 처리한다', () => {
      const text = '첫 번째 문단\n첫 문단 계속\n\n두 번째 문단\n두 번째 계속\n\n세 번째 문단'
      expect(textToHtml(text)).toBe(
        '<p>첫 번째 문단<br>첫 문단 계속</p><p>두 번째 문단<br>두 번째 계속</p><p>세 번째 문단</p>'
      )
    })

    it('AI 생성 텍스트 스타일을 처리한다', () => {
      const aiText = `이것은 AI가 생성한 첫 번째 문단입니다. 문단은 여러 문장으로 구성될 수 있습니다.

이것은 두 번째 문단입니다. 빈 줄로 구분되어 있습니다.

세 번째 문단은 마지막입니다.`

      const result = textToHtml(aiText)
      expect(result).toContain('<p>이것은 AI가 생성한 첫 번째 문단입니다.')
      expect(result).toContain('<p>이것은 두 번째 문단입니다.')
      expect(result).toContain('<p>세 번째 문단은 마지막입니다.</p>')
    })

    it('공백만 있는 줄은 문단 구분자로 처리한다', () => {
      const text = '첫 번째 문단\n   \n두 번째 문단'
      expect(textToHtml(text)).toBe('<p>첫 번째 문단</p><p>두 번째 문단</p>')
    })
  })
})
