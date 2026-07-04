import { generateHTML } from '@tiptap/html'
import type { JSONContent } from '@tiptap/core'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { Bold } from '@tiptap/extension-bold'
import { Italic } from '@tiptap/extension-italic'
import { Heading } from '@tiptap/extension-heading'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Link } from '@tiptap/extension-link'
import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'
import type { PuckData } from './types'

// Extensions for the DirectoryProse block's richtext field - matches its
// declared `options` (code/codeBlock/strike/underline/horizontalRule/textAlign
// disabled) so the editor schema and this conversion schema agree.
export const proseExtensions = [
  Document, Paragraph, Text, Bold, Italic,
  Heading.configure({ levels: [2, 3, 4] }),
  HardBreak, Link,
  BulletList, OrderedList, ListItem,
]

// Puck's built-in richtext field stores rendered HTML strings (editor-authored
// entries); buildProseDocument below stores raw TipTap JSON (CSV imports).
// Handle both shapes here rather than assuming one.
export function renderProseHtml(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  try {
    return generateHTML(content as JSONContent, proseExtensions)
  } catch {
    return ''
  }
}

// Wraps plain text (e.g. a CSV import column) into a single-block Puck
// document so it round-trips through the same DirectoryProse renderer as
// hand-written entries.
export function buildProseDocument(text: string): PuckData {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const content: JSONContent[] = paragraphs.length
    ? paragraphs.map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p }] }))
    : [{ type: 'paragraph' }]

  return {
    root: {},
    content: [
      {
        type: 'DirectoryProse',
        props: { id: 'DirectoryProse-1', content: { type: 'doc', content } },
      },
    ],
  }
}
