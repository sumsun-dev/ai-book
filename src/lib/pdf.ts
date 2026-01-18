import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import { createElement } from 'react'
import { BookProject, Chapter, BookOutline } from '@/types/book'

// Register Korean font (Noto Sans Korean)
Font.register({
  family: 'Noto Sans KR',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2',
      fontWeight: 'bold',
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans KR',
    fontSize: 11,
    padding: 60,
    lineHeight: 1.6,
  },
  coverPage: {
    fontFamily: 'Noto Sans KR',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  tocTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tocItemText: {
    fontSize: 12,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
})

interface BookPDFProps {
  project: BookProject
  chapters: Map<number, string>
}

function CoverPage({ project }: { project: BookProject }) {
  return createElement(
    Page,
    { size: 'A5', style: styles.coverPage },
    createElement(
      View,
      null,
      createElement(Text, { style: styles.title }, project.title),
      createElement(Text, { style: styles.subtitle }, project.description),
      createElement(
        Text,
        { style: { fontSize: 12, color: '#999', marginTop: 40 } },
        'AI Book으로 작성됨'
      )
    )
  )
}

function TableOfContents({ outline }: { outline: BookOutline }) {
  return createElement(
    Page,
    { size: 'A5', style: styles.page },
    createElement(Text, { style: styles.tocTitle }, '목차'),
    createElement(
      View,
      null,
      outline.chapters.map((chapter) =>
        createElement(
          View,
          { key: chapter.number, style: styles.tocItem },
          createElement(
            Text,
            { style: styles.tocItemText },
            `${chapter.number}. ${chapter.title}`
          )
        )
      )
    ),
    createElement(
      Text,
      { style: styles.pageNumber, render: ({ pageNumber }) => pageNumber },
      null
    )
  )
}

function ChapterPage({
  chapter,
  content,
}: {
  chapter: { number: number; title: string }
  content: string
}) {
  const paragraphs = content.split('\n\n').filter((p) => p.trim())

  return createElement(
    Page,
    { size: 'A5', style: styles.page },
    createElement(
      Text,
      { style: styles.chapterTitle },
      `${chapter.number}. ${chapter.title}`
    ),
    createElement(
      View,
      null,
      paragraphs.map((paragraph, index) =>
        createElement(
          Text,
          { key: index, style: styles.paragraph },
          paragraph.replace(/[#*_]/g, '').trim()
        )
      )
    ),
    createElement(
      Text,
      {
        style: styles.pageNumber,
        render: ({ pageNumber }) => String(pageNumber),
        fixed: true,
      },
      null
    )
  )
}

function BookPDF({ project, chapters }: BookPDFProps) {
  if (!project.outline) {
    throw new Error('Book outline is required')
  }

  return createElement(
    Document,
    null,
    createElement(CoverPage, { project }),
    createElement(TableOfContents, { outline: project.outline }),
    project.outline.chapters.map((chapterOutline) =>
      createElement(ChapterPage, {
        key: chapterOutline.number,
        chapter: chapterOutline,
        content: chapters.get(chapterOutline.number) || '',
      })
    )
  )
}

export async function generateBookPDF(
  project: BookProject,
  chapters: Map<number, string>
): Promise<Blob> {
  const doc = createElement(BookPDF, { project, chapters })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(doc as any).toBlob()
  return blob
}

export async function downloadBookPDF(
  project: BookProject,
  chapters: Map<number, string>
): Promise<void> {
  const blob = await generateBookPDF(project, chapters)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.title}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
