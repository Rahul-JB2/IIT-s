import React from 'react';
import {
  Home,
  CalendarCheck,
  Award,
  Sparkles,
  User,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPreTestActive: boolean;
  userEmail?: string | null;
  userPhoto?: string | null;
  isCloudSynced: boolean;
  onOpenAssistant?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isPreTestActive,
  onOpenAssistant,
}) => {
  // Mobile Android 5 Main Tabs (Home, Tests, Gemini, Scores, Profile)
  const tabs = [
    {
      id: 'daily-goals',
      label: 'Home',
      icon: Home,
      badge: null,
    },
    {
      id: 'test-planner',
      label: 'Tests',
      icon: CalendarCheck,
      badge: isPreTestActive ? '1D' : null,
    },
    {
      id: 'gemini-hub',
      label: 'Gemini',
      icon: Sparkles,
      badge: 'AI',
      isAssistant: true,
    },
    {
      id: 'test-scores',
      label: 'Scores',
      icon: Award,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl safe-area-bottom"
    >
      <div className="max-w-md sm:max-w-xl mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isGemini = tab.isAssistant;
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 group ${
                  isGemini
                    ? 'text-amber-300 font-bold hover:text-amber-200'
                    : isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {/* Active indicator dot on top */}
                {isActive && !isGemini && (
                  <span className="absolute -top-1 w-8 h-1 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50" />
                )}

                <div className="relative">
                  {isGemini ? (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gradient-to-tr from-sky-500/30 via-indigo-500/30 to-amber-500/40 border-2 border-amber-400 shadow-md shadow-amber-400/30 scale-105'
                          : 'bg-gradient-to-tr from-sky-500/20 via-indigo-500/20 to-amber-500/30 border border-amber-400/60 shadow-sm'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse stroke-[2.4]" />
                    </div>
                  ) : (
                    <Icon
                      className={`w-5 h-5 transition-transform group-active:scale-90 ${
                        isActive ? 'text-amber-400 stroke-[2.4]' : 'text-slate-400'
                      }`}
                    />
                  )}

                  {/* Badge */}
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[8px] font-bold font-mono px-1 rounded-full text-white ${
                        isGemini
                          ? 'bg-gradient-to-r from-sky-500 to-amber-500 shadow-sm shadow-amber-500/50'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-1 tracking-tight truncate text-center font-medium ${
                    isGemini
                      ? 'bg-gradient-to-r from-sky-300 via-amber-300 to-amber-400 bg-clip-text text-transparent font-bold'
                      : isActive
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
