import React from 'react'
import { renderProseHtml } from '@/modules/directory/lib/prose'

export type DirectoryProseProps = { content?: unknown; id?: string }

// Shared render for editor canvas + RSC. The editor's richtext field turns
// stored content into a React element for the canvas; the RSC path receives
// the raw stored value - an HTML string for editor-authored content, or
// TipTap JSON for CSV-imported content - and renderProseHtml handles both.
export function DirectoryProse(props: DirectoryProseProps) {
  const { content } = props
  if (!content) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Write a description…</div>
  }
  if (React.isValidElement(content)) {
    return <div className="dir-prose">{content}</div>
  }
  const html = renderProseHtml(content as any)
  return <div className="dir-prose" dangerouslySetInnerHTML={{ __html: html }} />
}

export const directoryProseFieldDef = {
  label: 'Prose',
  fields: {
    content: {
      type: 'richtext' as const,
      label: 'Content',
      options: {
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        textAlign: false,
      },
    },
  },
  defaultProps: { content: undefined },
  render: DirectoryProse,
}

// The RSC variant lives in DirectoryProseRsc.tsx (server-only, sanitised).
