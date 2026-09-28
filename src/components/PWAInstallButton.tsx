import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'pill' | 'header' | 'drawer' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside standalone app mode (no browser tabs)
  if (isInstalled) {
    if (variant === 'drawer') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px]">Android App Active (No Tabs)</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleAction}
          title="Install as Android App (No Browser Tabs)"
          className={`flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-bold transition shadow-sm ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-mono hidden xs:inline">App</span>
          <Download className="w-3 h-3 text-emerald-400" />
        </button>

        <AndroidInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        <button
          onClick={handleAction}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-bold transition shadow-sm ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <p className="leading-tight">Install Android App</p>
              <p className="text-[10px] text-slate-400 font-normal">Remove browser tabs & URL bar</p>
            </div>
          </div>
          <Download className="w-4 h-4 text-emerald-400" />
        </button>

        <AndroidInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  // Card or Pill variant
  return (
    <>
      <button
        onClick={handleAction}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md shadow-emerald-600/20 transition ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Install App</span>
      </button>

      <AndroidInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
