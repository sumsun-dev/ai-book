import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'
import { createToastWrapper } from '@/test/helpers/wrapper'

describe('useToast', () => {
  it('ToastProvider 없이 사용하면 에러를 던진다', () => {
    expect(() => {
      renderHook(() => useToast())
    }).toThrow('useToast must be used within a ToastProvider')
  })

  it('toasts 배열을 반환한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })
    expect(result.current.toasts).toEqual([])
  })

  it('showToast로 toast를 추가한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    act(() => {
      result.current.showToast({ type: 'success', message: '성공!' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('성공!')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('error 타입은 기본 5000ms duration이다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    act(() => {
      result.current.showToast({ type: 'error', message: '에러!' })
    })

    expect(result.current.toasts[0].duration).toBe(5000)
  })

  it('non-error 타입은 기본 3000ms duration이다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    act(() => {
      result.current.showToast({ type: 'info', message: '정보' })
    })

    expect(result.current.toasts[0].duration).toBe(3000)
  })

  it('커스텀 duration을 지원한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    act(() => {
      result.current.showToast({
        type: 'warning',
        message: '경고',
        duration: 10000,
      })
    })

    expect(result.current.toasts[0].duration).toBe(10000)
  })

  it('showToast는 고유 ID를 반환한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    let id1: string
    let id2: string
    act(() => {
      id1 = result.current.showToast({ type: 'info', message: '1' })
      id2 = result.current.showToast({ type: 'info', message: '2' })
    })

    expect(id1!).toBeDefined()
    expect(id2!).toBeDefined()
    expect(id1!).not.toBe(id2!)
  })

  it('dismissToast로 toast를 제거한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    let id: string
    act(() => {
      id = result.current.showToast({ type: 'success', message: '테스트' })
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismissToast(id!)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('action을 포함한 toast를 생성한다', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createToastWrapper(),
    })

    const onClick = () => {}
    act(() => {
      result.current.showToast({
        type: 'info',
        message: '실행 취소?',
        action: { label: '취소', onClick },
      })
    })

    expect(result.current.toasts[0].action).toBeDefined()
    expect(result.current.toasts[0].action!.label).toBe('취소')
  })
})
