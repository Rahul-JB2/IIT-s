import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  UserProfileData,
  signInWithGoogle,
  signOutUser,
  saveUserProfile,
  getUserProfile,
} from '../services/firebase';
import { AchievementBadge, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import {
  User as UserIcon,
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Save,
  Download,
  Upload,
  ShieldCheck,
  Target,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  Flame,
  Trophy,
  Zap,
  Lock,
  Smartphone,
} from 'lucide-react';
import { calculateAchievements } from '../utils/achievementEngine';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';
import { AndroidAppBlocker } from './AndroidAppBlocker';
import { BlockedAppConfig } from '../types/jee';

interface ProfileViewProps {
  currentUser: User | null;
  studyState: UserStudyState;
  onUpdateStudyState: (newState: Partial<UserStudyState>) => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onNavigateTab?: (tabId: string) => void;
  onOpenRewardStore?: () => void;
  onToggleAndroidPermission?: (permId: string, granted: boolean) => void;
  onSimulateAppLaunch?: (app: BlockedAppConfig) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  studyState,
  onUpdateStudyState,
  onManualSync,
  isSyncing,
  lastSyncTime,
  onNavigateTab,
  onOpenRewardStore,
  onToggleAndroidPermission,
  onSimulateAppLaunch,
}) => {
  const [profileData, setProfileData] = useState<Partial<UserProfileData>>({
    displayName: currentUser?.displayName || 'JEE Super-50 Aspirant',
    email: currentUser?.email || '',
    super50Roll: 'BSEB-S50-2025-27/028',
    targetAir: 'AIR < 500 (JEE Adv 2027)',
    targetPercentile: '99.7+ %ile (JEE Main Jan)',
    dailyStreak: studyState.dailyStreak,
    totalStudyHours: studyState.studyHoursLoggedTotal,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showInstallModal, setShowInstallModal] = useState(false);

  const { isInstalled, isInstallable, install } = usePWAInstall();

  const achievements = useMemo<AchievementBadge[]>(() => calculateAchievements(studyState), [studyState]);
  const unlockedCount = achievements.filter((a: AchievementBadge) => a.isUnlocked).length;

  const filteredAchievements = useMemo<AchievementBadge[]>(() => {
    if (achievementFilter === 'unlocked') return achievements.filter((a: AchievementBadge) => a.isUnlocked);
    if (achievementFilter === 'locked') return achievements.filter((a: AchievementBadge) => !a.isUnlocked);
    return achievements;
  }, [achievements, achievementFilter]);

  // Load existing profile from Firebase if signed in
  useEffect(() => {
    if (currentUser) {
      getUserProfile(currentUser.uid).then((existing) => {
        if (existing) {
          setProfileData(existing);
        } else {
          setProfileData((prev) => ({
            ...prev,
            displayName: currentUser.displayName || prev.displayName,
            email: currentUser.email || prev.email,
            photoURL: currentUser.photoURL || undefined,
          }));
        }
      });
    }
  }, [currentUser]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Google sign-out error:', err);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (currentUser) {
        await saveUserProfile(currentUser.uid, {
          ...profileData,
          userId: currentUser.uid,
          email: currentUser.email || profileData.email || '',
          displayName: profileData.displayName || currentUser.displayName || 'Super-50 Aspirant',
          dailyStreak: studyState.dailyStreak,
          totalStudyHours: studyState.studyHoursLoggedTotal,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const backupJson = JSON.stringify(studyState, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bseb-super50-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.chapterProgress) {
          onUpdateStudyState(parsed);
          alert('Backup data restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Calculate high-level stats
  const totalChapters = ALL_CHAPTERS.length;
  let masteredCount = 0;
  let totalMathonGoCount = 0;
  let totalEx2Count = 0;
  let totalEklavyaCount = 0;

  Object.values(studyState.chapterProgress).forEach((prog) => {
    const done =
      (prog.theory ? 1 : 0) +
      (prog.conclusion1Page ? 1 : 0) +
      (prog.mathongo ? 1 : 0) +
      (prog.moduleEx2 ? 1 : 0) +
      (prog.eklavya ? 1 : 0) +
      (prog.prevPartTest ? 1 : 0);
    if (done === 6) masteredCount++;
    totalMathonGoCount += prog.mathongoSolved || 0;
    totalEx2Count += prog.moduleEx2Solved || 0;
    totalEklavyaCount += prog.eklavyaSolved || 0;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Student Profile & Firebase Cloud Sync</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Super-50 Aspirant Account
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persist your preparation data, 6-milestone progress, and mock analytics safely in Google Firebase.
          </p>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 shrink-0">
          <div className="text-right text-xs">
            <span className="flex items-center justify-end gap-1.5 font-semibold">
              <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className={currentUser ? 'text-emerald-300' : 'text-slate-400'}>
                {currentUser ? 'Firebase Connected' : 'Local Storage Mode'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {lastSyncTime ? `Last sync: ${lastSyncTime}` : 'Autosaved locally'}
            </span>
          </div>

          {currentUser && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              title="Sync now with Firebase"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Authentication Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6">
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-14 h-14 rounded-full border-2 border-amber-400/80 shadow-md object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xl">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {currentUser.displayName || 'BSEB Super-50 Student'}
                  </h3>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cloud Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  All 6-milestone chapter entries and test marks automatically backed up to Google Firebase Firestore.
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-rose-300 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Google Cloud Authentication
              </span>
              <h3 className="text-lg font-bold text-white">
                Connect Google Account for Multi-Device Sync
              </h3>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Signing in with Google enables automatic real-time cloud synchronization to your personal Google Firebase Firestore database. Access your preparation tracker seamlessly from your phone, tablet, and PC.
              </p>
              {authError && (
                <p className="text-xs text-rose-400 font-mono pt-1">
                  Error: {authError}
                </p>
              )}
            </div>

            <button
              onClick={handleSignIn}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <LogIn className="w-4 h-4 text-slate-950" />
              Sign In with Google
            </button>
          </div>
        )}
      </div>

      {/* Super-50 Target & Batch Credentials Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Super-50 Aspirant Profile & Targets
          </h3>
          <span className="text-xs text-slate-400">Customized for BSEB Super-50 Batch</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Full Student Name:</label>
            <input
              type="text"
              value={profileData.displayName || ''}
              onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Super-50 Roll / ID No:</label>
            <input
              type="text"
              value={profileData.super50Roll || ''}
              onChange={(e) => setProfileData({ ...profileData, super50Roll: e.target.value })}
              placeholder="e.g. BSEB-S50-2025-27/028"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Target JEE Advanced AIR Goal:</label>
            <input
              type="text"
              value={profileData.targetAir || ''}
              onChange={(e) => setProfileData({ ...profileData, targetAir: e.target.value })}
              placeholder="e.g. Top 500 AIR"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Target JEE Main Percentile:</label>
            <input
              type="text"
              value={profileData.targetPercentile || ''}
              onChange={(e) => setProfileData({ ...profileData, targetPercentile: e.target.value })}
              placeholder="e.g. 99.8%ile (220+ marks)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Daily Study Hour Target:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="4"
                max="16"
                defaultValue={8.5}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <span className="text-slate-400 font-mono">hrs/day</span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Daily Streak Counter:</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{studyState.dailyStreak} Days Ongoing</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
            </span>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving to Cloud...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Aggregate Preparation Funnel Counters */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Super-50 Overall Preparation Funnel Metrics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[11px]">Fully Mastered Chapters</span>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">
              {masteredCount} <span className="text-xs text-slate-500 font-normal">/ {totalChapters}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">All 6 milestones complete</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-emerald-400 block text-[11px]">MathonGo Concept Solved</span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {totalMathonGoCount}
            </div>
            <span className="text-[10px] text-slate-500 block">Questions solved</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-indigo-400 block text-[11px]">Module Exercise-2 Solved</span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {totalEx2Count}
            </div>
            <span className="text-[10px] text-slate-500 block">Advanced drill questions</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-purple-400 block text-[11px]">EKLAVYA Batch Problems</span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {totalEklavyaCount}
            </div>
            <span className="text-[10px] text-slate-500 block">Advanced multi-concept sets</span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Super-50 Honor Badges & Achievements */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Milestone & Study Hours Accolades</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              BSEB Super-50 Honor Badges & Achievements
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Badges automatically unlock as you maintain consistency streaks, meet daily hours, and clear chapter milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg font-bold">
              {unlockedCount} / {achievements.length} Unlocked
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['all', 'unlocked', 'locked'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAchievementFilter(filter)}
                  className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-colors ${
                    achievementFilter === filter
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredAchievements.map((badge: AchievementBadge) => {
            const isUnlocked = badge.isUnlocked;
            const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-amber-400/20 text-amber-400 border border-amber-500/40 shadow-sm'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {isUnlocked ? (
                        badge.icon === 'Flame' ? (
                          <Flame className="w-5 h-5 text-amber-400" />
                        ) : badge.icon === 'Zap' ? (
                          <Zap className="w-5 h-5 text-amber-400" />
                        ) : badge.icon === 'Clock' ? (
                          <Clock className="w-5 h-5 text-sky-400" />
                        ) : badge.icon === 'BookOpen' ? (
                          <BookOpen className="w-5 h-5 text-emerald-400" />
                        ) : badge.icon === 'Target' ? (
                          <Target className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Trophy className="w-5 h-5 text-amber-400" />
                        )
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isUnlocked
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isUnlocked ? 'Unlocked 🎉' : `${pct}%`}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-snug">
                    {badge.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1">
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-amber-400' : 'bg-slate-700'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Progress:</span>
                    <span className="font-semibold text-slate-300">
                      {badge.current} / {badge.target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Launch Shortcuts: Chapter Matrix, Pre-Test Blitz, Study Guard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Super-50 Core Modules & Tools</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Quick Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigateTab && onNavigateTab('chapter-matrix')}
            className="p-3 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>6-Milestone Matrix</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              PCM milestone checkboxes (Lectures, Notes, PYQs, Revision).
            </p>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('pre-test-mode')}
            className="p-3 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>Pre-Test 1-Day Blitz</span>
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Rapid formula recall & 24h syllabus drill before imminent test.
            </p>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('study-guard')}
            className="p-3 bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>Regain Study Guard</span>
              <Lock className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Study-only Shorts vault, 10s friction pause & distraction blocker.
            </p>
          </button>
        </div>
      </div>

      {/* JEE Mastery Points & Game Rewards Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/40 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  JEE Mastery Points & Game Rewards Store
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  {studyState.masteryPoints || 0} Pts
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Redeem points to unlock Pocket FM stories, YouTube breaks, or phone games!
              </p>
            </div>
          </div>

          {onOpenRewardStore && (
            <button
              onClick={onOpenRewardStore}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 rounded-lg shadow-md shadow-amber-500/10 flex items-center gap-1.5 self-start sm:self-auto transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Rewards Store</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[10px] block">Pocket FM Story</span>
            <span className="text-amber-400 font-bold font-mono">15m / 50 pts</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[10px] block">YouTube Break</span>
            <span className="text-rose-400 font-bold font-mono">15m / 60 pts</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[10px] block">Phone Gaming Pass</span>
            <span className="text-purple-400 font-bold font-mono">20m / 80 pts</span>
          </div>
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <span className="text-slate-400 text-[10px] block">AI Mock Deep-Dive</span>
            <span className="text-emerald-400 font-bold font-mono">Free with 40 pts</span>
          </div>
        </div>
      </div>

      {/* Android System Permissions & App Blocker (YouTube, Chrome, Pocket FM, Games) */}
      <AndroidAppBlocker
        permissions={studyState.androidPermissions}
        onTogglePermission={onToggleAndroidPermission}
        activePasses={studyState.activeRewardPasses || []}
        onOpenRewardStore={onOpenRewardStore}
        onSimulateAppLaunch={onSimulateAppLaunch}
      />

      {/* Android Native App & Installation Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Android App & Standalone Mode
              </h3>
              {isInstalled ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400">
                  INSTALLED (NO TABS)
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                  BROWSER MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isInstalled
                ? 'App is running in native standalone mode. Browser tabs and URL bar are permanently disabled.'
                : 'Install as an Android App to remove Chrome tabs, run full-screen, and launch directly from phone home screen.'}
            </p>
          </div>

          <button
            onClick={() => setShowInstallModal(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg shadow-md shadow-emerald-500/10 flex items-center gap-1.5 self-start sm:self-auto transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isInstalled ? 'App Settings & Info' : 'Install Android App'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Display Mode</span>
            <span className="text-white font-mono font-bold">
              {isInstalled ? 'Standalone (No Tabs)' : 'Browser Window'}
            </span>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[11px]">Offline Cache</span>
            <span className="text-emerald-400 font-mono font-bold">Enabled (Service Worker)</span>
          </div>
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
            <span className="text-slate-400 block text-[11px]">App Footprint</span>
            <span className="text-sky-400 font-mono font-bold">&lt; 3.2 MB (Zero Lag)</span>
          </div>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Offline Safety & Data Portability
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Even without internet access, your progress stays 100% saved in your browser storage. You can also export full JSON backups anytime for safekeeping.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Export JSON Backup
          </button>

          <label className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            Import JSON Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Android App Install Modal */}
      <AndroidInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
