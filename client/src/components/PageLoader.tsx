import { useLocation } from 'react-router-dom';

const getRouteName = (pathname: string): string => {
  if (pathname.startsWith('/enterprise-api') || pathname.startsWith('/integrations')) {
    return 'Enterprise API';
  }
  if (pathname.startsWith('/architecture')) {
    return 'Architecture';
  }
  if (pathname.startsWith('/dashboard')) {
    return 'Security Cases';
  }
  if (pathname.startsWith('/session')) {
    return 'Cockpit Session';
  }
  if (pathname.startsWith('/report')) {
    return 'Forensic Report';
  }
  if (pathname.startsWith('/consent')) {
    return 'Privacy Safeguards';
  }
  if (pathname.startsWith('/download')) {
    return 'Download App';
  }
  return 'Caller Verification';
};

export default function PageLoader() {
  const location = useLocation();
  const routeName = getRouteName(location.pathname);

  return (
    <div
      role="status"
      aria-label={`Loading ${routeName}`}
      className="flex-1 flex flex-col items-center justify-center min-h-[50vh] w-full px-4 select-none"
    >
      {/* ── Uiverse Bar Key Loading Animation in Amber ── */}
      <div className="relative flex items-center justify-center h-12 w-20">
        <div className="jimu-primary-loading" />
      </div>

      {/* ── Dynamic Page Route Name ── */}
      <div className="mt-6 flex flex-col items-center text-center space-y-1">
        <p className="text-xs sm:text-sm font-mono tracking-widest uppercase text-amber-400 font-bold drop-shadow-[0_0_12px_rgba(245,158,11,0.55)]">
          Loading {routeName}
        </p>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">
          Securing Connection...
        </span>
      </div>

      <style>{`
        .jimu-primary-loading:before,
        .jimu-primary-loading:after {
          position: absolute;
          top: 0;
          content: '';
        }

        .jimu-primary-loading:before {
          left: -19.992px;
        }

        .jimu-primary-loading:after {
          left: 19.992px;
          -webkit-animation-delay: 0.32s !important;
          animation-delay: 0.32s !important;
        }

        .jimu-primary-loading:before,
        .jimu-primary-loading:after,
        .jimu-primary-loading {
          background: #f59e0b;
          -webkit-animation: loading-keys-app-loading 0.8s infinite ease-in-out;
          animation: loading-keys-app-loading 0.8s infinite ease-in-out;
          width: 13.6px;
          height: 32px;
          border-radius: 3px;
        }

        .jimu-primary-loading {
          text-indent: -9999em;
          margin: auto;
          position: relative;
          -webkit-animation-delay: 0.16s !important;
          animation-delay: 0.16s !important;
        }

        @-webkit-keyframes loading-keys-app-loading {
          0%,
          80%,
          100% {
            opacity: 0.75;
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
            height: 32px;
          }

          40% {
            opacity: 1;
            box-shadow: 0 -8px 18px rgba(251, 191, 36, 0.85);
            height: 40px;
          }
        }

        @keyframes loading-keys-app-loading {
          0%,
          80%,
          100% {
            opacity: 0.75;
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
            height: 32px;
          }

          40% {
            opacity: 1;
            box-shadow: 0 -8px 18px rgba(251, 191, 36, 0.85);
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
}
