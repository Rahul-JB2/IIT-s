import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';
import { Smartphone, Download, X, ShieldAlert, Sparkles } from 'lucide-react';

export const AndroidAppBanner: React.FC = () => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('super50_dismiss_android_banner') === 'true';
  });
  const [showModal, setShowModal] = useState(false);

  // If already installed in standalone mode (no browser tabs), do not show
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('super50_dismiss_android_banner', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <aside aria-label="Android App Banner" className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-emerald-950/90 border-b border-amber-500/40 text-slate-100 px-3 py-2 text-xs transition-all relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Smartphone className="w-3.5 h-3.5 animate-bounce" />
            </span>
            <p className="truncate text-slate-200">
              <strong className="text-amber-400 font-semibold">Android App Mode:</strong>{' '}
              <span className="text-slate-300">Browser tabs remove karke native full-screen app install karein</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded text-[11px] shadow-sm flex items-center gap-1 transition active:scale-95"
            >
              <Download className="w-3 h-3 stroke-[2.5]" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              title="Dismiss banner"
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <AndroidInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
