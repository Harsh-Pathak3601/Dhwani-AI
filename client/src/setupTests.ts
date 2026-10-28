import '@testing-library/jest-dom';

// Polyfill IntersectionObserver for JSDOM / Vitest
if (typeof window !== 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
