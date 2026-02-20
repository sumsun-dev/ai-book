import { describe, it, expect } from 'vitest'
import { analyzeKeyPointProgress, formatKeyPointProgress } from './key-point-tracker'

describe('analyzeKeyPointProgress', () => {
  it('키워드가 모두 포함된 경우 completed', () => {
    const content = '인공지능의 역사를 살펴보면, 딥러닝이 등장한 후 큰 발전을 이루었다.'
    const keyPoints = ['인공지능의 역사']
    const result = analyzeKeyPointProgress(content, keyPoints)
    expect(result[0].status).toBe('completed')
  })

  it('키워드가 전혀 없는 경우 pending', () => {
    const content = '날씨가 좋은 오후였다.'
    const keyPoints = ['인공지능의 역사와 발전']
    const result = analyzeKeyPointProgress(content, keyPoints)
    expect(result[0].status).toBe('pending')
  })

  it('키워드가 부분 매칭인 경우 partial', () => {
    const content = '인공지능의 역사를 간략히 소개한다.'
    const keyPoints = ['인공지능의 역사와 미래 전망 분석']
    const result = analyzeKeyPointProgress(content, keyPoints)
    expect(result[0].status).toBe('partial')
  })

  it('여러 keyPoint 동시 분석', () => {
    const content = '인공지능의 역사는 1950년대로 거슬러 올라간다. 머신러닝은 데이터에서 학습한다.'
    const keyPoints = ['인공지능의 역사', '머신러닝 기초', '양자컴퓨팅']
    const result = analyzeKeyPointProgress(content, keyPoints)
    expect(result[0].status).toBe('completed')
    expect(result[1].status).toBe('partial') // "머신러닝" 매칭
    expect(result[2].status).toBe('pending')
  })

  it('빈 내용일 때 모두 pending', () => {
    const result = analyzeKeyPointProgress('', ['포인트1', '포인트2'])
    expect(result.every(r => r.status === 'pending')).toBe(true)
  })

  it('빈 keyPoints 배열', () => {
    const result = analyzeKeyPointProgress('some content', [])
    expect(result).toEqual([])
  })

  it('한국어 조사 변형 대응 (은/는/이/가/을/를 등)', () => {
    const content = '경제학에서 수요와 공급은 중요한 개념이다.'
    const keyPoints = ['수요와 공급의 법칙']
    const result = analyzeKeyPointProgress(content, keyPoints)
    // "수요", "공급" 키워드 매칭
    expect(result[0].status).not.toBe('pending')
  })
})

describe('formatKeyPointProgress', () => {
  it('상태별 포맷 출력', () => {
    const statuses = [
      { keyPoint: '인공지능의 역사', status: 'completed' as const },
      { keyPoint: '머신러닝 기초', status: 'partial' as const },
      { keyPoint: '양자컴퓨팅', status: 'pending' as const },
    ]
    const result = formatKeyPointProgress(statuses)
    expect(result).toContain('[완료]')
    expect(result).toContain('[진행중]')
    expect(result).toContain('[미완료]')
    expect(result).toContain('인공지능의 역사')
    expect(result).toContain('머신러닝 기초')
    expect(result).toContain('양자컴퓨팅')
  })

  it('빈 배열 처리', () => {
    expect(formatKeyPointProgress([])).toBe('')
  })
})
