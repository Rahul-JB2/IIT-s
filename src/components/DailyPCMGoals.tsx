import React, { useState, useEffect, useRef } from 'react';
import {
  Chapter,
  DailyGoalItem,
  DailyPlan,
  FocusSessionLog,
  MilestoneKey,
  MILESTONES,
  SubjectType,
  UserStudyState,
  UserEnergyProfile,
  AlertSlotKey,
  EnergyLevel,
} from '../types/jee';
import { ALL_CHAPTERS } from '../data/super50Data';
import { playChimeSound } from '../utils/audioAlert';
import { OverdueSummaryViolation } from '../utils/punishmentSystem';
import { AIQuizModal } from './AIQuizModal';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  AlertCircle,
  ArrowRightLeft,
  BookOpen,
  Clock,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
  Flame,
  Timer,
  Award,
  ListOrdered,
  ShieldAlert,
  Target,
  Trophy,
  Plus,
  BatteryCharging,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Sunrise,
  AlertTriangle,
  Edit2,
  Save,
  Minus,
} from 'lucide-react';

interface DailyPCMGoalsProps {
  plan: DailyPlan;
  currentDate: string;
  chapterProgress: UserStudyState['chapterProgress'];
  onToggleGoalMilestone: (chapterId: string, milestoneKey: MilestoneKey, isCompleted: boolean) => void;
  onRegeneratePlan: () => void;
  onSwapChapter: (goalId: string, newChapterId: string) => void;
  onChangeMilestone: (goalId: string, newMilestoneKey: MilestoneKey) => void;
  onLogStudyMinutes: (minutes: number) => void;
  focusLogs?: FocusSessionLog[];
  onAddFocusLog?: (log: FocusSessionLog) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenChapterModal?: (chapter: Chapter) => void;
  dailyHoursToday?: number;
  onUpdateDailyHours?: (hours: number) => void;
  targetDailyHours?: number;
  onUpdateTargetDailyHours?: (hours: number) => void;
  dailyQuestions?: { total: number; physics: number; chemistry: number; math: number };
  onAddQuestions?: (subject: SubjectType, count: number) => void;
  overdueViolations?: OverdueSummaryViolation[];
  energyProfile?: UserEnergyProfile;
  onUpdateEnergyProfile?: (profile: UserEnergyProfile) => void;
}

