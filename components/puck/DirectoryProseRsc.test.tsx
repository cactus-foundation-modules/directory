import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DirectoryProseRsc } from '@/modules/directory/components/puck/DirectoryProseRsc'

// The stored description can be a raw HTML string, which used to reach the
// published page untouched. Both stored shapes must come out clean.
describe('DirectoryProseRsc', () => {
  it('strips script and event handlers from a stored HTML string', () => {
    const html = renderToStaticMarkup(
      <DirectoryProseRsc content={'<p>Hello</p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">link</a>'} />,
    )
    expect(html).toContain('<p>Hello</p>')
    expect(html).not.toMatch(/onerror|<script|javascript:/i)
  })

  it('renders TipTap JSON and drops a javascript: link', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }],
    }
    const html = renderToStaticMarkup(<DirectoryProseRsc content={doc} />)
    expect(html).toContain('Hi')
    expect(html).not.toMatch(/javascript:/i)
  })
})
