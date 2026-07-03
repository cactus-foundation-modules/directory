import { directoryProseRscFieldDef } from './DirectoryProse'

export const descriptionRscConfig = {
  categories: {
    entryContent: {
      title: 'Entry content',
      components: ['DirectoryProse'],
      defaultExpanded: true,
    },
  },
  components: {
    DirectoryProse: directoryProseRscFieldDef,
  },
} as any

export type DescriptionRscConfig = typeof descriptionRscConfig
