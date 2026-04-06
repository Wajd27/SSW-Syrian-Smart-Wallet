import { guideSectionsEn } from '@/shared/i18n/guideSections';

/** TOC structure only — copy lives in i18n (`userGuide.sections.*`) */
export interface GuideSection {
  id: string;
  items: GuideItem[];
}

export interface GuideItem {
  id: string;
}

export const guideContent: GuideSection[] = (
  Object.keys(guideSectionsEn) as Array<keyof typeof guideSectionsEn>
).map((sectionId) => {
  const section = guideSectionsEn[sectionId];
  return {
    id: sectionId,
    items: Object.keys(section.items).map((itemId) => ({ id: itemId })),
  };
});
