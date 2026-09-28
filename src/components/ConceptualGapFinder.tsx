import React, { useState, useMemo } from 'react';
import { Chapter, MockTestResult, UserStudyState, SubjectType, MilestoneKey, MILESTONES } from '../types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Search,
  Sparkles,
  Target,
  Zap,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Check,
} from 'lucide-react';

interface GapItem {
  chapter: Chapter;
  timesFlaggedInMocks: number;
  latestMockScoreAccuracy?: number;
  missingMilestones: {
    key: MilestoneKey;
    label: string;
    gapType: string;
    prescription: string;
    estimatedMinutes: number;
  }[];
  severity: 'Critical' | 'High' | 'Moderate';
  recommendedAction: string;
  recommendedMilestoneKey: MilestoneKey;
}

interface ConceptualGapFinderProps {
  mockResults: MockTestResult[];
  chapterProgress: UserStudyState['chapterProgress'];
  onSelectChapter?: (chapter: Chapter) => void;
  onToggleMilestone?: (chapterId: string, milestoneKey: MilestoneKey) => void;
  onLaunchQuizForGap?: (chapter: Chapter, milestoneKey: MilestoneKey) => void;
}

export const ConceptualGapFinder: React.FC<ConceptualGapFinderProps> = ({
  mockResults,
  chapterProgress,
  onSelectChapter,
  onToggleMilestone,
  onLaunchQuizForGap,
}) => {
  const [subjectFilter, setSubjectFilter] = useState<'All' | SubjectType>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'High' | 'Moderate'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cross-reference weak chapters from mock tests with chapter milestone completion
  const gapAnalysisList = useMemo<GapItem[]>(() => {
    // 1. Count occurrences of weak chapters in mock test history
    const weakChapterCountMap: Record<string, { count: number; lowestAccuracy?: number }> = {};

    mockResults.forEach((test) => {
      (test.weakChapters || []).forEach((chId) => {
        if (!weakChapterCountMap[chId]) {
          weakChapterCountMap[chId] = { count: 0, lowestAccuracy: test.accuracyPercent };
        }
        weakChapterCountMap[chId].count += 1;
        if (test.accuracyPercent && (!weakChapterCountMap[chId].lowestAccuracy || test.accuracyPercent < weakChapterCountMap[chId].lowestAccuracy!)) {
          weakChapterCountMap[chId].lowestAccuracy = test.accuracyPercent;
        }
      });
    });

    // Also include chapters with confidence rating <= 2 even if not formally logged as weak
    ALL_CHAPTERS.forEach((ch) => {
      const prog = chapterProgress[ch.id];
      if (prog && prog.confidenceRating && prog.confidenceRating <= 2 && !weakChapterCountMap[ch.id]) {
        weakChapterCountMap[ch.id] = { count: 1, lowestAccuracy: 60 };
      }
    });

    // 2. Map through each weak chapter and evaluate missing milestones
    const list: GapItem[] = [];

    Object.entries(weakChapterCountMap).forEach(([chId, stats]) => {
      const chapter = ALL_CHAPTERS.find((c) => c.id === chId);
      if (!chapter) return;

      const prog = chapterProgress[chId] || {
        theory: false,
        conclusion1Page: false,
        mathongo: false,
        moduleEx2: false,
        eklavya: false,
        prevPartTest: false,
      };

      const missing: GapItem['missingMilestones'] = [];

      if (!prog.theory) {
        missing.push({
          key: 'theory',
          label: 'Theory & Lecture Notes',
          gapType: 'Core Derivation & Conceptual Void',
          prescription: 'Re-attend lecture modules & complete comprehensive theory notes',
          estimatedMinutes: 90,
        });
      }

      if (!prog.conclusion1Page) {
        missing.push({
          key: 'conclusion1Page',
          label: '1-Page Summary & Traps',
          gapType: 'Formula Retention & Trap Slip',
          prescription: 'Write single-page formula cheatsheet and note high-frequency mistake traps',
          estimatedMinutes: 45,
        });
      }

      if (!prog.mathongo) {
        missing.push({
          key: 'mathongo',
          label: 'MathonGo Concept Builder',
          gapType: 'Speed & Problem Pattern Gap',
          prescription: 'Solve MathonGo Concept Builder #1-40 for instant speed and accuracy recovery',
          estimatedMinutes: 60,
        });
      }

      if (!prog.moduleEx2) {
        missing.push({
          key: 'moduleEx2',
          label: 'Module Exercise-2 Drill',
          gapType: 'Multi-Step Application Gap',
          prescription: 'Solve Module Exercise-2 advanced drill questions to handle JEE Main+ complexity',
          estimatedMinutes: 75,
        });
      }

      if (!prog.eklavya && (chapter.isAdvOnly || stats.count >= 2)) {
        missing.push({
          key: 'eklavya',
          label: 'EKLAVYA Batch Problems',
          gapType: 'JEE Advanced Depth Deficit',
          prescription: 'Tackle EKLAVYA multi-concept problem sets under timed test conditions',
          estimatedMinutes: 90,
        });
      }

      // If all are marked done but still weak in mocks, recommend Part Test Previous Paper drill
      if (missing.length === 0) {
        missing.push({
          key: 'prevPartTest',
          label: 'Previous Part Test Drill',
          gapType: 'Exam Temperament & Revision Gap',
          prescription: 'Re-solve past Part Test papers under timed 180-minute conditions',
          estimatedMinutes: 60,
        });
      }

      // Severity classification
      let severity: 'Critical' | 'High' | 'Moderate' = 'Moderate';
      if (!prog.theory || (!prog.conclusion1Page && stats.count >= 2)) {
        severity = 'Critical';
      } else if (!prog.mathongo || stats.count >= 2) {
        severity = 'High';
      }

      // Primary recommended milestone
      const primaryMissing = missing[0];

      list.push({
        chapter,
        timesFlaggedInMocks: stats.count,
        latestMockScoreAccuracy: stats.lowestAccuracy,
        missingMilestones: missing,
        severity,
        recommendedAction: primaryMissing.prescription,
        recommendedMilestoneKey: primaryMissing.key,
      });
    });

    // Sort by severity (Critical > High > Moderate) then by times flagged
    const severityOrder = { Critical: 3, High: 2, Moderate: 1 };
    return list.sort((a, b) => {
      const diff = severityOrder[b.severity] - severityOrder[a.severity];
      if (diff !== 0) return diff;
      return b.timesFlaggedInMocks - a.timesFlaggedInMocks;
    });
  }, [mockResults, chapterProgress]);

  // Filtered list
  const filteredGaps = useMemo(() => {
    return gapAnalysisList.filter((gap) => {
      if (subjectFilter !== 'All' && gap.chapter.subject !== subjectFilter) return false;
      if (severityFilter !== 'All' && gap.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = gap.chapter.name.toLowerCase().includes(query);
        const matchesTopic = gap.chapter.keyTopics?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesTopic) return false;
      }
      return true;
    });
  }, [gapAnalysisList, subjectFilter, severityFilter, searchQuery]);

  const criticalCount = gapAnalysisList.filter((g) => g.severity === 'Critical').length;
  const highCount = gapAnalysisList.filter((g) => g.severity === 'High').length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold tracking-wide uppercase">
            <Target className="w-4 h-4 text-amber-400" />
            <span>Mock Error Remediation Engine</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Conceptual Gap Finder & Milestone Cross-Referencer
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Cross-references missed questions from your mock test error log with your 6-milestone progress to prescribe targeted Theory reviews or MathonGo modules.
          </p>
        </div>

        {/* Severity Count Badges */}
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {criticalCount} Critical Gaps
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold">
            {highCount} High Priority
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Subject Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['All', 'Physics', 'Chemistry', 'Math'] as const).map((subj) => (
            <button
              key={subj}
              onClick={() => setSubjectFilter(subj)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subjectFilter === subj
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {subj}
            </button>
          ))}

          <span className="text-slate-600 px-1">|</span>

          {/* Severity Filters */}
          {(['All', 'Critical', 'High', 'Moderate'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-slate-800 text-white border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search weak chapter or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Gaps List Grid */}
      {filteredGaps.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">No Unaddressed Conceptual Gaps Found!</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {mockResults.length === 0
              ? 'Log your mock test scores and mark weak chapters above to generate real-time gap prescriptions.'
              : 'All flagged weak chapters currently have their core milestones up to date. Excellent preparation consistency!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {filteredGaps.map((gap) => {
            const currentProg = chapterProgress[gap.chapter.id];

            return (
              <div
                key={gap.chapter.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  gap.severity === 'Critical'
                    ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/50 shadow-md shadow-rose-950/20'
                    : gap.severity === 'High'
                    ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/90'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  {/* Left: Chapter & Severity Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          gap.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : gap.severity === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-sky-950 text-sky-300 border border-sky-800'
                        }`}
                      >
                        {gap.severity} Gap
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400 font-mono">
                        {gap.chapter.subject} {gap.chapter.chemBranch ? `(${gap.chapter.chemBranch})` : ''}
                      </span>

                      <span className="text-[11px] text-rose-400 font-mono bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/60">
                        Flagged in {gap.timesFlaggedInMocks} Mock Test{gap.timesFlaggedInMocks > 1 ? 's' : ''}
                      </span>

                      {gap.latestMockScoreAccuracy !== undefined && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Accuracy: {gap.latestMockScoreAccuracy}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      {gap.chapter.name}
                      {gap.chapter.isAdvOnly && (
                        <span className="text-[9px] font-mono bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-bold">
                          JEE ADV ONLY
                        </span>
                      )}
                    </h4>

                    {/* Prescribed Specific Action */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Prescribed Immediate Remediation:
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Target: {gap.recommendedMilestoneKey}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {gap.recommendedAction}
                      </p>
                    </div>

                    {/* 6 Milestones Completion Checklist for this chapter */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                      {MILESTONES.map((m) => {
                        const isDone = !!currentProg?.[m.key];
                        return (
                          <div
                            key={m.key}
                            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border shrink-0 ${
                              isDone
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                                : 'bg-slate-950 text-slate-500 border-slate-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isDone ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            <span>{m.shortLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Actions: Instant Action Launchers */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                    {/* Launch Practice Quiz for Gap */}
                    {onLaunchQuizForGap && (
                      <button
                        onClick={() => onLaunchQuizForGap(gap.chapter, gap.recommendedMilestoneKey)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
                        title="Pull 10 retention questions tailored to fix this exact gap"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        <span>Remediation Quiz</span>
                      </button>
                    )}

                    {/* Open 1-Page Summary / Notes */}
                    {onSelectChapter && (
                      <button
                        onClick={() => onSelectChapter(gap.chapter)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Notes & Formulas</span>
                      </button>
                    )}

                    {/* Mark Prescribed Milestone Done */}
                    {onToggleMilestone && (
                      <button
                        onClick={() => onToggleMilestone(gap.chapter.id, gap.recommendedMilestoneKey)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark {gap.recommendedMilestoneKey} Reviewed</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
