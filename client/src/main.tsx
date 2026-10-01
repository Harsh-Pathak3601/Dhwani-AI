import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { getSavedLanguageCode, clearGoogleTranslateCookies } from './i18n/googleTranslate';

// Google Translate DOM Crash-Guard for React SPA
// Safely unwraps Google Translate <font> wrappers and prevents NotFoundError
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode && this.contains(child.parentNode)) {
        let node: Node = child;
        while (node.parentNode && node.parentNode !== this) {
          node = node.parentNode;
        }
        if (node.parentNode === this) {
          return originalRemoveChild.call(this, node) as T;
        }
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode && this.contains(referenceNode.parentNode)) {
        let node: Node = referenceNode;
        while (node.parentNode && node.parentNode !== this) {
          node = node.parentNode;
        }
        if (node.parentNode === this) {
          return originalInsertBefore.call(this, newNode, node) as T;
        }
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any) as T;
  };
}

function RootApp() {
  const [appKey, setAppKey] = useState(0);

  // Instantly re-mount clean native English JSX in memory (0ms, no black screen, no browser reload)
  useEffect(() => {
    const handleReset = () => {
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.setAttribute('translate', 'no');
        rootEl.classList.add('notranslate');
      }
      setAppKey((prev) => prev + 1);
    };
    window.addEventListener('dhwani-reset-english', handleReset);
    return () => window.removeEventListener('dhwani-reset-english', handleReset);
  }, []);

  // Ensure root translation protection is synchronized on initial mount
  useEffect(() => {
    const active = getSavedLanguageCode();
    const rootEl = document.getElementById('root');
    if (rootEl) {
      if (active === 'en') {
        rootEl.setAttribute('translate', 'no');
        rootEl.classList.add('notranslate');
        clearGoogleTranslateCookies();
      } else {
        rootEl.removeAttribute('translate');
        rootEl.classList.remove('notranslate');
      }
    }
  }, []);

  return <App key={appKey} />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);

