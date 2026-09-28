import React, { useState } from 'react';
import { Chapter, DailyGoalItem, MilestoneKey, MockTestResult, TestSchedule, UserStudyState } from '../types/jee';
import { ALL_TESTS, ALL_CHAPTERS } from '../data/super50Data';
import { Trophy, Plus, Trash2, TrendingUp, AlertTriangle, CheckCircle2, Award, Flame, BarChart2, Sparkles, Compass } from 'lucide-react';
import { ChapterMasteryHeatmap } from './ChapterMasteryHeatmap';
import { ConceptualGapFinder } from './ConceptualGapFinder';
import { AIQuizModal } from './AIQuizModal';
import { StrategyCoach } from './StrategyCoach';

interface TestScoreTrackerProps {
  mockResults: MockTestResult[];
  chapterProgress: UserStudyState['chapterProgress'];
  onSaveResult: (result: MockTestResult) => void;
  onDeleteResult: (id: string) => void;
  preselectedTest?: TestSchedule | null;
  onSelectChapter?: (chapter: Chapter) => void;
  onToggleMilestone?: (chapterId: string, milestoneKey: MilestoneKey) => void;
  currentDate?: string;
  dailyPlans?: UserStudyState['dailyPlans'];
  focusLogs?: UserStudyState['focusLogs'];
  totalStudyHoursLogged?: number;
}