export const DailyPCMGoals: React.FC<DailyPCMGoalsProps> = ({
  plan,
  currentDate,
  chapterProgress,
  onToggleGoalMilestone,
  onRegeneratePlan,
  onSwapChapter,
  onChangeMilestone,
  onLogStudyMinutes,
  focusLogs = [],
  onAddFocusLog,
  onNavigateTab,
  onOpenChapterModal,
  dailyHoursToday = 6.5,
  onUpdateDailyHours,
  targetDailyHours = 8.0,
  onUpdateTargetDailyHours,
  dailyQuestions = { total: 72, physics: 28, chemistry: 24, math: 20 },
  onAddQuestions,
  overdueViolations = [],
  energyProfile = {
    peakAlertSlot: 'morning',
    prioritizeHardestInPeakHours: true,
    subjectEnergy: {
      Physics: 'High',
      Chemistry: 'Medium',
      Math: 'High',
    },
  },
  onUpdateEnergyProfile,
}) => {
  // AI Quiz Modal state
  const [selectedQuizGoal, setSelectedQuizGoal] = useState<DailyGoalItem | null>(null);
  const [showEnergyOptimizer, setShowEnergyOptimizer] = useState<boolean>(true);

  // Focus Pomodoro Timer State
  const [selectedFocusGoalId, setSelectedFocusGoalId] = useState<string>(plan.goals[0]?.id || '');
  const [focusPresetMinutes, setFocusPresetMinutes] = useState<number>(25);
  const [focusRemainingSeconds, setFocusRemainingSeconds] = useState<number>(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sessionCompletedModal, setSessionCompletedModal] = useState<DailyGoalItem | null>(null);

  // Local log state in case onAddFocusLog is optional
  const [localFocusLogs, setLocalFocusLogs] = useState<FocusSessionLog[]>(focusLogs);

  // Individual card inline stopwatch timers
  const [activeStopwatchGoalId, setActiveStopwatchGoalId] = useState<string | null>(null);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  // Chapter swap modal/dropdown state
  const [swappingGoalId, setSwappingGoalId] = useState<string | null>(null);

  // Target Daily Study Hours state
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>(targetDailyHours.toString());

  useEffect(() => {
    setCustomTargetInput(targetDailyHours.toString());
  }, [targetDailyHours]);

  // Sync selected focus goal if plan changes
  useEffect(() => {
    if (!selectedFocusGoalId && plan.goals.length > 0) {
      setSelectedFocusGoalId(plan.goals[0].id);
    }
  }, [plan.goals, selectedFocusGoalId]);

  // Pomodoro Countdown Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isFocusRunning && focusRemainingSeconds > 0) {
      interval = setInterval(() => {
        setFocusRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isFocusRunning && focusRemainingSeconds === 0) {
      // Completed Pomodoro session!
      setIsFocusRunning(false);
      if (soundEnabled) {
        playChimeSound();
      }

      const activeGoal = plan.goals.find((g) => g.id === selectedFocusGoalId) || plan.goals[0];
      const logEntry: FocusSessionLog = {
        id: 'focus-' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chapterId: activeGoal.chapterId,
        chapterName: activeGoal.chapterName,
        subject: activeGoal.subject,
        durationMinutes: focusPresetMinutes,
        completedGoal: true,
      };

      setLocalFocusLogs((prev) => [logEntry, ...prev]);
      if (onAddFocusLog) {
        onAddFocusLog(logEntry);
      }
      onLogStudyMinutes(focusPresetMinutes);
      setSessionCompletedModal(activeGoal);

      // Reset timer to preset
      setFocusRemainingSeconds(focusPresetMinutes * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocusRunning, focusRemainingSeconds, soundEnabled, selectedFocusGoalId, plan.goals, focusPresetMinutes, onAddFocusLog, onLogStudyMinutes]);

  // Inline stopwatch effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStopwatchRunning]);

  const handleStartFocusTimer = () => {
    setIsFocusRunning(true);
  };

  const handlePauseFocusTimer = () => {
    setIsFocusRunning(false);
  };

  const handleResetFocusTimer = (minutes = focusPresetMinutes) => {
    setIsFocusRunning(false);
    setFocusPresetMinutes(minutes);
    setFocusRemainingSeconds(minutes * 60);
  };

  const handleSelectPreset = (minutes: number) => {
    setIsFocusRunning(false);
    setFocusPresetMinutes(minutes);
    setFocusRemainingSeconds(minutes * 60);
  };

  // Stopwatch handlers
  const handleStartStopwatch = (goalId: string) => {
    if (activeStopwatchGoalId !== goalId) {
      if (stopwatchSeconds > 60) {
        onLogStudyMinutes(Math.round(stopwatchSeconds / 60));
      }
      setActiveStopwatchGoalId(goalId);
      setStopwatchSeconds(0);
    }
    setIsStopwatchRunning(true);
  };

  const handlePauseStopwatch = () => {
    setIsStopwatchRunning(false);
  };

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    if (stopwatchSeconds > 60) {
      onLogStudyMinutes(Math.round(stopwatchSeconds / 60));
    }
    setStopwatchSeconds(0);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const completedCount = plan.goals.filter((g) => g.completed).length;
  const isAllCompleted = completedCount === 3;

  const formattedDate = new Date(currentDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getSubjectColor = (subj: SubjectType) => {
    switch (subj) {
      case 'Physics':
        return {
          border: 'border-sky-500/40',
          bg: 'bg-sky-950/20',
          accent: 'text-sky-400',
          badge: 'bg-sky-950 border border-sky-800 text-sky-300',
        };
      case 'Chemistry':
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/20',
          accent: 'text-emerald-400',
          badge: 'bg-emerald-950 border border-emerald-800 text-emerald-300',
        };
      case 'Math':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/20',
          accent: 'text-amber-400',
          badge: 'bg-amber-950 border border-amber-800 text-amber-300',
        };
    }
  };

  const selectedGoal = plan.goals.find((g) => g.id === selectedFocusGoalId) || plan.goals[0];
  const progressFraction = (focusPresetMinutes * 60 - focusRemainingSeconds) / (focusPresetMinutes * 60);

  return (
    <div className="space-y-6">
      {/* Daily Header Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-slate-300">Daily PCM Triad</span>
              <span aria-hidden="true">·</span>
              <span>Automatically Generated Schedule</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {completedCount} / 3 Completed ({Math.round((completedCount / 3) * 100)}%)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {formattedDate}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRegeneratePlan}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Recalculate priorities based on uncompleted milestones & upcoming test"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Regenerate Today's PCM
            </button>
          </div>
        </div>

        {/* Daily Progress Gauge */}
        <div className="space-y-1 pt-1">
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completedCount === 3
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : completedCount > 0
                  ? 'bg-amber-400'
                  : 'bg-slate-700'
              }`}
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Shortcut Chips for Mobile Navigation */}
        {onNavigateTab && (
          <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => onNavigateTab('pre-test-mode')}
              className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 flex items-center gap-1.5 font-medium shrink-0 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Day Pre-Test Blitz
            </button>
            <button
              onClick={() => onNavigateTab('chapter-matrix')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 font-medium shrink-0 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              6-Milestone Matrix
            </button>
            <button
              onClick={() => onNavigateTab('test-scores')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 font-medium shrink-0 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Weakness Heatmap
            </button>
            <button
              onClick={() => onNavigateTab('study-guard')}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 font-medium shrink-0 transition-colors"
            >
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              Regain Detox Guard
            </button>
          </div>
        )}
      </div>

      {/* 1-PAGE SUMMARY PUNISHMENT/DISCIPLINE LOCKDOWN SIREN ALERT (Compact 30% Dimensions) */}
      {overdueViolations.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border border-rose-500/80 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg shadow-rose-950/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-600/30 border border-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold bg-rose-950/90 border border-rose-800/80 px-1.5 py-0.5 rounded">
                  Lockdown Active
                </span>
                <span className="text-xs font-semibold text-rose-100 truncate">
                  1-Page Summary Overdue: <span className="underline decoration-rose-400">{overdueViolations[0].chapter.name}</span>
                </span>
              </div>
              <p className="text-[10px] text-rose-300/80 truncate">
                Entertainment apps blocked. Write 1-page summary to release app lockdown.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenChapterModal) {
                onOpenChapterModal(overdueViolations[0].chapter);
              }
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-rose-300 hover:bg-rose-200 rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Write Summary</span>
          </button>
        </div>
      )}

      {/* DAILY HOURS TRACKER & 100-QUESTION PRACTICE QUOTA SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Study Hours Tracker Card (Editable Target & Total Time Completion Mandate) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily Study Hours Tracker
              </h3>
            </div>
            
            {/* Interactive Target Hours Controller */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded">
                Target: {targetDailyHours.toFixed(1)}h / day
              </span>
              <button
                onClick={() => setIsEditingTarget(!isEditingTarget)}
                title="Change Daily Target Study Hours"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 border border-slate-700 transition"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Target Hours Customizer Drawer */}
          {isEditingTarget && (
            <div className="p-3 bg-slate-950 border border-sky-500/40 rounded-xl space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Change Daily Target Hours:</span>
                <span className="text-[10px] text-sky-400 font-mono">Min 2h • Max 16h</span>
              </div>
              
              {/* Stepper & Presets */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = Math.max(2, targetDailyHours - 0.5);
                    if (onUpdateTargetDailyHours) onUpdateTargetDailyHours(next);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono font-bold"
                >
                  -0.5h
                </button>
                <div className="flex-1 text-center font-mono font-bold text-sky-300 text-sm bg-slate-900 py-1 rounded border border-slate-800">
                  {targetDailyHours.toFixed(1)} Hours
                </div>
                <button
                  onClick={() => {
                    const next = Math.min(16, targetDailyHours + 0.5);
                    if (onUpdateTargetDailyHours) onUpdateTargetDailyHours(next);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-mono font-bold"
                >
                  +0.5h
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[6, 8, 10, 12].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      if (onUpdateTargetDailyHours) onUpdateTargetDailyHours(preset);
                      setIsEditingTarget(false);
                    }}
                    className={`flex-1 py-1 rounded font-mono text-[11px] transition ${
                      targetDailyHours === preset
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {preset}.0h
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                💡 Note: Aap target change kar sakte hain, par set kiya hua total time complete karna hoga!
              </p>
            </div>
          )}

          {/* Current Logged vs Target Progress */}
          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {dailyHoursToday.toFixed(1)}h
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ {targetDailyHours.toFixed(1)}h Total Target</span>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              {Math.min(100, Math.round((dailyHoursToday / targetDailyHours) * 100))}% of Goal
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                dailyHoursToday >= targetDailyHours ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
              style={{ width: `${Math.min(100, (dailyHoursToday / targetDailyHours) * 100)}%` }}
            />
          </div>

          {/* Mandatory Total Time Completion Status Banner */}
          {dailyHoursToday < targetDailyHours ? (
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong>{(targetDailyHours - dailyHoursToday).toFixed(1)}h Remaining:</strong> Total time complete karna mandatory hai!
                </span>
              </div>
              <span className="text-[10px] bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 rounded font-bold shrink-0">
                Incomplete
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  <strong>Daily Quota Fulfilled:</strong> Total study time ({dailyHoursToday.toFixed(1)}h / {targetDailyHours.toFixed(1)}h) 100% complete!
                </span>
              </div>
              <span className="text-[10px] bg-emerald-950 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">
                ✅ Complete
              </span>
            </div>
          )}

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono">Log Study Time:</span>
            {[
              { label: '+15m', hrs: 0.25 },
              { label: '+30m', hrs: 0.5 },
              { label: '+1h', hrs: 1.0 },
              { label: '+2h', hrs: 2.0 },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  if (onUpdateDailyHours) {
                    onUpdateDailyHours(Number((dailyHoursToday + btn.hrs).toFixed(2)));
                  }
                  onLogStudyMinutes(Math.round(btn.hrs * 60));
                }}
                className="px-2 py-1 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500 text-sky-300 rounded font-mono font-semibold transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily 100+ Question Practice Quota Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Daily 100+ Question Quota
              </h3>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                dailyQuestions.total >= 100
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
              }`}
            >
              {dailyQuestions.total >= 100 ? 'Quota Met 🎉' : `${100 - dailyQuestions.total} left`}
            </span>
          </div>

          <div className="flex items-baseline justify-between font-mono">
            <div>
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {dailyQuestions.total}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">/ 100 Questions Today</span>
            </div>
            <span className="text-xs text-slate-400">
              {Math.min(100, Math.round((dailyQuestions.total / 100) * 100))}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                dailyQuestions.total >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, (dailyQuestions.total / 100) * 100)}%` }}
            />
          </div>

          {/* Subject Question Counters with Specific Quotas (Maths: 25, Chemistry: 40, Physics: 35) */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
            {/* Physics Quota: 35 questions */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sky-400 font-bold">Physics</span>
                <span className="text-[10px] text-slate-400">{dailyQuestions.physics}/35</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dailyQuestions.physics / 35) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Target: 35 Qs</span>
                <button
                  onClick={() => onAddQuestions && onAddQuestions('Physics', 5)}
                  className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold rounded"
                  title="Add 5 Physics questions"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Chemistry Quota: 40 questions (User requirement) */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-400 font-bold">Chemistry</span>
                <span className="text-[10px] text-slate-400">{dailyQuestions.chemistry}/40</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dailyQuestions.chemistry / 40) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Target: 40 Qs</span>
                <button
                  onClick={() => onAddQuestions && onAddQuestions('Chemistry', 5)}
                  className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold rounded"
                  title="Add 5 Chemistry questions"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Math Quota: 25 questions (User requirement) */}
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-amber-400 font-bold">Math</span>
                <span className="text-[10px] text-slate-400">{dailyQuestions.math}/25</span>
              </div>
              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mb-1.5">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (dailyQuestions.math / 25) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Target: 25 Qs</span>
                <button
                  onClick={() => onAddQuestions && onAddQuestions('Math', 5)}
                  className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded"
                  title="Add 5 Math questions"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Subject-Specific Energy Levels & Peak Alert Hours Optimizer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Study Hours & Subject Energy Optimizer
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold">
                  Adaptive AI Pacing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mark your most alert study hours to schedule the hardest JEE chapters (Eklavya, low confidence, tough weightage) during peak focus.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEnergyOptimizer(!showEnergyOptimizer)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Optimizer controls"
          >
            {showEnergyOptimizer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showEnergyOptimizer && (
          <div className="space-y-4 pt-1 text-xs">
            {/* Hardest Chapter Prioritization Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="font-semibold text-white block">
                  Prioritize Hardest Chapter During Peak Alert Hours
                </span>
                <span className="text-slate-400 text-[11px]">
                  Automatically identifies your toughest daily milestone and assigns it to your peak alertness slot.
                </span>
              </div>

              <button
                onClick={() => {
                  if (onUpdateEnergyProfile) {
                    onUpdateEnergyProfile({
                      ...energyProfile,
                      prioritizeHardestInPeakHours: !energyProfile.prioritizeHardestInPeakHours,
                    });
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  energyProfile.prioritizeHardestInPeakHours
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${energyProfile.prioritizeHardestInPeakHours ? 'fill-slate-950' : ''}`} />
                <span>{energyProfile.prioritizeHardestInPeakHours ? 'Prioritization ON' : 'Prioritization OFF'}</span>
              </button>
            </div>

            {/* Most Alert Study Hours Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">
                Your Most Alert Study Hours (Peak Mental Bandwidth):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'morning' as AlertSlotKey,
                    label: 'Morning Alert',
                    time: '06:00 AM - 10:30 AM',
                    icon: Sunrise,
                  },
                  {
                    key: 'afternoon' as AlertSlotKey,
                    label: 'Afternoon Alert',
                    time: '01:00 PM - 04:30 PM',
                    icon: Sun,
                  },
                  {
                    key: 'evening' as AlertSlotKey,
                    label: 'Night Owl Alert',
                    time: '06:30 PM - 10:00 PM',
                    icon: Moon,
                  },
                ].map((slot) => {
                  const Icon = slot.icon;
                  const isSelected = energyProfile.peakAlertSlot === slot.key;

                  return (
                    <button
                      key={slot.key}
                      onClick={() => {
                        if (onUpdateEnergyProfile) {
                          onUpdateEnergyProfile({
                            ...energyProfile,
                            peakAlertSlot: slot.key,
                          });
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <div className="min-w-0">
                        <span className="font-bold block text-xs">{slot.label}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{slot.time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject-Specific Energy Levels */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-300 block">
                Subject-Specific Energy Levels:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Physics', 'Chemistry', 'Math'] as SubjectType[]).map((subj) => {
                  const currentLevel = energyProfile.subjectEnergy[subj] || 'Medium';

                  return (
                    <div
                      key={subj}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-200">{subj}</span>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        {(['High', 'Medium', 'Low'] as EnergyLevel[]).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => {
                              if (onUpdateEnergyProfile) {
                                onUpdateEnergyProfile({
                                  ...energyProfile,
                                  subjectEnergy: {
                                    ...energyProfile.subjectEnergy,
                                    [subj]: lvl,
                                  },
                                });
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                              currentLevel === lvl
                                ? lvl === 'High'
                                  ? 'bg-amber-400 text-slate-950'
                                  : lvl === 'Medium'
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-slate-700 text-slate-200'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 25-Minute Focus Pomodoro Timer Section */}
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left Side: Target Goal Picker & Info */}
          <div className="space-y-3 flex-1 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                25-Min Focus Pomodoro Timer
              </span>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1 rounded-md text-xs transition-colors ${
                  soundEnabled ? 'text-amber-400 hover:bg-amber-950/40' : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={soundEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              Deep Work Focus Session
            </h3>

            {/* Chapter Goal Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Select PCM Target for this Session:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plan.goals.map((g) => {
                  const isSelected = selectedFocusGoalId === g.id;
                  const isDone = chapterProgress[g.chapterId]?.[g.milestoneKey];
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedFocusGoalId(g.id);
                        if (!isFocusRunning) handleResetFocusTimer(focusPresetMinutes);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-amber-500/80 shadow-md text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-amber-400">{g.subject}</span>
                        {isDone && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-xs font-bold text-slate-200 truncate">{g.chapterName}</p>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {g.milestoneTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets: 25m, 15m, 45m, 5m */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400">Duration:</span>
              {[
                { mins: 25, label: '25m Pomodoro' },
                { mins: 45, label: '45m Deep Work' },
                { mins: 15, label: '15m Sprint' },
                { mins: 5, label: '5m Break' },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  onClick={() => handleSelectPreset(preset.mins)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                    focusPresetMinutes === preset.mins
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Big Countdown Dial & Controls */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800 min-w-[240px]">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 * (1 - progressFraction)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl font-extrabold text-white tracking-wider tabular-nums">
                  {formatTimer(focusRemainingSeconds)}
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                  {isFocusRunning ? 'Focusing...' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              {isFocusRunning ? (
                <button
                  onClick={handlePauseFocusTimer}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              ) : (
                <button
                  onClick={handleStartFocusTimer}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> Start Focus
                </button>
              )}

              <button
                onClick={() => handleResetFocusTimer(focusPresetMinutes)}
                title="Reset timer"
                className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Focus Completion History Feed */}
        {localFocusLogs.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                Completed Focus Log Entries Today:
              </span>
              <span className="font-mono text-amber-400 tabular-nums">
                {localFocusLogs.reduce((acc, l) => acc + l.durationMinutes, 0)}m Total Focus Time
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
              {localFocusLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium truncate max-w-[140px]">
                    {log.chapterName}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">+{log.durationMinutes}m</span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Focus Session Completion Alert Dialog */}
      {sessionCompletedModal && (
        <div className="bg-emerald-950/70 border border-emerald-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-sm font-bold text-white block">
                Pomodoro Session Completed! (+{focusPresetMinutes} min logged)
              </strong>
              <span className="text-emerald-200">
                Well done! Did you finish the targeted milestone for <strong className="text-white">{sessionCompletedModal.chapterName}</strong>?
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onToggleGoalMilestone(sessionCompletedModal.chapterId, sessionCompletedModal.milestoneKey, true);
                setSessionCompletedModal(null);
              }}
              className="px-3 py-1.5 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm"
            >
              Mark Milestone as Done
            </button>
            <button
              onClick={() => setSessionCompletedModal(null)}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Pre-Test Alert notice if scheduled */}
      {plan.goals.some((g) => g.isPreTestRevision) && (
        <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded-xl p-4 text-xs">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="font-semibold block text-amber-300 text-sm">
              1 Day Before Test Mode Active: Rapid Revision
            </strong>
            <p className="text-slate-300 mt-0.5">
              Today's goals are automatically tuned to solving past Part Test papers, reviewing 1-Page Summary conclusions, and verifying key formulas before tomorrow's exam!
            </p>
          </div>
        </div>
      )}

      {/* All Complete Celebration Banner */}
      {isAllCompleted && (
        <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-emerald-300 font-semibold block text-sm">
                All 3 PCM Goals Completed for Today!
              </strong>
              <span>Super-50 consistency streak updated. Rest well or do an optional quick formula revision.</span>
            </div>
          </div>
          <span className="text-xs font-mono bg-emerald-900/60 px-2.5 py-1 rounded text-emerald-300 font-semibold">
            100% DONE
          </span>
        </div>
      )}

      {/* The 3 PCM Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plan.goals.map((goal) => {
          const colors = getSubjectColor(goal.subject);
          const isStopwatchForThis = activeStopwatchGoalId === goal.id;
          const currentProg = chapterProgress[goal.chapterId];
          const isDone = !!currentProg?.[goal.milestoneKey];

          return (
            <div
              key={goal.id}
              className={`rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-90'
                  : `${colors.bg} ${colors.border} shadow-sm`
              } p-5`}
            >
              <div>
                {/* Top card bar: Subject & Branch & Target Minutes */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${colors.badge}`}>
                      {goal.subject}
                    </span>
                    {goal.chemBranch && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        · {goal.chemBranch}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {goal.targetMinutes} min
                  </span>
                </div>

                {/* Energy & Alert Hours Time Slot Tag */}
                {goal.recommendedTimeSlot && (
                  <div
                    className={`text-[10px] font-mono px-2.5 py-1 rounded-lg mb-2.5 flex items-center justify-between gap-1.5 ${
                      goal.isHardestChapter
                        ? 'bg-amber-950/80 border border-amber-600/70 text-amber-300 font-bold shadow-sm ring-1 ring-amber-500/20'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {goal.isHardestChapter && (
                        <Zap className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                      )}
                      <span className="truncate">{goal.recommendedTimeSlot}</span>
                    </div>
                    {goal.difficultyRating && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                          goal.difficultyRating === 'High'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : goal.difficultyRating === 'Medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {goal.difficultyRating} Diff
                      </span>
                    )}
                  </div>
                )}

                {/* Chapter Name */}
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {goal.chapterName}
                </h3>

                {/* Milestone Task Badge & Description */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Target Milestone:</span>
                    <span className="font-semibold text-slate-200">
                      {MILESTONES.find((m) => m.key === goal.milestoneKey)?.label || goal.milestoneKey}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {MILESTONES.find((m) => m.key === goal.milestoneKey)?.description}
                  </p>
                  <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Daily Question Quota:</span>
                    <span className="text-amber-400 font-bold">
                      {goal.targetQuestions || (goal.subject === 'Math' ? 25 : goal.subject === 'Chemistry' ? 40 : 35)} Questions Target
                    </span>
                  </div>
                </div>

                {/* AI Practice Quiz Button (10 Random Questions) */}
                <button
                  onClick={() => setSelectedQuizGoal(goal)}
                  className="w-full mb-3 py-2 px-3 bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 hover:from-amber-500/25 hover:to-amber-400/35 border border-amber-500/40 hover:border-amber-400/60 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all group"
                  title="Generate or pull 10 high-yield retention questions for this milestone"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>AI Practice Quiz (10 Questions)</span>
                </button>

                {/* Quick actions: 25-min focus launch + 1-Page Summary view */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => {
                      setSelectedFocusGoalId(goal.id);
                      handleResetFocusTimer(25);
                      setIsFocusRunning(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="py-1.5 px-2 bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Timer className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">25m Focus</span>
                  </button>

                  <button
                    onClick={() => {
                      const chapter = ALL_CHAPTERS.find((c) => c.id === goal.chapterId);
                      if (chapter && onOpenChapterModal) {
                        onOpenChapterModal(chapter);
                      }
                    }}
                    className="py-1.5 px-2 bg-slate-950 border border-slate-800 hover:border-sky-500/60 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="View Theory, 1-Page Summary, and Derivations"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">1-Page Notes</span>
                  </button>
                </div>

                {/* Study Stopwatch Timer */}
                <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2.5 mb-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums">
                      {isStopwatchForThis ? formatTimer(stopwatchSeconds) : '00:00'}
                    </span>
                    {isStopwatchForThis && isStopwatchRunning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isStopwatchForThis && isStopwatchRunning ? (
                      <button
                        onClick={handlePauseStopwatch}
                        className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium flex items-center gap-1 transition-colors"
                      >
                        <Pause className="w-3 h-3 text-amber-400" /> Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartStopwatch(goal.id)}
                        className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 text-emerald-400" /> Stopwatch
                      </button>
                    )}
                    {isStopwatchForThis && stopwatchSeconds > 0 && (
                      <button
                        onClick={handleResetStopwatch}
                        title="Reset & log study time"
                        className="p-1 text-slate-500 hover:text-slate-300 rounded"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Checkbox & Chapter Swap */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  onClick={() => onToggleGoalMilestone(goal.chapterId, goal.milestoneKey, !isDone)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDone
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60'
                      : 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-500 bg-slate-950'
                    }`}
                  >
                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{isDone ? 'Completed Milestone' : 'Mark as Done'}</span>
                </button>

                {/* Swap Chapter or Change Milestone selector toggle */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <button
                    onClick={() => setSwappingGoalId(swappingGoalId === goal.id ? null : goal.id)}
                    className="hover:text-slate-200 underline decoration-slate-600 transition-colors flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Customize Chapter / Milestone
                  </button>
                </div>

                {/* Inline customization drawer */}
                {swappingGoalId === goal.id && (
                  <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Select Chapter ({goal.subject}):
                      </label>
                      <select
                        value={goal.chapterId}
                        onChange={(e) => onSwapChapter(goal.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        {ALL_CHAPTERS.filter((c) => c.subject === goal.subject).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.chemBranch ? `(${c.chemBranch})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Select Milestone:
                      </label>
                      <select
                        value={goal.milestoneKey}
                        onChange={(e) => onChangeMilestone(goal.id, e.target.value as MilestoneKey)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                      >
                        {MILESTONES.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.label} ({m.estimatedMinutes}m)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Super-50 PCM Daily Method Guide Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 sm:p-5 text-xs text-slate-400 space-y-2">
        <h4 className="font-semibold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          BSEB Super-50 Daily Preparation Rule
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <strong className="text-sky-300 block mb-0.5">1. Daily PCM Triad</strong>
            <span>Never skip any of the three subjects. Cover 1 Physics, 1 Chemistry, and 1 Math milestone every day.</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <strong className="text-emerald-300 block mb-0.5">2. 6-Stage Chapter Funnel</strong>
            <span>Theory &rarr; 1-Page Summary &rarr; MathonGo Concept Builder &rarr; Module Ex-2 &rarr; Eklavya &rarr; Previous Part Test.</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <strong className="text-amber-300 block mb-0.5">3. 1 Day Before Exam Blitz</strong>
            <span>48h before any Part Test, automatically switch to past part test solving and 1-page summary revision.</span>
          </div>
        </div>
      </div>

      {/* AI Quiz Generator Modal */}
      {selectedQuizGoal && (
        <AIQuizModal
          goal={selectedQuizGoal}
          onClose={() => setSelectedQuizGoal(null)}
          onAddQuestions={onAddQuestions}
          onMarkMilestoneCompleted={(chId, mKey) => onToggleGoalMilestone(chId, mKey, true)}
        />
      )}
    </div>
  );
};
