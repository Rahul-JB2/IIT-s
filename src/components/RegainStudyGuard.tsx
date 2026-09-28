import React, { useState, useEffect } from 'react';
import { Chapter } from '../types/jee';
import { OverdueSummaryViolation } from '../utils/punishmentSystem';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Video,
  BellOff,
  Clock,
  Eye,
  Play,
  ExternalLink,
  Flame,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Check,
  RotateCcw,
  Zap,
  BookOpen,
} from 'lucide-react';

interface CuratedStudyShort {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Math';
  duration: string;
  creator: string;
  conceptTrap: string;
  embedQuery: string;
}

interface RegainStudyGuardProps {
  overdueViolations?: OverdueSummaryViolation[];
  onOpenSummaryModal?: (chapter: Chapter) => void;
}

const STUDY_SHORTS: CuratedStudyShort[] = [
  {
    id: 's-1',
    title: 'Vernier Calliper & Zero Error in 60s',
    subject: 'Physics',
    duration: '58s',
    creator: 'Physics Galaxy / Super-50',
    conceptTrap: 'Zero error is subtracted from measured reading (Observed = MSR + VSR - Zero Error)!',
    embedQuery: 'https://www.youtube.com/results?search_query=vernier+caliper+zero+error+physics+galaxy',
  },
  {
    id: 's-2',
    title: 'Hückel 4n+2 Aromaticity Rule Trap',
    subject: 'Chemistry',
    duration: '52s',
    creator: 'Organic Chemistry Super-50',
    conceptTrap: 'Planarity is mandatory! Cyclooctatetraene (COT) is tub-shaped, hence non-aromatic.',
    embedQuery: 'https://www.youtube.com/results?search_query=aromaticity+huckel+rule+exceptions+jee',
  },
  {
    id: 's-3',
    title: '3D Geometry: Shortest Distance Formula',
    subject: 'Math',
    duration: '60s',
    creator: 'MathonGo Concept Builder',
    conceptTrap: 'd = |(a2 - a1) · (b1 × b2)| / |b1 × b2|. If zero, lines intersect in space!',
    embedQuery: 'https://www.youtube.com/results?search_query=shortest+distance+between+skew+lines+mathongo',
  },
  {
    id: 's-4',
    title: 'Stoichiometry n-Factor for Redox Disproportionation',
    subject: 'Chemistry',
    duration: '55s',
    creator: 'Super-50 P-Chem',
    conceptTrap: 'For disproportionation: 1/n_total = 1/n1 + 1/n2. Never add n-factors directly!',
    embedQuery: 'https://www.youtube.com/results?search_query=n+factor+disproportionation+reaction+jee',
  },
  {
    id: 's-5',
    title: 'Pure Rolling: Velocity of Top vs Bottom Point',
    subject: 'Physics',
    duration: '59s',
    creator: 'Eduniti Physics Revision',
    conceptTrap: 'Point in contact has v=0 (instantaneous center). Top point moves at 2v_cm!',
    embedQuery: 'https://www.youtube.com/results?search_query=pure+rolling+instantaneous+center+eduniti',
  },
  {
    id: 's-6',
    title: 'Integration by Parts: Leibniz Integral Rule',
    subject: 'Math',
    duration: '54s',
    creator: 'Arvind Kalia Sir / Math',
    conceptTrap: 'Differentiating under integral sign: d/dx ∫ f(x,t)dt requires chain rule for limits!',
    embedQuery: 'https://www.youtube.com/results?search_query=leibnitz+integral+rule+jee+math',
  },
];

const WHITELISTED_CHANNELS = [
  { name: 'Physics Galaxy (Ashish Arora Sir)', focus: 'Physics Concept Clarity & Advanced Traps' },
  { name: 'MathonGo (Anup Gupta Sir)', focus: 'Math Problem Solving & Concept Builder' },
  { name: 'Eduniti (Mohit Goenka Sir)', focus: 'Physics PYQ Video Solutions & Formulas' },
  { name: 'BSEB Super-50 Official Live', focus: 'Super-50 Daily Classroom Lectures' },
  { name: 'Mohit Tyagi (Competishun)', focus: 'Full Syllabus Deep Mathematical Theory' },
];

