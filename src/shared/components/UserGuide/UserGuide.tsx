import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { guideContent } from './guideContent';
import Button from '@/shared/components/Button/Button';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

function guideItemSteps(sectionId: string, itemId: string, t: TFunction): string[] {
  const raw = t(`userGuide.sections.${sectionId}.items.${itemId}.steps`, { returnObjects: true });
  return Array.isArray(raw) ? (raw as string[]) : [];
}

function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const filteredContent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return guideContent;
    }
    return guideContent
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const title = t(`userGuide.sections.${section.id}.items.${item.id}.title`);
          const content = t(`userGuide.sections.${section.id}.items.${item.id}.content`);
          return (
            title.toLowerCase().includes(query) || content.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery, t, i18n.language]);

  const selectedItem = useMemo(() => {
    if (!selectedSection) return null;
    for (const section of guideContent) {
      const item = section.items.find((i) => i.id === selectedSection);
      if (item) return { sectionId: section.id, itemId: item.id };
    }
    return null;
  }, [selectedSection]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="surface-panel rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-app-border">
            <Dialog.Title className="text-2xl font-bold text-app">
              {t('userGuide.title')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-app-soft hover:text-app hover:bg-app-bg rounded-full p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-app-border">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('userGuide.searchPlaceholder')}
                className="w-full ps-10 pe-4 py-2 input rounded-[10px] placeholder:text-muted"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex min-h-0">
            {/* Sidebar - Table of Contents */}
            <div className="w-64 shrink-0 border-r border-app-border overflow-y-auto p-4">
              <h3 className="text-lg font-semibold text-app mb-4">
                {t('userGuide.tableOfContents')}
              </h3>
              <nav className="space-y-2">
                {filteredContent.map((section) => (
                  <div key={section.id} className="mb-4">
                    <h4 className="text-sm font-semibold text-app-soft mb-2">
                      {t(`userGuide.sections.${section.id}.title`)}
                    </h4>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedSection(item.id)}
                            className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedSection === item.id
                                ? 'bg-chip-bg border border-chip-border text-chip-text font-semibold'
                                : 'text-app-soft hover:bg-app-bg hover:text-app'
                            }`}
                          >
                            {t(`userGuide.sections.${section.id}.items.${item.id}.title`)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted mb-2">
                      {t(`userGuide.sections.${selectedItem.sectionId}.title`)}
                    </p>
                    <h2 className="text-2xl font-bold text-app mb-4">
                      {t(
                        `userGuide.sections.${selectedItem.sectionId}.items.${selectedItem.itemId}.title`
                      )}
                    </h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-app-soft whitespace-pre-wrap">
                    {t(
                      `userGuide.sections.${selectedItem.sectionId}.items.${selectedItem.itemId}.content`
                    )}
                  </div>
                  {guideItemSteps(selectedItem.sectionId, selectedItem.itemId, t).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-app mb-3">
                        {t('userGuide.steps')}
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-app-soft">
                        {guideItemSteps(selectedItem.sectionId, selectedItem.itemId, t).map(
                          (step, index) => (
                            <li key={index} className="ms-4">
                              {step}
                            </li>
                          )
                        )}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <p className="text-muted text-lg mb-4">{t('userGuide.selectTopic')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-app-border flex items-center justify-end">
            <Button onClick={onClose} variant="secondary">
              {t('common.close')}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default UserGuide;
