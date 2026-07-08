import { getSiteConfig } from '@/lib/config/site'
import { resolveBreakpoints } from '@/lib/design/tokens'

// Resolve the site's responsive breakpoints (Styles > Spacing & Breakpoints)
// so the category map's collapse-to-button switch on small screens tracks the
// same width as core Grid/Split blocks rather than a hardcoded pixel value.
export async function getDirectoryBreakpoints() {
  const config = await getSiteConfig()
  return resolveBreakpoints(config?.designTokens)
}