export const RegainStudyGuard: React.FC<RegainStudyGuardProps> = ({
  overdueViolations = [],
  onOpenSummaryModal,
}) => {
  // Regain Guard active state
  const isPunishmentActive = overdueViolations.length > 0;
  const [isShieldActive, setIsShieldActive] = useState<boolean>(true);
  const [notificationsBlocked, setNotificationsBlocked] = useState<number>(38);
  const [savedMinutes, setSavedMinutes] = useState<number>(145); // 2h 25m

  // 10-second Friction Breaker Modal State (like Regain / One Sec app)
  const [showFrictionModal, setShowFrictionModal] = useState<boolean>(false);
  const [frictionCountdown, setFrictionCountdown] = useState<number>(10);
  const [pledgeText, setPledgeText] = useState<string>('');
  const targetPledge = 'I will crack JEE Super-50';

  // Active Curated Study Short viewer
  const [activeShort, setActiveShort] = useState<CuratedStudyShort | null>(null);

  // Friction modal timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (showFrictionModal && frictionCountdown > 0) {
      timer = setInterval(() => {
        setFrictionCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showFrictionModal, frictionCountdown]);

  const handleRequestDisableShield = () => {
    if (isPunishmentActive) {
      // Cannot disable shield during punishment lockdown!
      return;
    }
    if (isShieldActive) {
      // Trigger Regain 10-second friction pause
      setFrictionCountdown(10);
      setPledgeText('');
      setShowFrictionModal(true);
    } else {
      setIsShieldActive(true);
    }
  };

  const handleConfirmUnlock = () => {
    if (frictionCountdown === 0 && pledgeText.trim().toLowerCase() === targetPledge.toLowerCase()) {
      setIsShieldActive(false);
      setShowFrictionModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Regain Digital Detox & Study Guard</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Distraction Blocker & Study Shorts Filter
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Blocks non-educational YouTube Shorts, prevents algorithmic doomscrolling, and mutes notification interruptions during study sessions.
          </p>
        </div>

        {/* Shield Toggle Switch */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shrink-0">
          <div className="text-right text-xs">
            <span className={`font-bold block ${isShieldActive ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isShieldActive ? 'Study Guard Active' : 'Shield Inactive'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {isShieldActive ? 'Shorts & Feeds Blocked' : 'Unrestricted browsing'}
            </span>
          </div>

          <button
            onClick={handleRequestDisableShield}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              isShieldActive
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
            }`}
          >
            {isShieldActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isShieldActive ? 'PROTECTED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* PUNISHMENT LOCKDOWN NOTICE IN REGAIN GUARD (30% Dimensions) */}
      {isPunishmentActive && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/80 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg shadow-rose-950/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-600/30 border border-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-rose-300 font-bold uppercase tracking-wider bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                  Lockdown Active
                </span>
                <span className="text-xs font-semibold text-rose-100 truncate">
                  Entertainment Apps Locked: <u>{overdueViolations[0].chapter.name}</u>
                </span>
              </div>
              <p className="text-[10px] text-rose-300/80 truncate font-mono">
                1-Page Summary overdue since {overdueViolations[0].theoryCompletedDate}. Complete summary to disable lockdown.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onOpenSummaryModal) {
                onOpenSummaryModal(overdueViolations[0].chapter);
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-rose-300 hover:bg-rose-200 rounded-lg shadow transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Complete Summary</span>
          </button>
        </div>
      )}

      {/* Regain Focus Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Time Saved from Shorts</span>
            <span className="text-2xl font-bold text-amber-400">
              {Math.floor(savedMinutes / 60)}h {savedMinutes % 60}m
            </span>
            <span className="text-[10px] text-slate-500 block">Preserved for Super-50 rank</span>
          </div>
          <Clock className="w-8 h-8 text-amber-500/40" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Distractions Blocked Today</span>
            <span className="text-2xl font-bold text-emerald-400">
              {notificationsBlocked} Alerts
            </span>
            <span className="text-[10px] text-slate-500 block">Muted notifications & popups</span>
          </div>
          <BellOff className="w-8 h-8 text-emerald-500/40" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Dopamine Reset Streak</span>
            <span className="text-2xl font-bold text-sky-400">
              6 Days Zero Reels
            </span>
            <span className="text-[10px] text-slate-500 block">Clean mental bandwidth</span>
          </div>
          <Flame className="w-8 h-8 text-sky-500/40" />
        </div>
      </div>

      {/* Feature 1: "Only Study Shorts Allowed" - Curated 60s Micro-Concept Revision Hub */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-0.5">
              <Video className="w-4 h-4" />
              <span>Study-Only Shorts Vault</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Curated 60-Second JEE Revision Shorts
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" /> Algorithmic Feeds Filtered
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Instead of endless entertainment doomscrolling, watch high-yield, 60-second micro-concept reels focusing solely on exam traps, vital formulas, and shortcut tricks created by top JEE mentors.
        </p>

        {/* Shorts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {STUDY_SHORTS.map((short) => {
            const isPhysics = short.subject === 'Physics';
            const isChem = short.subject === 'Chemistry';
            const badgeColor = isPhysics
              ? 'text-sky-400 border-sky-800/60 bg-sky-950/60'
              : isChem
              ? 'text-emerald-400 border-emerald-800/60 bg-emerald-950/60'
              : 'text-amber-400 border-amber-800/60 bg-amber-950/60';

            return (
              <div
                key={short.id}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded border font-semibold ${badgeColor}`}>
                      {short.subject}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">{short.duration}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {short.title}
                  </h4>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1">
                    <span className="text-amber-400 font-semibold block text-[10px] uppercase">
                      Exam Trap / Key Trick:
                    </span>
                    <p className="text-slate-300 leading-tight font-mono">{short.conceptTrap}</p>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                    {short.creator}
                  </span>

                  <a
                    href={short.embedQuery}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-slate-950" /> Watch
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Whitelisted Study-Only YouTube Channels */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Whitelisted Educational Channels (Regain Filter Active)
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          When Regain Study Guard is ON, non-educational search results and recommendations are blocked. Only these verified channels are permitted:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {WHITELISTED_CHANNELS.map((ch, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1"
            >
              <div className="flex items-center justify-between">
                <strong className="text-slate-200 font-semibold truncate">{ch.name}</strong>
                <span className="text-[10px] text-emerald-400 font-mono">ALLOWED</span>
              </div>
              <p className="text-[11px] text-slate-400">{ch.focus}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature 3: Notification Shield & DND Rules */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3 text-xs text-slate-300">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <BellOff className="w-4 h-4 text-rose-400" />
          Notification Interruption Blocker & Phone Hygiene Rules
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <strong className="text-sky-300 block">1. Airplane / DND Protocol</strong>
            <p className="text-slate-400 leading-relaxed">
              Place your phone in "Do Not Disturb" or 10 feet away during the 25-minute Pomodoro timer. Research shows even seeing your phone screen reduces working memory by 20%.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <strong className="text-amber-300 block">2. Fixed Dopamine Windows</strong>
            <p className="text-slate-400 leading-relaxed">
              Never check feeds between subject transitions (e.g. after Physics, do not open reels before Chemistry). Reserve 15 minutes of leisure strictly at the end of the day after 10 PM.
            </p>
          </div>
        </div>
      </div>

      {/* Regain 10-Second Friction Breaker Modal */}
      {showFrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 text-2xl font-bold font-mono">
              {frictionCountdown > 0 ? frictionCountdown : '✓'}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Take a Deep Breath Before Leaving Focus
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Regain Mindfulness Pause: Are you sure you want to disable Study Guard? Short-form algorithms are engineered to steal 2+ hours of your Super-50 rank.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-left space-y-2">
              <label className="text-slate-400 block font-medium text-[11px]">
                To unlock, type this pledge after countdown completes:
              </label>
              <div className="font-mono text-amber-300 text-xs font-semibold select-none bg-slate-900 p-2 rounded border border-slate-800">
                "{targetPledge}"
              </div>
              <input
                type="text"
                disabled={frictionCountdown > 0}
                value={pledgeText}
                onChange={(e) => setPledgeText(e.target.value)}
                placeholder={frictionCountdown > 0 ? `Wait ${frictionCountdown}s...` : 'Type pledge here...'}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowFrictionModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-sm"
              >
                Keep Shield ON & Study
              </button>

              <button
                disabled={frictionCountdown > 0 || pledgeText.trim().toLowerCase() !== targetPledge.toLowerCase()}
                onClick={handleConfirmUnlock}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
              >
                Unlock Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
