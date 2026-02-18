import type { ChatMessage } from '@/types/book'

export function formatChatAsTxt(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const role = m.role === 'user' ? '[사용자]' : '[AI]'
      const time = new Date(m.timestamp).toLocaleString('ko-KR')
      return `${role} (${time})\n${m.content}`
    })
    .join('\n\n---\n\n')
}

export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
