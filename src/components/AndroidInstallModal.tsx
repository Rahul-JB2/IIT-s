import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  Share2,
  MoreVertical,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon + Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center">
              <span className="text-amber-400 font-extrabold font-mono text-xl leading-none">50</span>
              <span className="text-[8px] font-bold text-slate-300 tracking-tighter">SUPER-50</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Android App PWA
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              JEE Super-50 Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Install as standalone phone app (No browser tabs!)
            </p>
          </div>
        </div>

        {/* Feature Highlights: Why install as Android App */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span><strong>No Browser Tabs or URL Bar:</strong> Full native Android app display</span>
          </div>
          <div className="flex items-center gap-2 text-sky-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-400" />
            <span><strong>Home Screen Icon:</strong> 1-Tap launch from phone screen</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
            <span><strong>Offline Support:</strong> Works even with low/no internet in hostel</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
            <span><strong>Distraction-Free:</strong> No web browser notifications or clutter</span>
          </div>
        </div>

        {/* State 1: Already installed in Standalone Mode */}
        {isInstalled ? (
          <div className="text-center py-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-300">
              App Successfully Running in Standalone Mode!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Browser tabs are permanently removed. Enjoy your native Super-50 study experience!
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Done / Continue
            </button>
          </div>
        ) : installSuccess ? (
          <div className="text-center py-4 bg-emerald-950/50 border border-emerald-500 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-bold text-white">Installing to your Phone...</p>
            <p className="text-xs text-emerald-400 mt-1">Check your home screen in 2 seconds!</p>
          </div>
        ) : isInstallable ? (
          // Direct 1-Click Install via beforeinstallprompt
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Install Android App Now</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Free • Zero Storage Clutter • No Browser Tabs
            </p>
          </div>
        ) : isIOS ? (
          // iOS Safari instructions
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-amber-400" />
              iPhone / iPad Install Guide:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>Tap the <strong>Share</strong> button at bottom of Safari</li>
              <li>Scroll down and select <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in top right corner</li>
            </ol>
            <p className="text-[10px] text-slate-400 mt-2">
              The app icon will appear on your home screen and run full-screen without Safari tabs!
            </p>
          </div>
        ) : (
          // Android Chrome 3-Dots manual instructions if browser hasn't fired prompt
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <MoreVertical className="w-4 h-4 text-amber-400" />
              Android Chrome me Install karne ka tarika:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>
                Chrome browser ke top-right me <strong>3 dots (⋮)</strong> par click karein.
              </li>
              <li>
                Menu me <strong>"Install app"</strong> ya <strong>"Add to Home screen" (होम स्क्रीन पर जोड़ें)</strong> chunein.
              </li>
              <li>
                <strong>"Install"</strong> confirm karein.
              </li>
            </ol>
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-300 text-[11px] mt-2">
              💡 <strong>Note:</strong> Ek baar install hone ke baad mobile ke home screen icon se open karein. <strong>Browser ke saare tabs gayab ho jayenge</strong> aur ye direct real app ki tarah open hoga!
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Version 2.4 (Native PWA)</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline underline-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
