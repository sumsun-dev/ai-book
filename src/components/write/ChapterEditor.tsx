'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useCallback, useRef, useState } from 'react'
import { ChapterOutline } from '@/types/book'

type AIWriteMode = 'new' | 'continue'

interface ChapterEditorProps {
  chapterOutline: ChapterOutline | null
  content: string
  isWriting: boolean
  currentChapter: number
  totalChapters: number
  projectId: string
  chapterId: string | null
  onContentChange: (content: string) => void
  onAIWrite: (mode: AIWriteMode) => void
  onPreviousChapter: () => void
  onNextChapter: () => void
}

export default function ChapterEditor({
  chapterOutline,
  content,
  isWriting,
  currentChapter,
  totalChapters,
  projectId,
  chapterId,
  onContentChange,
  onAIWrite,
  onPreviousChapter,
  onNextChapter
}: ChapterEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialMount = useRef(true)
  const isInternalUpdate = useRef(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null)
  const [showWriteMenu, setShowWriteMenu] = useState(false)
  const writeMenuRef = useRef<HTMLDivElement>(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (writeMenuRef.current && !writeMenuRef.current.contains(event.target as Node)) {
        setShowWriteMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          class: 'chapter-image',
        },
      }),
      Placeholder.configure({
        placeholder: '여기에 내용을 입력하거나 "AI로 작성" 버튼을 클릭하세요...',
      }),
      CharacterCount,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content: content || '',
    editable: !isWriting,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      const html = editor.getHTML()
      onContentChange(html)
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 0)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none min-h-full p-8 text-neutral-900 dark:text-neutral-100',
        style: "font-family: 'Noto Serif KR', serif; font-size: 16px; line-height: 1.9;",
      },
    },
  })

  // 초기 마운트 후 content 변경 시 에디터 업데이트
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

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

  // 스트리밍 콘텐츠 처리 (AI 작성 중)
  useEffect(() => {
    if (editor && isWriting && content) {
      editor.commands.setContent(content)
    }
  }, [editor, isWriting, content])

  // 읽기 전용 모드 토글
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isWriting)
    }
  }, [editor, isWriting])

  // 텍스트 선택 감지
  const handleSelectionChange = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    if (from !== to) {
      const text = editor.state.doc.textBetween(from, to, '\n')
      setSelectedText(text)
      setSelectionRange({ from, to })
    } else {
      setSelectedText('')
      setSelectionRange(null)
    }
  }, [editor])

  useEffect(() => {
    if (editor) {
      editor.on('selectionUpdate', handleSelectionChange)
      return () => {
        editor.off('selectionUpdate', handleSelectionChange)
      }
    }
  }, [editor, handleSelectionChange])

  // AI 수정 요청 처리
  const handleAIEdit = async () => {
    if (!selectedText || !editInstruction || !chapterId || !selectionRange || !editor) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/chapters/${chapterId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          instruction: editInstruction,
          context: content.substring(
            Math.max(0, selectionRange.from - 500),
            Math.min(content.length, selectionRange.to + 500)
          )
        })
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let editedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        editedText += decoder.decode(value, { stream: true })
      }

      // 선택 영역을 수정된 텍스트로 교체
      isInternalUpdate.current = true
      editor
        .chain()
        .focus()
        .setTextSelection(selectionRange)
        .deleteSelection()
        .insertContent(editedText)
        .run()

      setTimeout(() => {
        isInternalUpdate.current = false
      }, 100)

      setShowEditModal(false)
      setEditInstruction('')
      setSelectedText('')
      setSelectionRange(null)
    } catch {
      alert('AI 수정에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsEditing(false)
    }
  }

  // 이미지 리사이즈 및 압축 함수
  const resizeImage = useCallback((file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

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

    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 10MB 이하여야 합니다.')
      e.target.value = ''
      return
    }

    try {
      const resizedImage = await resizeImage(file, 600)
      const caption = window.prompt('이미지 캡션을 입력하세요 (선택사항):', '')

      isInternalUpdate.current = true
      editor.chain().focus().setImage({
        src: resizedImage,
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
    } catch (_error) {
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
    } catch {
      alert('이미지 삽입에 실패했습니다.')
    }
  }, [editor])

  if (!editor) return null

  const charCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  return (
    <main className="flex-1 flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-500">
      {/* 헤더 */}
      <div className="px-8 py-5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onPreviousChapter}
            disabled={currentChapter === 1}
            className="group p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-light text-neutral-900 dark:text-white tracking-tight">
              {currentChapter}. {chapterOutline?.title || '챕터'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {chapterOutline?.summary || ''}
            </p>
          </div>
          <button
            onClick={onNextChapter}
            disabled={currentChapter === totalChapters}
            className="group p-2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* 툴바 토글 버튼 */}
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`p-2 transition-colors ${showToolbar ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`}
            title={showToolbar ? '툴바 숨기기' : '툴바 보기'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          {/* AI 작성 버튼 - 내용 있으면 드롭다운 */}
          <div className="relative" ref={writeMenuRef}>
            {isWriting ? (
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed"
              >
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI 집필 중...
              </button>
            ) : content && content.trim() && content !== '<p></p>' ? (
              <>
                <button
                  onClick={() => setShowWriteMenu(!showWriteMenu)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  AI로 작성
                  <svg className={`w-3 h-3 transition-transform ${showWriteMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showWriteMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg z-50">
                    <button
                      onClick={() => {
                        setShowWriteMenu(false)
                        onAIWrite('continue')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m0 0l-4-4m4 4l4-4" />
                      </svg>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">이어서 작성</div>
                        <div className="text-xs text-neutral-500">기존 내용에 이어서 작성</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowWriteMenu(false)
                        onAIWrite('new')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors border-t border-neutral-100 dark:border-neutral-700"
                    >
                      <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-white">새로 작성</div>
                        <div className="text-xs text-neutral-500">챕터 전체 다시 작성</div>
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => onAIWrite('new')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-500"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                AI로 작성
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 편집 툴바 */}
      {showToolbar && (
        <div className="flex items-center gap-0.5 px-6 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex-wrap shrink-0">
          {/* 텍스트 스타일 */}
          <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="굵게 (Ctrl+B)"
            >
              <span className="font-bold text-sm">B</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="기울임 (Ctrl+I)"
            >
              <span className="italic text-sm">I</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="밑줄 (Ctrl+U)"
            >
              <span className="underline text-sm">U</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="취소선"
            >
              <span className="line-through text-sm">S</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="형광펜"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </ToolbarButton>
          </div>

          {/* 헤딩 */}
          <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="제목 1"
            >
              <span className="text-sm font-medium">H1</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="제목 2"
            >
              <span className="text-sm font-medium">H2</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="제목 3"
            >
              <span className="text-sm font-medium">H3</span>
            </ToolbarButton>
          </div>

          {/* 정렬 */}
          <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="왼쪽 정렬"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="가운데 정렬"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="오른쪽 정렬"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="양쪽 정렬"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </ToolbarButton>
          </div>

          {/* 리스트 */}
          <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="불릿 리스트"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="번호 리스트"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="인용구"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </ToolbarButton>
          </div>

          {/* 이미지 */}
          <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
            <ToolbarButton onClick={addImage} title="이미지 업로드">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={addImageFromUrl} title="이미지 URL 삽입">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          {/* AI 수정 버튼 */}
          {selectedText && chapterId && (
            <div className="flex items-center border-r border-neutral-200 dark:border-neutral-700 pr-2 mr-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
                title="선택한 텍스트를 AI로 수정"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                AI 수정
              </button>
            </div>
          )}

          {/* 실행 취소/다시 실행 */}
          <div className="flex items-center ml-auto">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="실행 취소 (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="다시 실행 (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* 에디터 영역 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 border-x border-neutral-200 dark:border-neutral-800 min-h-full relative">
          <EditorContent editor={editor} className="min-h-full" />

          {isWriting && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 px-4 py-2 shadow-lg border border-neutral-200 dark:border-neutral-700 text-sm">
              <div className="w-4 h-4 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
              <span>AI가 작성 중입니다...</span>
            </div>
          )}
        </div>
      </div>

      {/* 상태 바 */}
      <div className="px-8 py-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {charCount.toLocaleString()}자
          </span>
          <span>{wordCount.toLocaleString()}단어</span>
          <span>약 {Math.ceil(charCount / 1500)}페이지</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            Ctrl+B: 굵게 · Ctrl+I: 기울임 · Ctrl+U: 밑줄 · Ctrl+Z: 실행 취소
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {currentChapter} / {totalChapters} 챕터
          </span>
        </div>
      </div>

      {/* AI 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                AI 수정 요청
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditInstruction('')
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 선택된 텍스트 미리보기 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  선택한 텍스트
                </label>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-600 dark:text-neutral-400 max-h-32 overflow-auto">
                  {selectedText.length > 300 ? selectedText.substring(0, 300) + '...' : selectedText}
                </div>
              </div>

              {/* 수정 지시 입력 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  수정 지시
                </label>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="예: 더 생동감 있게 수정해줘 / 문장을 간결하게 다듬어줘 / 비유를 추가해줘"
                  className="w-full h-24 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* 빠른 수정 버튼들 */}
              <div className="flex flex-wrap gap-2">
                {['더 간결하게', '더 상세하게', '문체 부드럽게', '비유 추가', '대화체로'].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setEditInstruction(quick)}
                    className="px-3 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditInstruction('')
                }}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAIEdit}
                disabled={!editInstruction.trim() || isEditing}
                className={`
                  flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all
                  ${isEditing || !editInstruction.trim()
                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                  }
                `}
              >
                {isEditing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    수정 중...
                  </>
                ) : (
                  'AI로 수정하기'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
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
      className={`p-2 transition-colors ${
        disabled
          ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
          : isActive
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      {children}
    </button>
  )
}
