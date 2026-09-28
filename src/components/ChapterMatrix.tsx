import React, { useState, useMemo } from 'react';
import { Chapter, MilestoneKey, MILESTONES, SubjectType, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import { Search, Filter, Check, Star, BookOpen, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

interface ChapterMatrixProps {
  chapterProgress: UserStudyState['chapterProgress'];
  onToggleMilestone: (chapterId: string, milestoneKey: MilestoneKey) => void;
  onOpenChapterDetail: (chapter: Chapter) => void;
  highlightTestNumber?: number;
}

export const ChapterMatrix: React.FC<ChapterMatrixProps> = ({
  chapterProgress,
  onToggleMilestone,
  onOpenChapterDetail,
  highlightTestNumber,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Physics' | 'Physical' | 'Inorganic' | 'Organic' | 'Math'>('All');
  const [testFilter, setTestFilter] = useState<number | 'All'>(highlightTestNumber || 'All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  // Filtered chapters calculation
  const filteredChapters = useMemo(() => {
    return ALL_CHAPTERS.filter((ch) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(query);
        const matchesTopics = ch.keyTopics?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesTopics) return false;
      }

      // Subject filter
      if (subjectFilter !== 'All') {
        if (subjectFilter === 'Physics' && ch.subject !== 'Physics') return false;
        if (subjectFilter === 'Math' && ch.subject !== 'Math') return false;
        if (subjectFilter === 'Physical' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Physical')) return false;
        if (subjectFilter === 'Inorganic' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Inorganic')) return false;
        if (subjectFilter === 'Organic' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Organic')) return false;
      }

      // Test filter
      if (testFilter !== 'All') {
        if (!ch.partTestIds.includes(testFilter as number)) return false;
      }

      // Status filter
      if (statusFilter !== 'All') {
        const prog = chapterProgress[ch.id];
        const doneCount = prog
          ? (prog.theory ? 1 : 0) +
            (prog.conclusion1Page ? 1 : 0) +
            (prog.mathongo ? 1 : 0) +
            (prog.moduleEx2 ? 1 : 0) +
            (prog.eklavya ? 1 : 0) +
            (prog.prevPartTest ? 1 : 0)
          : 0;
        if (statusFilter === 'Completed' && doneCount < 6) return false;
        if (statusFilter === 'Pending' && doneCount === 6) return false;
      }

      return true;
    });
  }, [searchQuery, subjectFilter, testFilter, statusFilter, chapterProgress]);

  // Overall statistics for the current filter
  const stats = useMemo(() => {
    let totalMilestones = filteredChapters.length * 6;
    let completedMilestones = 0;

    filteredChapters.forEach((ch) => {
      const prog = chapterProgress[ch.id];
      if (prog) {
        if (prog.theory) completedMilestones++;
        if (prog.conclusion1Page) completedMilestones++;
        if (prog.mathongo) completedMilestones++;
        if (prog.moduleEx2) completedMilestones++;
        if (prog.eklavya) completedMilestones++;
        if (prog.prevPartTest) completedMilestones++;
      }
    });

    const percent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    return { totalMilestones, completedMilestones, percent };
  }, [filteredChapters, chapterProgress]);

  const getSubjectBadge = (ch: Chapter) => {
    if (ch.subject === 'Physics') {
      return <span className="text-[11px] text-sky-400 font-semibold">Physics</span>;
    }
    if (ch.subject === 'Math') {
      return <span className="text-[11px] text-amber-400 font-semibold">Mathematics</span>;
    }
    return (
      <span className="text-[11px] text-emerald-400 font-semibold">
        Chem · {ch.chemBranch}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header and Filter Controls */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        
        {/* Top Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-white">PCM Master Matrix</span>
              <span aria-hidden="true">·</span>
              <span>6 Essential Milestones Per Chapter</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Chapter Milestone Tracker
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Filtered Progress</span>
              <span className="text-amber-400 font-bold text-sm tabular-nums">
                {stats.completedMilestones} / {stats.totalMilestones} ({stats.percent}%)
              </span>
            </div>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject Filter Buttons */}
          <div className="md:col-span-2 flex items-center gap-1 overflow-x-auto p-1 bg-slate-950 rounded-lg border border-slate-800 no-scrollbar">
            {(
              [
                { id: 'All', label: 'All Subjects' },
                { id: 'Physics', label: 'Physics' },
                { id: 'Physical', label: 'P-Chem' },
                { id: 'Inorganic', label: 'I-Chem' },
                { id: 'Organic', label: 'O-Chem' },
                { id: 'Math', label: 'Math' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectFilter(s.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  subjectFilter === s.id
                    ? 'bg-slate-800 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Test and Status Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Tests</option>
              {ALL_TESTS.filter((t) => t.type === 'part').map((t) => (
                <option key={t.id} value={t.testNumber}>
                  {t.name} (PT-{t.testNumber})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Mastered (6/6)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chapter Table Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                <th className="py-3 px-4 min-w-[200px]">Chapter & Key Topics</th>
                <th className="py-3 px-2 text-center w-20">Theory</th>
                <th className="py-3 px-2 text-center w-24">1-Page Conclusion</th>
                <th className="py-3 px-2 text-center w-24">MathonGo Concept</th>
                <th className="py-3 px-2 text-center w-20">Module Ex-2</th>
                <th className="py-3 px-2 text-center w-20">EKLAVYA</th>
                <th className="py-3 px-2 text-center w-28">Prev Part Test (1d Before)</th>
                <th className="py-3 px-4 text-center w-24">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredChapters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No chapters match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredChapters.map((ch) => {
                  const prog = chapterProgress[ch.id] || {
                    theory: false,
                    conclusion1Page: false,
                    mathongo: false,
                    moduleEx2: false,
                    eklavya: false,
                    prevPartTest: false,
                  };

                  const doneCount =
                    (prog.theory ? 1 : 0) +
                    (prog.conclusion1Page ? 1 : 0) +
                    (prog.mathongo ? 1 : 0) +
                    (prog.moduleEx2 ? 1 : 0) +
                    (prog.eklavya ? 1 : 0) +
                    (prog.prevPartTest ? 1 : 0);

                  const percent = Math.round((doneCount / 6) * 100);

                  return (
                    <tr
                      key={ch.id}
                      className="hover:bg-slate-850/40 transition-colors group"
                    >
                      {/* Chapter Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getSubjectBadge(ch)}
                            <span className="text-[11px] text-slate-500 font-mono">
                              PT-{ch.introducedInTest}
                            </span>
                            {ch.isAdvOnly && (
                              <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-1 rounded">
                                ADV
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => onOpenChapterDetail(ch)}
                            className="text-left font-semibold text-white group-hover:text-amber-400 transition-colors block text-xs"
                          >
                            {ch.name}
                          </button>

                          {ch.keyTopics && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {ch.keyTopics.join(' · ')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 1. Theory */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'theory')}
                          title={prog.theory ? 'Completed: Theory' : 'Mark Theory done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.theory
                              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* 2. 1-Page Conclusion */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'conclusion1Page')}
                          title={prog.conclusion1Page ? 'Completed: 1-Page Summary' : 'Mark 1-Page Summary done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.conclusion1Page
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* 3. MathonGo Concept Builder */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'mathongo')}
                          title={prog.mathongo ? 'Completed: MathonGo Concept Builder' : 'Mark MathonGo done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.mathongo
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* 4. Module Ex-2 */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'moduleEx2')}
                          title={prog.moduleEx2 ? 'Completed: Module Ex-2' : 'Mark Module Ex-2 done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.moduleEx2
                              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* 5. EKLAVYA */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'eklavya')}
                          title={prog.eklavya ? 'Completed: EKLAVYA Batch Problems' : 'Mark Eklavya done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.eklavya
                              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* 6. Previous Part Test */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => onToggleMilestone(ch.id, 'prevPartTest')}
                          title={prog.prevPartTest ? 'Completed: Previous Part Test' : 'Mark Previous Part Test done'}
                          className={`w-7 h-7 mx-auto rounded flex items-center justify-center border transition-all ${
                            prog.prevPartTest
                              ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                              : 'bg-slate-900 border-slate-700/80 hover:border-slate-500 text-transparent'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </td>

                      {/* Progress summary & detail trigger */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                            {doneCount}/6
                          </span>
                          <button
                            onClick={() => onOpenChapterDetail(ch)}
                            title="Edit notes & solved count"
                            className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-16 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent === 100 ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
