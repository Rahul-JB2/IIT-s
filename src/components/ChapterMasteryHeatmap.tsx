import React, { useState, useMemo } from 'react';
import { Chapter, MockTestResult, UserStudyState, SubjectType, MilestoneKey, MILESTONES } from '../types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Flame,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  BookOpen,
  Info,
  X,
} from 'lucide-react';

interface ChapterMasteryHeatmapProps {
  mockResults: MockTestResult[];
  chapterProgress: UserStudyState['chapterProgress'];
  onSelectChapter?: (chapter: Chapter) => void;
  onAddChapterToGoals?: (chapter: Chapter) => void;
}

export interface ChapterHeatmapItem {
  chapter: Chapter;
  milestonesDone: number;
  totalMilestones: number;
  masteryPercentage: number;
  isFlaggedWeakInMocks: boolean;
  timesFlaggedWeak: number;
  isTestedInMocks: boolean;
  riskCategory: 'critical-weak' | 'needs-practice' | 'moderate' | 'exam-ready';
  testedInTests: number[];
}

export const ChapterMasteryHeatmap: React.FC<ChapterMasteryHeatmapProps> = ({
  mockResults,
  chapterProgress,
  onSelectChapter,
  onAddChapterToGoals,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'All' | SubjectType>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'practice' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedItem, setInspectedItem] = useState<ChapterHeatmapItem | null>(null);

  // Compile weak chapters flagged across all mock results
  const weakChapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockResults.forEach((mock) => {
      if (mock.weakChapters) {
        mock.weakChapters.forEach((chId) => {
          counts[chId] = (counts[chId] || 0) + 1;
        });
      }
    });
    return counts;
  }, [mockResults]);

  // Map each chapter to its mastery level and risk category
  const heatmapData = useMemo<ChapterHeatmapItem[]>(() => {
    return ALL_CHAPTERS.map((ch) => {
      const prog = chapterProgress[ch.id];
      const mTheory = prog?.theory ? 1 : 0;
      const mConc = prog?.conclusion1Page ? 1 : 0;
      const mMathongo = prog?.mathongo ? 1 : 0;
      const mModule = prog?.moduleEx2 ? 1 : 0;
      const mEklavya = prog?.eklavya ? 1 : 0;
      const mPrevTest = prog?.prevPartTest ? 1 : 0;

      const milestonesDone = mTheory + mConc + mMathongo + mModule + mEklavya + mPrevTest;
      const totalMilestones = 6;
      const masteryPercentage = Math.round((milestonesDone / totalMilestones) * 100);

      const timesWeak = weakChapterCounts[ch.id] || 0;
      const isFlaggedWeak = timesWeak > 0;

      // Determine tests testing this chapter
      const testedInTests = ALL_TESTS.filter((t) => {
        const text = `${t.physicsSyllabus} ${t.pChemSyllabus} ${t.iChemSyllabus || ''} ${t.oChemSyllabus || ''} ${t.mathSyllabus}`.toLowerCase();
        return text.includes(ch.name.toLowerCase().slice(0, 10));
      }).map((t) => t.testNumber);

      // Determine risk category
      let riskCategory: ChapterHeatmapItem['riskCategory'] = 'needs-practice';

      if (isFlaggedWeak || (testedInTests.includes(1) && milestonesDone <= 1)) {
        riskCategory = 'critical-weak';
      } else if (milestonesDone >= 5) {
        riskCategory = 'exam-ready';
      } else if (milestonesDone >= 3) {
        riskCategory = 'moderate';
      } else {
        riskCategory = 'needs-practice';
      }

      return {
        chapter: ch,
        milestonesDone,
        totalMilestones,
        masteryPercentage,
        isFlaggedWeakInMocks: isFlaggedWeak,
        timesFlaggedWeak: timesWeak,
        isTestedInMocks: mockResults.some((m) => m.weakChapters?.includes(ch.id)),
        riskCategory,
        testedInTests,
      };
    });
  }, [chapterProgress, weakChapterCounts, mockResults]);

  // Summary counts
  const criticalCount = heatmapData.filter((i) => i.riskCategory === 'critical-weak').length;
  const needsPracticeCount = heatmapData.filter((i) => i.riskCategory === 'needs-practice').length;
  const examReadyCount = heatmapData.filter((i) => i.riskCategory === 'exam-ready').length;
  const totalMasteredPct = Math.round(
    (heatmapData.reduce((acc, i) => acc + i.milestonesDone, 0) / (heatmapData.length * 6)) * 100
  );

  // Filtered chapters
  const filteredData = useMemo(() => {
    return heatmapData.filter((item) => {
      if (selectedSubject !== 'All' && item.chapter.subject !== selectedSubject) {
        return false;
      }
      if (statusFilter === 'critical' && item.riskCategory !== 'critical-weak') {
        return false;
      }
      if (statusFilter === 'practice' && item.riskCategory !== 'needs-practice' && item.riskCategory !== 'moderate') {
        return false;
      }
      if (statusFilter === 'ready' && item.riskCategory !== 'exam-ready') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.chapter.name.toLowerCase().includes(q);
        const matchesBranch = item.chapter.chemBranch?.toLowerCase().includes(q);
        return matchesName || matchesBranch;
      }
      return true;
    });
  }, [heatmapData, selectedSubject, statusFilter, searchQuery]);

  const getHeatmapColor = (item: ChapterHeatmapItem) => {
    if (item.riskCategory === 'critical-weak') {
      return {
        bg: 'bg-rose-950/60 hover:bg-rose-900/70',
        border: 'border-rose-600/80',
        text: 'text-rose-200',
        badge: 'bg-rose-900/80 text-rose-300 border-rose-700/60',
        glow: 'shadow-rose-900/30',
        dot: 'bg-rose-500',
      };
    }
    if (item.riskCategory === 'needs-practice') {
      return {
        bg: 'bg-amber-950/40 hover:bg-amber-900/50',
        border: 'border-amber-600/60',
        text: 'text-amber-200',
        badge: 'bg-amber-950 text-amber-300 border-amber-700/60',
        glow: 'shadow-amber-900/20',
        dot: 'bg-amber-500',
      };
    }
    if (item.riskCategory === 'moderate') {
      return {
        bg: 'bg-sky-950/40 hover:bg-sky-900/50',
        border: 'border-sky-600/60',
        text: 'text-sky-200',
        badge: 'bg-sky-950 text-sky-300 border-sky-700/60',
        glow: 'shadow-sky-900/20',
        dot: 'bg-sky-400',
      };
    }
    // exam-ready
    return {
      bg: 'bg-emerald-950/50 hover:bg-emerald-900/60',
      border: 'border-emerald-600/80',
      text: 'text-emerald-200',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
      glow: 'shadow-emerald-900/30',
      dot: 'bg-emerald-400',
    };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Syllabus Vulnerability & Mastery Radar</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            BSEB Super-50 Chapter Mastery Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Correlates your <strong>mock test mistakes</strong> and weak flags against your <strong>6-milestone completion levels</strong> to immediately expose exam-risk chapters.
          </p>
        </div>

        {/* Syllabus Health Score Gauge */}
        <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">Syllabus Health</span>
            <span className="text-base font-extrabold text-amber-400 font-mono tabular-nums">
              {totalMasteredPct}% Ready
            </span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 flex items-center justify-center font-mono text-xs font-bold text-slate-200">
            {totalMasteredPct}%
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <button
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'critical'
              ? 'bg-rose-950/80 border-rose-500 text-white shadow-lg shadow-rose-950/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High Risk / Weak
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="text-xl font-bold text-white tabular-nums block">
            {criticalCount} Chapters
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Tagged in mocks or unready
          </span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'practice' ? 'all' : 'practice')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'practice'
              ? 'bg-amber-950/80 border-amber-500 text-white shadow-lg shadow-amber-950/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold mb-1">
            <span>Needs Practice</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-xl font-bold text-white tabular-nums block">
            {needsPracticeCount} Chapters
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            1-3 milestones done
          </span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ready'
              ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Exam Ready
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xl font-bold text-white tabular-nums block">
            {examReadyCount} Chapters
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            5-6 milestones done
          </span>
        </button>

        <div className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold mb-1">
            <span>Total Syllabus</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-bold text-white tabular-nums block">
            {ALL_CHAPTERS.length} Chapters
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Physics, Chem & Math
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Subject Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['All', 'Physics', 'Chemistry', 'Math'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedSubject === sub
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search weak chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <span className="text-slate-500 font-sans font-semibold">Heatmap Intensity:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
          <span>High Risk (Weak in Test / &le;1 Milestone)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
          <span>Needs Work (2 Milestones)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
          <span>Solid Progress (3-4 Milestones)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span>Exam Ready (5-6 Milestones)</span>
        </div>
      </div>

      {/* The Visual Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
        {filteredData.map((item) => {
          const colors = getHeatmapColor(item);
          return (
            <div
              key={item.chapter.id}
              onClick={() => setInspectedItem(item)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${colors.bg} ${colors.border} hover:shadow-md hover:scale-[1.01]`}
            >
              <div>
                {/* Top Badge: Subject + Status */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    {item.chapter.subject} {item.chapter.chemBranch ? `· ${item.chapter.chemBranch}` : ''}
                  </span>

                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${colors.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    {item.milestonesDone}/6 Done
                  </span>
                </div>

                {/* Chapter Name */}
                <h4 className="text-xs font-bold text-white leading-tight mb-2 line-clamp-2">
                  {item.chapter.name}
                </h4>
              </div>

              {/* Progress Bar + Warning tag */}
              <div className="space-y-1.5 pt-1">
                {/* Mini progress bar */}
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.riskCategory === 'critical-weak'
                        ? 'bg-rose-500'
                        : item.riskCategory === 'needs-practice'
                        ? 'bg-amber-400'
                        : item.riskCategory === 'moderate'
                        ? 'bg-sky-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.max(10, item.masteryPercentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>
                    {item.isFlaggedWeakInMocks ? (
                      <span className="text-rose-400 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Flagged Weak
                      </span>
                    ) : item.riskCategory === 'exam-ready' ? (
                      <span className="text-emerald-400 font-bold">Exam Ready</span>
                    ) : (
                      <span>{item.masteryPercentage}% Prepped</span>
                    )}
                  </span>

                  <span className="text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5">
                    Inspect <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
          <p>No chapters match your selected filters.</p>
          <button
            onClick={() => {
              setSelectedSubject('All');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-amber-400 underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Chapter Heatmap Detail / Inspection Modal */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-semibold">
                  <span>{inspectedItem.chapter.subject}</span>
                  {inspectedItem.chapter.chemBranch && <span>· {inspectedItem.chapter.chemBranch}</span>}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  {inspectedItem.chapter.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Alert Banner */}
            {inspectedItem.isFlaggedWeakInMocks ? (
              <div className="bg-rose-950/70 border border-rose-800 text-rose-200 p-3 rounded-xl text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Mock Test Weakness Alert!</strong>
                  <span>Flagged {inspectedItem.timesFlaggedWeak} time(s) as causing negative marks or conceptual errors during test series.</span>
                </div>
              </div>
            ) : inspectedItem.riskCategory === 'exam-ready' ? (
              <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Strong Mastery Achieved</strong>
                  <span>5 or more milestones completed. Ready for high scoring in BSEB Super-50 mocks.</span>
                </div>
              </div>
            ) : null}

            {/* 6 Milestones Checklist Status */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                6-Milestone Chapter Pipeline Status:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {MILESTONES.map((m) => {
                  const isDone = !!chapterProgress[inspectedItem.chapter.id]?.[m.key];
                  return (
                    <div
                      key={m.key}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                        isDone
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              {onSelectChapter && (
                <button
                  onClick={() => {
                    onSelectChapter(inspectedItem.chapter);
                    setInspectedItem(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  View Notes & 1-Page Summary
                </button>
              )}
              <button
                onClick={() => setInspectedItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
              >
                Close Radar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
