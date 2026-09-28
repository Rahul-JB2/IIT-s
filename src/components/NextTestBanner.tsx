import React, { useState } from 'react';
import { TestSchedule, UserStudyState } from '../types/jee';
import { calculateTestReadiness, getDaysDifference } from '../utils/goalGenerator';
import { Calendar, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface NextTestBannerProps {
  test: TestSchedule;
  currentDate: string;
  chapterProgress: UserStudyState['chapterProgress'];
  onOpenPreTestDrill: () => void;
  onOpenTestPlanner: () => void;
}

export const NextTestBanner: React.FC<NextTestBannerProps> = ({
  test,
  currentDate,
  chapterProgress,
  onOpenPreTestDrill,
  onOpenTestPlanner,
}) => {
  const [isSyllabusExpanded, setIsSyllabusExpanded] = useState(false);
  const daysLeft = getDaysDifference(currentDate, test.date);
  const readiness = calculateTestReadiness(test, chapterProgress);

  const isOneDayBefore = daysLeft === 1;
  const isTestDay = daysLeft === 0;
  const isOverdue = daysLeft < 0;

  // Format date readable: "Sun, 04 Oct 2026"
  const formattedDate = new Date(test.date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-xl border transition-all ${
        isOneDayBefore || isTestDay
          ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900/80 border-slate-800'
      } p-5 sm:p-6 mb-6`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Test Title & Urgency Info */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-amber-400 tracking-wide uppercase">
              {test.type === 'part' ? `BSEB Super-50 Part Series #${test.testNumber}` : `Full Syllabus Mock #${test.testNumber}`}
            </span>
            <span aria-hidden="true">·</span>
            <span>{test.pattern}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
              {test.mode} Mode
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {test.name}
            </h1>

            {/* Urgency state indicator */}
            {isTestDay ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2.5 py-0.5 rounded-md animate-pulse font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                EXAM TODAY
              </span>
            ) : isOneDayBefore ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 rounded-md animate-pulse font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                1 DAY BEFORE TEST (PRE-TEST DRILL ACTIVE)
              </span>
            ) : isOverdue ? (
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Test Date Passed
              </span>
            ) : (
              <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-0.5 rounded-md">
                {daysLeft} days to exam
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Scheduled Date: <strong className="text-slate-200">{formattedDate}</strong></span>
            {test.cumulativeNotes && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 italic">{test.cumulativeNotes}</span>
              </>
            )}
          </p>
        </div>

        {/* Right Side: Readiness & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
          
          {/* Readiness gauge */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 min-w-[180px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Syllabus Readiness</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {readiness.percentage}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, readiness.percentage))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
              {readiness.completedMilestones} of {readiness.totalMilestones} milestones done ({readiness.chapterCount} chapters)
            </p>
          </div>

          {/* Quick CTA buttons */}
          <div className="flex sm:flex-col gap-2">
            {isOneDayBefore || isTestDay ? (
              <button
                onClick={onOpenPreTestDrill}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch 1-Day Pre-Test Blitz
              </button>
            ) : (
              <button
                onClick={onOpenPreTestDrill}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Pre-Test Past Papers
              </button>
            )}

            <button
              onClick={() => setIsSyllabusExpanded(!isSyllabusExpanded)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1"
            >
              {isSyllabusExpanded ? (
                <>Hide Syllabus <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>View Syllabus <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Syllabus Detail Drawer */}
      {isSyllabusExpanded && (
        <div className="mt-5 pt-4 border-t border-slate-800 text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
            <span className="font-semibold text-sky-400 block mb-1">Physics Syllabus</span>
            <p className="text-slate-300 leading-relaxed">{test.physicsSyllabus}</p>
          </div>

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
            <span className="font-semibold text-emerald-400 block mb-1">Chemistry Syllabus</span>
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

          <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
            <span className="font-semibold text-amber-400 block mb-1">Mathematics Syllabus</span>
            <p className="text-slate-300 leading-relaxed">{test.mathSyllabus}</p>
            {test.advSpecific && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90">
                <strong>JEE Advanced Specific:</strong> {test.advSpecific}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
