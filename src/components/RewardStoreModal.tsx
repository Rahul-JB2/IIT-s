import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  X,
  Check,
  Headphones,
  Play,
  Gamepad2,
  Globe,
  Lock,
  Unlock,
  Clock,
  Award,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { MasteryReward, ActiveRewardPass } from '../types/jee';
import { REWARDS_CATALOG, activateRewardPass } from '../utils/rewardSystem';

interface RewardStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  masteryPoints: number;
  streak: number;
  activePasses?: ActiveRewardPass[];
  onRedeemReward: (reward: MasteryReward) => void;
  onOpenGeminiSummary?: () => void;
}

export const RewardStoreModal: React.FC<RewardStoreModalProps> = ({
  isOpen,
  onClose,
  masteryPoints,
  streak,
  activePasses = [],
  onRedeemReward,
  onOpenGeminiSummary,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (reward: MasteryReward) => {
    if (masteryPoints < reward.costPoints) {
      return;
    }
    onRedeemReward(reward);
    setSuccessMessage(`Unlocked ${reward.title}! Pass is now active.`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3500);

    if (reward.type === 'gemini_mock_summary' && onOpenGeminiSummary) {
      setTimeout(() => {
        onClose();
        onOpenGeminiSummary();
      }, 1000);
    }
  };

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'headphones':
        return <Headphones className="w-5 h-5 text-amber-400" />;
      case 'play':
        return <Play className="w-5 h-5 text-rose-400 fill-rose-400/20" />;
      case 'gamepad-2':
        return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      case 'globe':
        return <Globe className="w-5 h-5 text-sky-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-amber-950/40 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  JEE Mastery Rewards Store
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  Game Rewards
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Study goals complete karein aur Pocket FM, YouTube ya Gaming pass unlock karein!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Streak Bar */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Mastery Balance:</span>
              <span className="font-mono font-bold text-amber-400 text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {masteryPoints} Pts
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Streak:</span>
              <span className="font-mono font-bold text-orange-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {streak} Days
              </span>
            </div>
          </div>

          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Earn +20 pts / PCM Goal • +50 pts / Daily Target
          </span>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Active Passes Ticker */}
        {activePasses.length > 0 && (
          <div className="p-3 mx-4 mt-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-1.5">
            <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider font-bold block">
              Active Unlocked Passes:
            </span>
            <div className="flex flex-wrap gap-2">
              {activePasses.map((pass) => (
                <div
                  key={pass.id}
                  className="px-2.5 py-1 bg-slate-950 border border-indigo-600/60 rounded-lg text-xs font-mono text-indigo-200 flex items-center gap-2"
                >
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="font-bold">{pass.appName}:</span>
                  <span className="text-amber-300 font-semibold">
                    {Math.floor(pass.remainingSeconds / 60)}:
                    {String(pass.remainingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REWARDS_CATALOG.map((reward) => {
              const canAfford = masteryPoints >= reward.costPoints;
              const isCurrentlyActive = activePasses.some((p) => p.type === reward.type);

              return (
                <div
                  key={reward.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isCurrentlyActive
                      ? 'bg-emerald-950/30 border-emerald-600/60'
                      : canAfford
                      ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-850 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                        {getRewardIcon(reward.icon)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {reward.title}
                        </h4>
                        <span className="text-[10px] text-amber-400 font-mono font-semibold">
                          {reward.badgeText}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-amber-300 block">
                        {reward.costPoints} Pts
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {reward.description}
                  </p>

                  <div className="pt-1">
                    {isCurrentlyActive ? (
                      <div className="w-full py-1.5 text-center text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 rounded-lg flex items-center justify-center gap-1.5 font-mono">
                        <Unlock className="w-3 h-3" />
                        <span>Pass Active Now</span>
                      </div>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => handleRedeem(reward)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {canAfford
                            ? `Redeem for ${reward.costPoints} Pts`
                            : `Need ${reward.costPoints - masteryPoints} More Pts`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>🎯 Rule: Daily goals aur target hours complete karke hi points milte hain!</span>
          <span className="text-slate-500">Android Study Guard Gamified Store</span>
        </div>
      </div>
    </div>
  );
};
