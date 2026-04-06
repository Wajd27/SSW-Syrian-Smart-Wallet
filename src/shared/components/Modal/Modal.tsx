import { Fragment } from 'react';
import clsx from 'clsx';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Bottom-anchored sheet on small screens (better for long forms on phones). */
  fullScreenOnMobile?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full',
};

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  fullScreenOnMobile = false,
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={clsx(
              'flex min-h-full justify-center text-center',
              fullScreenOnMobile ? 'items-end p-0 sm:items-center sm:p-4' : 'items-center p-4'
            )}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden text-left align-middle transition-all surface-panel',
                  sizeClasses[size],
                  fullScreenOnMobile &&
                    'max-sm:flex max-sm:max-h-[min(92dvh,calc(100vh-1.5rem))] max-sm:max-w-[calc(100vw-1.5rem)] max-sm:flex-col max-sm:rounded-2xl',
                  fullScreenOnMobile ? 'p-0 sm:rounded-2xl sm:p-6' : 'rounded-2xl p-6'
                )}
              >
                {fullScreenOnMobile ? (
                  <>
                    <div className="flex shrink-0 items-center justify-between border-b border-app-border/80 px-4 py-3 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0">
                      <Dialog.Title as="h3" className="pr-2 text-lg font-medium leading-6 text-app">
                        {title}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl p-2 text-app-soft transition-all duration-200 hover:bg-app-bg hover:text-app"
                        onClick={onClose}
                        aria-label={t('common.close')}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    {/* Children own scroll + footer (e.g. form with flex-col) so actions stay inside rounded sheet */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden text-app-soft">
                      {children}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-app">
                        {title}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-xl p-1 text-app-soft transition-all duration-200 hover:bg-app-bg hover:text-app"
                        onClick={onClose}
                        aria-label={t('common.close')}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="text-app-soft">{children}</div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
