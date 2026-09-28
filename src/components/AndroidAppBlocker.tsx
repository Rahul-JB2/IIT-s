import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Lock,
  Unlock,
  Play,
  Globe,
  Headphones,
  Gamepad2,
  Camera,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Settings2,
} from 'lucide-react';
import {
  ANDROID_PERMISSIONS,
  DEFAULT_BLOCKED_APPS,
  openAndroidPermissionSettings,
} from '../utils/androidPermissions';
import { ActiveRewardPass, BlockedAppConfig } from '../types/jee';
import { isPassActive } from '../utils/rewardSystem';

interface AndroidAppBlockerProps {
  permissions?: Record<string, boolean>;
  onTogglePermission?: (permId: string, granted: boolean) => void;
  activePasses?: ActiveRewardPass[];
  onOpenRewardStore?: () => void;
  onSimulateAppLaunch?: (app: BlockedAppConfig) => void;
}

export const AndroidAppBlocker: React.FC<AndroidAppBlockerProps> = ({
  permissions = {
    usage_stats: true,
    overlay: true,
    accessibility: true,
    dnd_policy: true,
    battery_opt: true,
  },
  onTogglePermission,
  activePasses = [],
  onOpenRewardStore,
  onSimulateAppLaunch,
}) => {
  const [selectedAppForTesting, setSelectedAppForTesting] = useState<BlockedAppConfig | null>(null);

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'play':
        return <Play className="w-4 h-4 text-rose-400 fill-rose-400/20" />;
      case 'globe':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'headphones':
        return <Headphones className="w-4 h-4 text-amber-400" />;
      case 'gamepad-2':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'camera':
        return <Camera className="w-4 h-4 text-pink-400" />;
      default:
        return <Smartphone className="w-4 h-4 text-slate-400" />;
    }
  };

  const allCriticalGranted =
    permissions.usage_stats && permissions.overlay && permissions.accessibility;

  return (
    <div className="space-y-4">
      {/* Android Blocker Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Android App Blocker & System Permissions
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    allCriticalGranted
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  }`}
                >
                  {allCriticalGranted ? 'System Shield Active' : 'Permissions Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Blocks YouTube, Chrome, Pocket FM & Games during study hours. Unlocked only with reward passes.
              </p>
            </div>
          </div>

          {onOpenRewardStore && (
            <button
              onClick={onOpenRewardStore}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Redeem Pass</span>
            </button>
          )}
        </div>

        {/* Permission Health Alert */}
        {!allCriticalGranted && (
          <div className="bg-rose-950/60 border border-rose-700/60 rounded-lg p-2.5 text-xs text-rose-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Android OS Notice:</span> Chrome aur YouTube ko background me block karne ke liye Android Usage Access aur Overlay permissions mandatory hain. Niche grant switch enable karein.
            </div>
          </div>
        )}
      </div>

      {/* Android System Permissions Checklist */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Android System Permissions Checklist
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {Object.values(permissions).filter(Boolean).length}/{ANDROID_PERMISSIONS.length} Granted
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {ANDROID_PERMISSIONS.map((perm) => {
            const isGranted = !!permissions[perm.id];
            return (
              <div
                key={perm.id}
                className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 sm:p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white truncate">
                      {perm.name}
                    </span>
                    {perm.isCritical && (
                      <span className="text-[9px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1 py-0.2 rounded font-bold">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {perm.description}
                  </p>
                  <span className="text-[10px] font-mono text-sky-400/90 block">
                    Key: {perm.permissionKey}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (onTogglePermission) {
                        onTogglePermission(perm.id, !isGranted);
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 ${
                      isGranted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900'
                        : 'bg-rose-950 text-rose-300 border border-rose-700/80 hover:bg-rose-900'
                    }`}
                  >
                    {isGranted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Granted</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Enable</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openAndroidPermissionSettings(perm.intentAction)}
                    title="Open native Android OS Settings intent"
                    className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>OS Settings</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Apps & Live Pass Status */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Super-50 App Blocker Monitor (YouTube, Chrome, Games, Pocket FM)
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {DEFAULT_BLOCKED_APPS.length} Apps Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_BLOCKED_APPS.map((app) => {
            const activePass = app.allowedWithPassType
              ? isPassActive(activePasses, app.allowedWithPassType)
              : null;
            const isUnlocked = !!activePass;

            return (
              <div
                key={app.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isUnlocked
                    ? 'bg-emerald-950/20 border-emerald-600/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {getAppIcon(app.icon)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{app.appName}</h5>
                      <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[140px]">
                        {app.packageName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                      isUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Pass Active</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5 text-rose-400" />
                        <span>BLOCKED</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Status description */}
                {isUnlocked ? (
                  <div className="bg-emerald-950/50 border border-emerald-800/60 rounded-lg p-1.5 px-2 text-[10px] text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>
                        Remaining:{' '}
                        {Math.floor(activePass.remainingSeconds / 60)}:
                        {String(activePass.remainingSeconds % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-semibold">Story/Break Time</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    {app.allowedWithPassType === 'pocket_fm'
                      ? 'Pocket FM is locked during study. Redeem story pass to listen.'
                      : app.allowedWithPassType === 'youtube'
                      ? 'YouTube is locked during study. Complete goals to unlock pass.'
                      : app.allowedWithPassType === 'game'
                      ? 'Phone games locked. Earn 80 points to get a 20-min gaming pass.'
                      : app.allowedWithPassType === 'chrome'
                      ? 'Chrome browsing restricted to prevent doomscrolling.'
                      : 'Permanently blocked during JEE Super-50 preparation.'}
                  </p>
                )}

                {/* Action button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (onSimulateAppLaunch) {
                        onSimulateAppLaunch(app);
                      }
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isUnlocked
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{isUnlocked ? 'Open ' + app.appName : 'Test App Intercept'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {!isUnlocked && onOpenRewardStore && app.allowedWithPassType && (
                    <button
                      onClick={onOpenRewardStore}
                      title="Unlock with JEE Mastery Points"
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
