'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useCallback, useRef } from 'react'
import { PAGE_CHAR_LIMITS } from '@/lib/page-utils'
import type { PaperSize } from '@/types/book'

interface PageContentProps {
  content: string
  onChange: (content: string) => void
  isGenerating: boolean
  streamingContent?: string
  zoom?: number
  readOnly?: boolean
  paperSize?: PaperSize
}

export default function PageContent({
  content,
  onChange,
  isGenerating,
  streamingContent,
  paperSize = 'a4',
  readOnly = false,
}: PageContentProps) {
  const maxChars = PAGE_CHAR_LIMITS[paperSize]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialMount = useRef(true)
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'page-image',
        },
      }),
      Placeholder.configure({
        placeholder: '이 페이지에 내용을 작성하세요...',
      }),
      CharacterCount.configure({
        limit: maxChars + 500,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content: content || '',
    editable: !readOnly && !isGenerating,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      const html = editor.getHTML()
      onChange(html)
      // 다음 틱에서 플래그 리셋
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 0)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-full p-6',
        style: "font-family: 'Noto Serif KR', serif; font-size: 15px; line-height: 1.8;",
      },
    },
  })

  // 초기 마운트 후 content 변경 시 에디터 업데이트
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // 내부 업데이트로 인한 변경이면 무시
    if (isInternalUpdate.current) {
      return
    }

    if (editor && !editor.isFocused && !editor.isDestroyed) {
      try {
        const currentContent = editor.getHTML()
        if (content !== currentContent) {
          editor.commands.setContent(content || '')
        }
      } catch {
        // 에디터가 아직 준비되지 않은 경우 무시
      }
    }
  }, [content, editor])

  // 스트리밍 콘텐츠 처리
  useEffect(() => {
    if (editor && isGenerating && streamingContent) {
      editor.commands.setContent(streamingContent)
    }
  }, [editor, isGenerating, streamingContent])

  // 읽기 전용 모드 토글
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly && !isGenerating)
    }
  }, [editor, readOnly, isGenerating])

  // 이미지 리사이즈 및 압축 함수
  const resizeImage = useCallback((file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        let { width, height } = img

        // 최대 너비 제한
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        // JPEG로 압축 (품질 0.7)
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7)
        resolve(resizedBase64)
      }

      img.onerror = () => reject(new Error('이미지 로드 실패'))

      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsDataURL(file)
    })
  }, [])

  const addImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 10MB 이하여야 합니다.')
      e.target.value = ''
      return
    }

    try {
      // 이미지 리사이즈 및 압축
      const resizedImage = await resizeImage(file, 600)

      // 캡션 입력 (선택)
      const caption = window.prompt('이미지 캡션을 입력하세요 (선택사항):', '')

      // 바로 이미지 삽입
      isInternalUpdate.current = true
      editor.chain().focus().setImage({
        src: resizedImage,
        alt: caption || '',
      }).run()

      // 캡션이 있으면 다음 줄에 추가
      if (caption) {
        editor.chain()
          .createParagraphNear()
          .insertContent(`<em>${caption}</em>`)
          .run()
      }

      setTimeout(() => {
        isInternalUpdate.current = false
      }, 100)
    } catch (error) {
      console.error('이미지 처리 오류:', error)
      alert('이미지를 처리하는 중 오류가 발생했습니다.')
    }
    e.target.value = ''
  }, [resizeImage, editor])

  const addImageFromUrl = useCallback(() => {
    if (!editor) return

    const url = window.prompt('이미지 URL을 입력하세요:')
    if (!url) return

    const caption = window.prompt('이미지 캡션을 입력하세요 (선택사항):', '')

    try {
      isInternalUpdate.current = true
      editor.chain().focus().setImage({
        src: url,
        alt: caption || '',
      }).run()

      if (caption) {
        editor.chain()
          .createParagraphNear()
          .insertContent(`<em>${caption}</em>`)
          .run()
      }

      setTimeout(() => {
        isInternalUpdate.current = false
      }, 100)
    } catch (error) {
      console.error('이미지 삽입 오류:', error)
      alert('이미지 삽입에 실패했습니다.')
    }
  }, [editor])


  if (!editor) return null

  const charCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()
  const charProgress = Math.min((charCount / maxChars) * 100, 100)
  const isNearLimit = charCount > maxChars * 0.85
  const isOverLimit = charCount > maxChars

  return (
    <div className="flex flex-col h-full">
      {/* 툴바 */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex-wrap shrink-0">
        {/* 텍스트 스타일 */}
        <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-1 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="굵게 (Ctrl+B)"
          >
            <span className="font-bold text-xs">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="기울임 (Ctrl+I)"
          >
            <span className="italic text-xs">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="밑줄 (Ctrl+U)"
          >
            <span className="underline text-xs">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="취소선"
          >
            <span className="line-through text-xs">S</span>
          </ToolbarButton>
        </div>

        {/* 헤딩 */}
        <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-1 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            <span className="text-xs font-medium">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            <span className="text-xs font-medium">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="제목 3"
          >
            <span className="text-xs font-medium">H3</span>
          </ToolbarButton>
        </div>

        {/* 정렬 */}
        <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-1 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          </ToolbarButton>
        </div>

        {/* 리스트 */}
        <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-1 mr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="불릿 리스트"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="번호 리스트"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="인용구"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </ToolbarButton>
        </div>

        {/* 이미지 */}
        <div className="flex items-center">
          <ToolbarButton onClick={addImage} title="이미지 업로드">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton onClick={addImageFromUrl} title="이미지 URL 삽입">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* 실행 취소/다시 실행 */}
        <div className="flex items-center ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="실행 취소 (Ctrl+Z)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행 (Ctrl+Y)"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </ToolbarButton>
        </div>
      </div>

      {/* 에디터 콘텐츠 */}
      <div className="flex-1 overflow-auto bg-white dark:bg-neutral-800 relative">
        <EditorContent editor={editor} className="h-full" />

        {isGenerating && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 px-3 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700 text-sm">
            <div className="w-3 h-3 border-2 border-neutral-900 dark:border-white border-t-transparent animate-spin" />
            <span>AI가 작성 중입니다...</span>
          </div>
        )}
      </div>

      {/* 하단 상태바 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className={`${isOverLimit ? 'text-red-500 font-medium' : isNearLimit ? 'text-amber-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}자
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {wordCount.toLocaleString()}단어
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : charProgress >= 50 ? 'bg-neutral-600 dark:bg-neutral-300' : 'bg-neutral-400'
              }`}
              style={{ width: `${Math.min(charProgress, 100)}%` }}
            />
          </div>
          <span className={`${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {isOverLimit ? '초과' : isNearLimit ? '거의 찼음' : `${Math.round(charProgress)}%`}
          </span>
        </div>
      </div>
    </div>
  )
}

// 툴바 버튼 컴포넌트
function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 transition-colors ${
        disabled
          ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
          : isActive
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
      }`}
    >
      {children}
    </button>
  )
}


