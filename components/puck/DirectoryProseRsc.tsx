import React from 'react'
import { renderProseHtml } from '@/modules/directory/lib/prose'
import { sanitizeRichText } from '@/lib/sanitize'
import { DirectoryProse, directoryProseFieldDef, type DirectoryProseProps } from './DirectoryProse'

// Published render of a DirectoryProse block. Lives apart from
// DirectoryProse.tsx because that file is reachable from the client editor, and
// core's sanitiser lazy-requires jsdom - importing it there would drag jsdom
// into the browser bundle. Same split as core's RichText.
// The stored value is either an HTML string (editor-authored, or whatever an
// import or API call put there) or TipTap JSON (CSV imports). The string
// branch used to go straight to the page, so both shapes are cleaned with the
// same allow-list as core's RichText.
export function DirectoryProseRsc(props: DirectoryProseProps) {
  const { content } = props
  if (!content || React.isValidElement(content)) return <DirectoryProse {...props} />
  const html = sanitizeRichText(renderProseHtml(content))
  return <div className="dir-prose" dangerouslySetInnerHTML={{ __html: html }} />
}

// RSC variant: the richtext field type triggers a client-only hook even inside
// <Render>, so - mirroring Gazette's own RSC treatment - the RSC field def
// swaps to a plain textarea. Fields are never shown for public rendering
// anyway; this only avoids that hook running server-side.
export const directoryProseRscFieldDef = {
  ...directoryProseFieldDef,
  fields: { content: { type: 'textarea' as const, label: 'Content (HTML or TipTap JSON)' } },
  render: DirectoryProseRsc,
}
