import { Node, mergeAttributes } from '@tiptap/core'

export interface FigureOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string; alt?: string; caption?: string }) => ReturnType
      updateFigureCaption: (caption: string) => ReturnType
    }
  }
}

export const Figure = Node.create<FigureOptions>({
  name: 'figure',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'inline*',

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.querySelector('img')?.getAttribute('src'),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.querySelector('img')?.getAttribute('alt'),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure',
        contentElement: 'figcaption',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, { class: 'image-figure' }),
      [
        'img',
        mergeAttributes(HTMLAttributes, {
          src: node.attrs.src,
          alt: node.attrs.alt || '',
          draggable: 'false',
          contenteditable: 'false',
        }),
      ],
      ['figcaption', { class: 'figure-caption' }, 0],
    ]
  },

  addCommands() {
    return {
      setFigure:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || '',
            },
            content: options.caption
              ? [{ type: 'text', text: options.caption }]
              : [],
          })
        },
      updateFigureCaption:
        (caption) =>
        ({ commands }) => {
          return commands.insertContent(caption)
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // figure 안에서 Enter 누르면 바깥으로 나가기
      Enter: ({ editor }) => {
        const { state } = editor
        const { selection } = state
        const { $from } = selection

        // figure 안에 있는지 확인
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth)
          if (node.type.name === 'figure') {
            // figure 다음에 paragraph 삽입
            return editor.commands.insertContentAt(
              $from.after(depth),
              { type: 'paragraph' }
            )
          }
        }
        return false
      },
    }
  },
})

export default Figure