export const TestScoreTracker: React.FC<TestScoreTrackerProps> = ({
  mockResults,
  chapterProgress,
  onSaveResult,
  onDeleteResult,
  preselectedTest,
  onSelectChapter,
  onToggleMilestone,
  currentDate = '2026-09-27',
  dailyPlans = {},
  focusLogs = [],
  totalStudyHoursLogged = 18.5,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'scores' | 'trends'>('scores');
  const [isFormOpen, setIsFormOpen] = useState(!!preselectedTest);
  const [selectedTestId, setSelectedTestId] = useState(preselectedTest?.id || ALL_TESTS[0].id);
  const [remediationQuizGoal, setRemediationQuizGoal] = useState<{ chapter: Chapter; milestoneKey: MilestoneKey } | null>(null);
  const [date, setDate] = useState(preselectedTest?.date || new Date().toISOString().split('T')[0]);
  const [physicsScore, setPhysicsScore] = useState<number>(0);
  const [chemScore, setChemScore] = useState<number>(0);
  const [mathScore, setMathScore] = useState<number>(0);
  const [maxMarks, setMaxMarks] = useState<number>(300);
  const [batchRank, setBatchRank] = useState<number | ''>('');
  const [accuracy, setAccuracy] = useState<number>(85);
  const [sillyMistakes, setSillyMistakes] = useState<number>(3);
  const [selectedWeakChapters, setSelectedWeakChapters] = useState<string[]>([]);
  const [analysisNotes, setAnalysisNotes] = useState('');

  const totalScore = Number(physicsScore) + Number(chemScore) + Number(mathScore);
  const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const test = ALL_TESTS.find((t) => t.id === selectedTestId);
    if (!test) return;

    const newResult: MockTestResult = {
      id: 'result-' + Date.now(),
      testId: test.id,
      testName: test.name,
      date,
      physicsScore: Number(physicsScore),
      chemScore: Number(chemScore),
      mathScore: Number(mathScore),
      totalScore,
      maxMarks: Number(maxMarks),
      batchRank: batchRank ? Number(batchRank) : undefined,
      accuracyPercent: Number(accuracy),
      sillyMistakesCount: Number(sillyMistakes),
      weakChapters: selectedWeakChapters,
      analysisNotes,
    };

    onSaveResult(newResult);
    setIsFormOpen(false);
    // Reset form
    setPhysicsScore(0);
    setChemScore(0);
    setMathScore(0);
    setSelectedWeakChapters([]);
    setAnalysisNotes('');
  };

  const toggleWeakChapter = (id: string) => {
    if (selectedWeakChapters.includes(id)) {
      setSelectedWeakChapters(selectedWeakChapters.filter((c) => c !== id));
    } else {
      setSelectedWeakChapters([...selectedWeakChapters, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Switch: Scores & Heatmap vs Performance Trends & Strategy */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveSubTab('scores')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'scores'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Mock Scores & Mistake Log</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trends')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeSubTab === 'trends'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>7-Day Trends & Strategy Coach</span>
        </button>
      </div>

      {activeSubTab === 'trends' ? (
        <StrategyCoach
          currentDate={currentDate}
          chapterProgress={chapterProgress}
          mockResults={mockResults}
          dailyPlans={dailyPlans}
          focusLogs={focusLogs}
          totalStudyHoursLogged={totalStudyHoursLogged}
        />
      ) : (
        <>
          {/* Header and Add Button */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span className="font-semibold text-amber-400">Performance Log</span>
                <span aria-hidden="true">·</span>
                <span>BSEB Super-50 Test Series Scorecard</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Mock Test Results & Error Analysis
              </h2>
            </div>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              {isFormOpen ? 'Close Logger' : 'Log New Test Score'}
            </button>
          </div>

      {/* Logger Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 animate-in fade-in"
        >
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
            Record Mock Test Performance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Select Test:</label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {ALL_TESTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.date}) - {t.mode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Attempt Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Max Marks:</label>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Subject Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-sky-400 font-semibold block mb-1">Physics Score:</label>
              <input
                type="number"
                value={physicsScore}
                onChange={(e) => setPhysicsScore(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-emerald-400 font-semibold block mb-1">Chemistry Score:</label>
              <input
                type="number"
                value={chemScore}
                onChange={(e) => setChemScore(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-amber-400 font-semibold block mb-1">Math Score:</label>
              <input
                type="number"
                value={mathScore}
                onChange={(e) => setMathScore(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
              />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-center text-center">
              <span className="text-[11px] text-slate-400">Total Marks</span>
              <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                {totalScore} / {maxMarks}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {percentage}% Score
              </span>
            </div>
          </div>

          {/* Rank, Accuracy, Silly mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Super-50 Batch Rank (Optional):</label>
              <input
                type="number"
                placeholder="e.g. 7"
                value={batchRank}
                onChange={(e) => setBatchRank(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Accuracy %:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={accuracy}
                onChange={(e) => setAccuracy(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Silly / Calculation Errors (Count):</label>
              <input
                type="number"
                min="0"
                value={sillyMistakes}
                onChange={(e) => setSillyMistakes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Tag Weak Chapters -> Feeds automatically into Goal Generator */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 text-xs">
              Tag Weak Chapters Identified in This Test:
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Tagged weak chapters will automatically receive top priority in your daily automatically generated PCM plan!
            </p>
            <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
              {ALL_CHAPTERS.map((ch) => {
                const isSelected = selectedWeakChapters.includes(ch.id);
                return (
                  <button
                    type="button"
                    key={ch.id}
                    onClick={() => toggleWeakChapter(ch.id)}
                    className={`text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{ch.name}</span>
                    {isSelected && <span className="text-rose-400 font-bold ml-1">×</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Post-Test Analysis Notes */}
          <div>
            <label className="text-slate-300 font-medium block mb-1 text-xs">
              Post-Test Detailed Analysis & Learnings:
            </label>
            <textarea
              rows={3}
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              placeholder="What questions cost you marks? Any formula gaps or speed issues during the 3 hours? Key takeaways for next test..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
            >
              Save Test Scorecard
            </button>
          </div>
        </form>
      )}

      {/* Visual Chapter Mastery & Mock Weakness Heatmap Component */}
      <ChapterMasteryHeatmap
        mockResults={mockResults}
        chapterProgress={chapterProgress}
        onSelectChapter={onSelectChapter}
      />

      {/* NEW: Conceptual Gap Finder & Milestone Cross-Referencer */}
      <ConceptualGapFinder
        mockResults={mockResults}
        chapterProgress={chapterProgress}
        onSelectChapter={onSelectChapter}
        onToggleMilestone={onToggleMilestone}
        onLaunchQuizForGap={(ch, mKey) => setRemediationQuizGoal({ chapter: ch, milestoneKey: mKey })}
      />

      {/* Mock Results History */}
      {mockResults.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <Trophy className="w-10 h-10 text-amber-500/50 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Mock Tests Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Once you take your first Part Test or Full Test, record your subject scores and weak chapters here. The system uses your weak chapters to adapt daily study goals!
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
          >
            Log First Mock Score
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {mockResults.map((result) => {
            const pct = Math.round((result.totalScore / result.maxMarks) * 100);
            return (
              <div
                key={result.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-amber-400">{result.testName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{result.date}</span>
                      {result.batchRank && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono">
                            <Award className="w-3.5 h-3.5" /> Super-50 Rank #{result.batchRank}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-base font-bold text-white font-mono tabular-nums">
                        {result.totalScore} / {result.maxMarks}
                      </span>
                      <span className="text-xs text-slate-400 ml-1 font-mono">
                        ({pct}%)
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteResult(result.id)}
                      title="Delete test result"
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-sky-400 block text-[11px]">Physics</span>
                    <strong className="text-white text-sm tabular-nums">{result.physicsScore}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 block text-[11px]">Chemistry</span>
                    <strong className="text-white text-sm tabular-nums">{result.chemScore}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 block text-[11px]">Mathematics</span>
                    <strong className="text-white text-sm tabular-nums">{result.mathScore}</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Accuracy</span>
                    <strong className="text-slate-200 text-sm tabular-nums">{result.accuracyPercent || 85}%</strong>
                  </div>
                </div>

                {/* Weak Chapters tagged */}
                {result.weakChapters.length > 0 && (
                  <div className="text-xs">
                    <span className="text-slate-400 block mb-1">Weak Chapters Identified:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.weakChapters.map((chId) => {
                        const chapter = ALL_CHAPTERS.find((c) => c.id === chId);
                        return (
                          <span
                            key={chId}
                            className="bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[11px] px-2 py-0.5 rounded"
                          >
                            {chapter?.name || chId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Analysis Notes */}
                {result.analysisNotes && (
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-mono">
                    {result.analysisNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Remediation Quiz Modal for Found Gap */}
      {remediationQuizGoal && (
        <AIQuizModal
          goal={{
            id: `gap-${remediationQuizGoal.chapter.id}-${remediationQuizGoal.milestoneKey}`,
            subject: remediationQuizGoal.chapter.subject,
            chemBranch: remediationQuizGoal.chapter.chemBranch,
            chapterId: remediationQuizGoal.chapter.id,
            chapterName: remediationQuizGoal.chapter.name,
            milestoneKey: remediationQuizGoal.milestoneKey,
            milestoneTitle: `Remediation Drill: ${remediationQuizGoal.chapter.name}`,
            targetMinutes: 25,
            completed: false,
          }}
          onClose={() => setRemediationQuizGoal(null)}
          onMarkMilestoneCompleted={(chId, mKey) => {
            if (onToggleMilestone) onToggleMilestone(chId, mKey);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};
