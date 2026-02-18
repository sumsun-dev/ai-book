import { describe, it, expect } from 'vitest'
import ko from './ko.json'
import en from './en.json'

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys.sort()
}

describe('messages integrity', () => {
  const koKeys = getKeys(ko)
  const enKeys = getKeys(en)

  it('ko와 en의 키 개수가 동일해야 한다', () => {
    expect(koKeys.length).toBe(enKeys.length)
  })

  it('ko의 모든 키가 en에 존재해야 한다', () => {
    const missingInEn = koKeys.filter((key) => !enKeys.includes(key))
    expect(missingInEn).toEqual([])
  })

  it('en의 모든 키가 ko에 존재해야 한다', () => {
    const missingInKo = enKeys.filter((key) => !koKeys.includes(key))
    expect(missingInKo).toEqual([])
  })

  it('보간 변수({var})가 양쪽에서 일치해야 한다', () => {
    const varPattern = /\{(\w+)\}/g
    const mismatches: string[] = []

    for (const key of koKeys) {
      const koValue = getNestedValue(ko, key)
      const enValue = getNestedValue(en, key)
      if (typeof koValue !== 'string' || typeof enValue !== 'string') continue

      const koVars = Array.from(koValue.matchAll(varPattern)).map((m) => m[1]).sort()
      const enVars = Array.from(enValue.matchAll(varPattern)).map((m) => m[1]).sort()

      if (JSON.stringify(koVars) !== JSON.stringify(enVars)) {
        mismatches.push(`${key}: ko={${koVars.join(',')}} en={${enVars.join(',')}}`)
      }
    }

    expect(mismatches).toEqual([])
  })

  it('빈 문자열 값이 없어야 한다', () => {
    const emptyKo = koKeys.filter((key) => getNestedValue(ko, key) === '')
    const emptyEn = enKeys.filter((key) => getNestedValue(en, key) === '')
    expect(emptyKo).toEqual([])
    expect(emptyEn).toEqual([])
  })
})

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}
