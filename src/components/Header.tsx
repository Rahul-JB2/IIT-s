import React, { useState } from 'react';
import {
  Menu,
  X,
  Flame,
  Clock,
  RotateCcw,
  CalendarDays,
  Grid3X3,
  CalendarCheck,
  Award,
  Zap,
  Shield,
  Compass,
  User,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentDate: string;
  setCurrentDate: (date: string) => void;
  streak: number;
  totalStudyHours: number;
  onReset: () => void;
  userEmail?: string | null;
  isCloudSynced?: boolean;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentDate,
  setCurrentDate,
  streak,
  totalStudyHours,
  onReset,
  userEmail,
  isCloudSynced,
  onOpenAssistant,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    { id: 'daily-goals', label: "Today's PCM Goals (Home)", icon: CalendarDays },
    { id: 'chapter-matrix', label: 'Chapter Matrix (6 Milestones)', icon: Grid3X3 },
    { id: 'test-planner', label: 'Super-50 Test Series Planner', icon: CalendarCheck },
    { id: 'test-scores', label: 'Mock Test Scores & Heatmap', icon: Award },
    { id: 'pre-test-mode', label: 'Pre-Test 1-Day Rapid Blitz', icon: Zap },
    { id: 'study-guard', label: 'Regain Digital Detox & Guard', icon: Shield },
    { id: 'strategy', label: 'Trends & Week Comparison', icon: Compass },
    { id: 'profile', label: 'Student Profile & Cloud Sync', icon: User },
  ];

  const advanceDay = (days: number) => {
    const current = new Date(currentDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            
            {/* Left: 3 Horizontal Lines (Hamburger Menu) + App Title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 flex items-center justify-center text-slate-200 hover:text-amber-400 transition-colors shadow-sm focus:outline-none"
                title="Open menu"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 stroke-[2.2]" />
              </button>

              <button
                onClick={() => setActiveTab('daily-goals')}
                className="text-left font-bold text-sm sm:text-base tracking-tight text-white hover:text-amber-400 transition-colors flex items-center gap-1.5"
              >
                <span>JEE Super-50</span>
                <span className="hidden sm:inline text-xs font-mono text-amber-400/90 font-normal bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  2025-27
                </span>
              </button>
            </div>

            {/* Right: Streak + Study Hours + Date Controller */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Streak pill */}
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-slate-900 border border-slate-800 rounded-lg px-2 sm:px-3 py-1 font-mono font-semibold tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{streak}d</span>
              </div>

              {/* Study Hours */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{totalStudyHours.toFixed(1)}h</span>
              </div>

              {/* Date Controller */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 sm:p-1">
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs text-slate-200 font-mono focus:outline-none px-1.5 sm:px-2 py-0.5 cursor-pointer max-w-[110px] sm:max-w-none"
                  title="Simulated study date"
                />
                <button
                  onClick={() => advanceDay(1)}
                  title="Next Day (+1 day)"
                  className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded font-mono font-bold transition-colors"
                >
                  +1d
                </button>
              </div>

              {/* Android App PWA Install Button */}
              <PWAInstallButton variant="header" />

              {/* Gemini AI Assistant Button (Always visible small icon) */}
              {onOpenAssistant && (
                <button
                  onClick={onOpenAssistant}
                  title="Open Gemini AI Voice & Text Assistant"
                  className="px-2 sm:px-2.5 py-1 bg-gradient-to-r from-sky-500/20 via-indigo-500/25 to-amber-500/20 hover:from-sky-500/30 hover:to-amber-500/30 border border-amber-400/50 rounded-lg text-amber-300 flex items-center gap-1 sm:gap-1.5 text-xs font-bold transition-all shadow-sm group shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform shrink-0 animate-pulse" />
                  <span className="font-mono hidden xs:inline">Gemini</span>
                </button>
              )}

              {/* Profile / Sync button */}
              <button
                onClick={() => setActiveTab('profile')}
                title="Student Profile & Cloud Sync"
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                  activeTab === 'profile'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : isCloudSynced
                    ? 'bg-slate-900 border-emerald-800/80 text-emerald-400 hover:border-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
              </button>

              {/* Reset button */}
              <button
                onClick={onReset}
                title="Reset data template"
                className="hidden sm:flex p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer when clicking 3 Horizontal Lines */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-amber-500/20">
                  50
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    BSEB Super-50
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    JEE Main & Advanced 2025-27
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cloud User Profile Status */}
            <div className="p-3.5 mx-3 mt-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Sync</span>
                <span className="font-mono text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isCloudSynced ? 'Firebase Active' : 'Local Offline'}
                </span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] truncate mt-1">
                {userEmail || 'Guest Student'}
              </p>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <div className="mb-3">
                <PWAInstallButton variant="drawer" />
              </div>
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onReset();
                }}
                className="w-full py-2 px-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-left flex items-center gap-2 transition-colors text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Data to Initial Template
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
