# Refinery Context (ai_book)

> **Recovery**: Run `gt prime` after compaction, clear, or new session

Full context is injected by `gt prime` at session start.

## Quick Reference

- Check MQ: `gt mq list`
- Process next: `gt mq process`

---

## 코딩 규칙

### 다크/라이트 모드 색상 (CRITICAL)

**모든 텍스트와 배경에 반드시 라이트/다크 모드 색상을 명시적으로 지정해야 합니다.**

```tsx
// ❌ 잘못된 패턴 - 한 모드만 지정
className="text-white"           // 라이트 모드에서 안 보임
className="bg-gray-900"          // 라이트 모드에서 너무 어두움
className="text-neutral-500"     // 다크 모드에서 대비 부족

// ✅ 올바른 패턴 - 양쪽 모드 모두 지정
className="text-neutral-900 dark:text-white"
className="bg-white dark:bg-neutral-900"
className="text-neutral-700 dark:text-neutral-300"
```

**prose 클래스 사용 시 (TipTap, HTML 렌더링):**
```tsx
// ❌ 불완전
className="prose prose-neutral dark:prose-invert"

// ✅ 완전 - 모든 요소에 명시적 색상
className="prose prose-neutral dark:prose-invert
  text-neutral-900 dark:text-neutral-100
  prose-headings:text-neutral-900 dark:prose-headings:text-white
  prose-p:text-neutral-800 dark:prose-p:text-neutral-200
  prose-strong:text-neutral-900 dark:prose-strong:text-white
  prose-li:text-neutral-800 dark:prose-li:text-neutral-200"
```

**체크리스트:**
- [ ] 모든 `text-*` 클래스에 `dark:text-*` 짝 있는가?
- [ ] 모든 `bg-*` 클래스에 `dark:bg-*` 짝 있는가?
- [ ] 모든 `border-*` 클래스에 `dark:border-*` 짝 있는가?
- [ ] prose 사용 시 headings, p, strong, li 색상 명시했는가?
