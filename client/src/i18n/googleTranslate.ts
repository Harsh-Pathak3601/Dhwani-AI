// Google Translate full-page DOM translation controller

export interface AccentLanguage {
  code: string; // Google Translate code: 'en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn'
  speechCode: string; // Web Speech / Deepgram code: 'en-IN', 'hi-IN', etc.
  name: string;
  nativeName: string;
  region: string;
  accent: string;
}

export const INDIAN_ACCENTS: AccentLanguage[] = [
  {
    code: 'en',
    speechCode: 'en-IN',
    name: 'Indian English',
    nativeName: 'English (India)',
    region: 'Pan-India',
    accent: 'Indian English / Hinglish',
  },
  {
    code: 'hi',
    speechCode: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    region: 'North India / Delhi',
    accent: 'Hindi Accent',
  },
  {
    code: 'bn',
    speechCode: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'West Bengal / Kolkata',
    accent: 'Bengali Accent',
  },
  {
    code: 'ta',
    speechCode: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'Tamil Nadu / Chennai',
    accent: 'Tamil Accent',
  },
  {
    code: 'te',
    speechCode: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'Telangana & AP / Hyderabad',
    accent: 'Telugu Accent',
  },
  {
    code: 'mr',
    speechCode: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'Maharashtra / Mumbai',
    accent: 'Marathi Accent',
  },
  {
    code: 'gu',
    speechCode: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'Gujarat / Ahmedabad',
    accent: 'Gujarati Accent',
  },
  {
    code: 'kn',
    speechCode: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'Karnataka / Bengaluru',
    accent: 'Kannada Accent',
  },
];

export const getSavedLanguageCode = (): string => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('dhwani_active_lang');
  if (saved === 'en') return 'en';

  // Check cookie
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
  if (match) {
    const val = decodeURIComponent(match[1]);
    const parts = val.split('/');
    const last = parts[parts.length - 1];
    if (last && INDIAN_ACCENTS.some((a) => a.code === last)) {
      return last;
    }
  }
  return saved || 'en';
};

export const clearGoogleTranslateCookies = () => {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const path = window.location.pathname;
  const domains = [
    '',
    host,
    `.${host}`,
    host.includes('.') ? `.${host.split('.').slice(-2).join('.')}` : '',
  ].filter(Boolean);

  const paths = ['/', path, path.replace(/\/$/, '') || '/'];

  domains.forEach((d) => {
    paths.forEach((p) => {
      document.cookie = `googtrans=; path=${p}; domain=${d}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
    });
  });

  paths.forEach((p) => {
    document.cookie = `googtrans=; path=${p}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
  });
};

export const triggerGoogleCombo = (langCode: string, retries = 10) => {
  if (typeof window === 'undefined') return;

  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (select) {
    if (langCode === 'en') {
      select.selectedIndex = 0;
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof (select as any).onchange === 'function') {
        (select as any).onchange();
      }
      return;
    }

    // If changing to another language, ensure value transition triggers change
    if (select.value === langCode) {
      select.selectedIndex = 0;
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    setTimeout(() => {
      select.value = langCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof (select as any).onchange === 'function') {
        (select as any).onchange();
      }
    }, 20);
  } else if (retries > 0) {
    setTimeout(() => triggerGoogleCombo(langCode, retries - 1), 100);
  }
};

export const applyFullPageTranslation = (targetLangCode: string) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('dhwani_active_lang', targetLangCode);

  const matched = INDIAN_ACCENTS.find((a) => a.code === targetLangCode) || INDIAN_ACCENTS[0];
  localStorage.setItem('guardcall_language', matched.speechCode);

  if (targetLangCode === 'en') {
    clearGoogleTranslateCookies();

    // 1. Mark root element as notranslate / translate="no" so Google Translate ignores it completely
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('translate', 'no');
      rootEl.classList.add('notranslate');
    }

    // 2. Remove Google Translate styling and attributes from html and body
    document.documentElement.classList.remove('translated-ltr', 'translated-rtl');
    document.body.classList.remove('translated-ltr', 'translated-rtl');
    document.documentElement.removeAttribute('lang');
    document.documentElement.setAttribute('lang', 'en');
    document.title = 'Dhwani AI — Real-Time Voice Cloning Detection & Scam Protection';

    // 3. Reset Google Translate combo
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      select.selectedIndex = 0;
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof (select as any).onchange === 'function') {
        (select as any).onchange();
      }
    }

    // 4. Try Google Translate restore button in banner iframe if present
    try {
      const bannerFrame = document.querySelector('.goog-te-banner-frame, iframe.skiptranslate') as HTMLIFrameElement | null;
      if (bannerFrame && bannerFrame.contentDocument) {
        const restoreBtn = bannerFrame.contentDocument.querySelector('button[id*="restore"], a[id*="restore"], [id*=":1.restore"]') as HTMLElement | null;
        if (restoreBtn) {
          restoreBtn.click();
        }
      }
    } catch {}

    // 5. Instantly notify React to re-mount clean English JSX in memory (0ms, no black screen, no reload)
    window.dispatchEvent(new Event('dhwani-reset-english'));
    return;
  }

  // Non-English regional language selected (e.g. 'hi', 'bn', 'ta', etc.):
  // 1. Remove notranslate from root so Google Translate can translate it
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.removeAttribute('translate');
    rootEl.classList.remove('notranslate');
  }

  // 2. Set googtrans cookie
  clearGoogleTranslateCookies();
  const cookieValue = `/en/${targetLangCode}`;
  document.cookie = `googtrans=${cookieValue}; path=/;`;
  if (window.location.hostname && window.location.hostname !== 'localhost') {
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${window.location.hostname};`;
  }

  // 3. Trigger Google Translate combo
  triggerGoogleCombo(targetLangCode);
};

export const syncRouteTranslation = () => {
  if (typeof window === 'undefined') return;
  const activeLang = getSavedLanguageCode();
  if (!activeLang || activeLang === 'en') return;

  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.removeAttribute('translate');
    rootEl.classList.remove('notranslate');
  }

  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (select) {
    select.value = activeLang;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof (select as any).onchange === 'function') {
      (select as any).onchange();
    }
  }
};




