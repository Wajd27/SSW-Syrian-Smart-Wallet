import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let globalDeferred: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
let listenersAttached = false;

function notify() {
  subscribers.forEach((cb) => cb());
}

function attachListeners() {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    if (localStorage.getItem('pwa-install-dismissed')) {
      return;
    }
    e.preventDefault();
    globalDeferred = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferred = null;
    notify();
  });
}

export function clearPwaInstallDeferred() {
  globalDeferred = null;
  notify();
}

/**
 * Single shared listener for `beforeinstallprompt` so we only call preventDefault once.
 * If the user dismissed install, we do not preventDefault so the browser can show its own UI.
 */
export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferred);

  useEffect(() => {
    attachListeners();
    const cb = () => setDeferredPrompt(globalDeferred);
    subscribers.add(cb);
    cb();
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  return { deferredPrompt };
}
