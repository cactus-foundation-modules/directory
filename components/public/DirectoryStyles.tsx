// Scoped .dir-* rules for public directory pages. Colours are tokens throughout -
// no hardcoded hex - so the module respects the site's light/dark theme.
export default function DirectoryStyles() {
  return (
    <style>{`
      .dir-container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }
      .dir-wide { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

      .dir-prose { line-height: 1.75; color: var(--color-text); font-size: 1.0625rem; }
      .dir-prose p { margin: 0 0 1.25rem; }
      .dir-prose h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; }
      .dir-prose h3 { font-size: 1.25rem; font-weight: 700; margin: 1.75rem 0 0.875rem; }
      .dir-prose h4 { font-size: 1.0625rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
      .dir-prose a { color: var(--color-primary); }
      .dir-prose ul, .dir-prose ol { margin: 0 0 1.25rem; padding-left: 1.5rem; }

      .dir-category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
      .dir-category-card { border: 1px solid var(--color-border); border-radius: var(--radius-md, 8px); padding: 1.25rem; text-decoration: none; color: inherit; display: block; }
      .dir-category-card .icon { font-size: 1.75rem; display: block; margin-bottom: 0.5rem; }
      .dir-category-card h3 { margin: 0 0 0.25rem; font-size: 1rem; }
      .dir-category-card p { margin: 0; font-size: 0.8125rem; color: var(--color-text-muted); }

      .dir-entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
      .dir-entry-card { border: 1px solid var(--color-border); border-radius: var(--radius-md, 8px); overflow: hidden; text-decoration: none; color: inherit; display: block; position: relative; }
      .dir-entry-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
      .dir-entry-card-body { padding: 1rem; }
      .dir-entry-card-body--badge-clear { padding-top: 2.75rem; }
      .dir-entry-card h3 { margin: 0 0 0.375rem; font-size: 1.0625rem; }
      .dir-entry-card p { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); }
      .dir-entry-card-meta { display: flex; gap: 0.5rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted); flex-wrap: wrap; }
      .dir-entry-card .featured-flag { position: absolute; top: 0.75rem; left: 0.75rem; z-index: 1; }

      .dir-pagination { display: flex; gap: 0.5rem; justify-content: center; margin-top: 2rem; }
      .dir-pagination a, .dir-pagination span { padding: 0.375rem 0.75rem; border: 1px solid var(--color-border); border-radius: 6px; text-decoration: none; color: var(--color-text); font-size: 0.875rem; }

      .dir-gallery { display: flex; gap: 0.5rem; overflow-x: auto; margin: 1.5rem 0; }
      .dir-gallery img { height: 200px; width: auto; border-radius: 8px; flex-shrink: 0; }

      .dir-contact-card, .dir-location { margin: 1.5rem 0; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: 8px; }
      .dir-contact-card a { color: var(--color-primary); }
      .dir-location .coords { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--color-text-muted); }

      .dir-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.5rem; }
      .dir-tag-chip { padding: 0.25rem 0.625rem; border-radius: 999px; background: var(--color-bg-subtle); font-size: 0.75rem; color: var(--color-text-muted); }
    `}</style>
  )
}
