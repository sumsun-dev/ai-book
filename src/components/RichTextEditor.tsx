'use client'

import { useRef, useCallback } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const ToolbarButton = ({
    onClick,
    active = false,
    children,
    title
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        w-8 h-8 flex items-center justify-center text-sm transition-colors
        ${active
          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }
      `}
    >
      {children}
    </button>
  )

  return (
    <div className={`border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
        <ToolbarButton onClick={() => execCommand('bold')} title="굵게 (Ctrl+B)">
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="기울임 (Ctrl+I)">
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="밑줄 (Ctrl+U)">
          <span className="underline">U</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} title="제목">
          <span className="font-bold text-xs">H</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('formatBlock', 'p')} title="본문">
          <span className="text-xs">P</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="글머리 기호">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="번호 목록">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

        <ToolbarButton onClick={() => execCommand('removeFormat')} title="서식 제거">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        className="
          min-h-[200px] max-h-[400px] overflow-y-auto p-4
          text-neutral-900 dark:text-white
          focus:outline-none
          prose prose-neutral dark:prose-invert max-w-none
          prose-headings:text-neutral-900 dark:prose-headings:text-white
          prose-p:text-neutral-700 dark:prose-p:text-neutral-300
          prose-li:text-neutral-700 dark:prose-li:text-neutral-300
          empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 empty:before:pointer-events-none
        "
      />
    </div>
  )
}
