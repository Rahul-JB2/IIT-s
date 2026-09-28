import React from 'react';
import {
  ShieldAlert,
  Lock,
  X,
  Sparkles,
  ArrowRight,
  Headphones,
  Play,
  Gamepad2,
  Globe,
  Clock,
  BookOpen,
} from 'lucide-react';
import { BlockedAppConfig } from '../types/jee';

interface AndroidBlockOverlayModalProps {
  app: BlockedAppConfig | null;
  isOpen: boolean;
  onClose: () => void;
  masteryPoints?: number;
  onOpenRewardStore?: () => void;
  onReturnToStudy?: () => void;
}

export const AndroidBlockOverlayModal: React.FC<AndroidBlockOverlayModalProps> = ({
  app,
  isOpen,
  onClose,
  masteryPoints = 0,
  onOpenRewardStore,
  onReturnToStudy,
}) => {
  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500/70 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl shadow-rose-950/80 space-y-4 text-center relative overflow-hidden">
        {/* Siren Glow & Header */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-950/90 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-900/40">
          <ShieldAlert className="w-9 h-9 animate-pulse" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3 h-3" />
            <span>Android App Blocked</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {app.appName} is Restricted!
          </h3>

          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Super-50 Study Guard has intercepted <strong className="text-amber-300">{app.appName}</strong>. During active preparation, entertainment feeds and games are blocked to guarantee JEE Main & Advanced top ranks.
          </p>
        </div>

        {/* Why Blocked & Reward Solution */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-left space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span>Detection Package:</span>
            <span className="font-mono text-slate-300">{app.packageName}</span>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <span>How to unlock this app?</span>
            </span>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>Complete your daily PCM target study hours.</li>
              <li>Or redeem a temporary story/gaming/YouTube pass using JEE Mastery Points.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Your Mastery Balance:</span>
            <span className="font-mono font-bold text-amber-400 text-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {masteryPoints} Points
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              onClose();
              if (onReturnToStudy) onReturnToStudy();
            }}
            className="w-full py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Return to JEE Study Tracker</span>
          </button>

          {onOpenRewardStore && app.allowedWithPassType && (
            <button
              onClick={() => {
                onClose();
                onOpenRewardStore();
              }}
              className="w-full py-2 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Redeem {app.appName} Pass in Reward Store</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="text-[11px] text-slate-500 hover:text-slate-300 pt-1"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
