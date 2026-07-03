import { directoryProseFieldDef } from './DirectoryProse'

// Directory-only Puck config for the entry description - deliberately NOT the
// site-wide palette (not registered in the manifest). One block, writing-first.
export const descriptionEditorConfig = {
  categories: {
    entryContent: {
      title: 'Entry content',
      components: ['DirectoryProse'],
      defaultExpanded: true,
    },
  },
  components: {
    DirectoryProse: directoryProseFieldDef,
  },
}

export type DescriptionEditorConfig = typeof descriptionEditorConfig
