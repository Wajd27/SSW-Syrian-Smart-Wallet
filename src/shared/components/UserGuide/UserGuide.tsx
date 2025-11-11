import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { guideContent } from './guideContent';
import Button from '@/shared/components/Button/Button';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return guideContent;
    }

    const query = searchQuery.toLowerCase();
    return guideContent.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const selectedItem = useMemo(() => {
    if (!selectedSection) return null;
    for (const section of guideContent) {
      const item = section.items.find((i) => i.id === selectedSection);
      if (item) return { section: section.title, ...item };
    }
    return null;
  }, [selectedSection]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="glass-card backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20">
            <Dialog.Title className="text-2xl font-bold text-gray-800">
              {t('userGuide.title') || 'User Guide'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 rounded-full p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/20">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('userGuide.searchPlaceholder') || 'Search guide...'}
                className="w-full pl-10 pr-4 py-2 glass-input rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Sidebar - Table of Contents */}
            <div className="w-64 border-r border-white/20 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('userGuide.tableOfContents') || 'Table of Contents'}
              </h3>
              <nav className="space-y-2">
                {filteredContent.map((section) => (
                  <div key={section.id} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => setSelectedSection(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              selectedSection === item.id
                                ? 'bg-blue-100/80 text-blue-900'
                                : 'text-gray-600 hover:bg-blue-50/60 hover:text-blue-900'
                            }`}
                          >
                            {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{selectedItem.section}</p>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      {selectedItem.title}
                    </h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {selectedItem.content}
                  </div>
                  {selectedItem.steps && selectedItem.steps.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {t('userGuide.steps') || 'Steps'}
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        {selectedItem.steps.map((step, index) => (
                          <li key={index} className="ml-4">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500 text-lg mb-4">
                      {t('userGuide.selectTopic') || 'Select a topic from the table of contents to get started'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 flex items-center justify-end">
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

