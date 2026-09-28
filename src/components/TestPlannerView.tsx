import React, { useState } from 'react';
import { ALL_TESTS, ALL_CHAPTERS } from '../data/super50Data';
import { TestSchedule, UserStudyState } from '../types/jee';
import { calculateTestReadiness, getDaysDifference } from '../utils/goalGenerator';
import { Calendar, Monitor, FileText, ChevronRight, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

interface TestPlannerViewProps {
  currentDate: string;
  chapterProgress: UserStudyState['chapterProgress'];
  onSelectTestForMatrix: (testNumber: number) => void;
  onOpenScoreLogger: (test: TestSchedule) => void;
}

export const TestPlannerView: React.FC<TestPlannerViewProps> = ({
  currentDate,
  chapterProgress,
  onSelectTestForMatrix,
  onOpenScoreLogger,
}) => {
  const [activeTab, setActiveTab] = useState<'part' | 'full'>('part');

  const partTests = ALL_TESTS.filter((t) => t.type === 'part');
  const fullTests = ALL_TESTS.filter((t) => t.type === 'full');

  return (
    <div className="space-y-6">
      {/* Planner Header & Tabs */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-400">BSEB SUPER-50 (2025-27)</span>
            <span aria-hidden="true">·</span>
            <span>Official Test Series Master Schedule</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Test Series Calendar & Detailed Syllabus
          </h2>
        </div>

        {/* Tab switcher: Part Tests (1-8) vs Full Tests (1-11) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('part')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'part'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Part Tests (1 to 8)
          </button>
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'full'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Tests (1 to 11)
          </button>
        </div>
      </div>

      {/* Part Tests Grid */}
      {activeTab === 'part' && (
        <div className="space-y-4">
          {partTests.map((test) => {
            const daysLeft = getDaysDifference(currentDate, test.date);
            const readiness = calculateTestReadiness(test, chapterProgress);
            const isPassed = daysLeft < 0;
            const isImmediateNext = daysLeft >= 0 && daysLeft <= 14;

            const formattedDate = new Date(test.date + 'T00:00:00').toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={test.id}
                className={`bg-slate-900/60 border rounded-xl p-5 transition-all ${
                  isImmediateNext
                    ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-amber-400 text-sm tracking-wide">
                        {test.name}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formattedDate}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {test.mode} OMR
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Pattern: {test.pattern}
                      </span>
                    </div>

                    {test.cumulativeNotes && (
                      <p className="text-xs text-amber-400/80 font-medium">
                        {test.cumulativeNotes}
                      </p>
                    )}
                  </div>

                  {/* Readiness and Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Readiness
                      </span>
                      <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                        {readiness.percentage}%
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectTestForMatrix(test.testNumber)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                      title="Filter chapter matrix for this test"
                    >
                      Chapters ({readiness.chapterCount}) <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenScoreLogger(test)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                    >
                      Log Score
                    </button>
                  </div>
                </div>

                {/* Detailed Subject Syllabus Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
                  {/* Physics */}
                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                    <strong className="text-sky-400 font-semibold block mb-1">
                      Physics Syllabus
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      {test.physicsSyllabus}
                    </p>
                  </div>

                  {/* Chemistry */}
                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                    <strong className="text-emerald-400 font-semibold block mb-1">
                      Chemistry Syllabus
                    </strong>
                    <div className="space-y-1 text-slate-300 leading-relaxed">
                      <p><strong className="text-slate-200">Physical:</strong> {test.pChemSyllabus}</p>
                      {test.iChemSyllabus && (
                        <p><strong className="text-slate-200">Inorganic:</strong> {test.iChemSyllabus}</p>
                      )}
                      {test.oChemSyllabus && (
                        <p><strong className="text-slate-200">Organic:</strong> {test.oChemSyllabus}</p>
                      )}
                    </div>
                  </div>

                  {/* Mathematics */}
                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                    <strong className="text-amber-400 font-semibold block mb-1">
                      Mathematics Syllabus
                    </strong>
                    <p className="text-slate-300 leading-relaxed">
                      {test.mathSyllabus}
                    </p>
                    {test.advSpecific && (
                      <div className="mt-2 pt-2 border-t border-slate-800/90 text-[11px] text-amber-300">
                        <strong>JEE Advanced Extra:</strong> {test.advSpecific}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Tests Grid */}
      {activeTab === 'full' && (
        <div className="space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
            <h4 className="font-semibold text-white mb-1">
              Full Syllabus JEE Main Mock Rehearsals (11 Tests)
            </h4>
            <p className="text-slate-400">
              Alternating between Offline OMR and CBT (Computer Based Test) to build authentic exam temperament before the January session of JEE Main!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fullTests.map((test) => {
              const formattedDate = new Date(test.date + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={test.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{test.name}</h4>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                          test.mode === 'CBT'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {test.mode}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formattedDate}
                    </p>

                    <p className="text-xs text-slate-300">
                      <strong>Syllabus:</strong> Full PCM Complete Syllabus (100% Comprehensive)
                    </p>

                    {test.cumulativeNotes && (
                      <p className="text-[11px] text-amber-400/80 italic">
                        {test.cumulativeNotes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenScoreLogger(test)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                    >
                      Log Mock Result
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
