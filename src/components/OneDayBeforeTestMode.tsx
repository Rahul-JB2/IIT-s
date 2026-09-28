import React, { useState } from 'react';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import { Chapter, TestSchedule, UserStudyState } from '../types/jee';
import { getDaysDifference, getUpcomingTest } from '../utils/goalGenerator';
import { Zap, Check, CheckSquare, Square, FileText, AlertCircle, Sparkles, BookOpen, Clock, ShieldCheck } from 'lucide-react';

interface OneDayBeforeTestModeProps {
  currentDate: string;
  chapterProgress: UserStudyState['chapterProgress'];
  onToggleMilestone: (chapterId: string, milestoneKey: 'prevPartTest' | 'conclusion1Page') => void;
  onOpenChapterModal: (chapter: Chapter) => void;
}

export const OneDayBeforeTestMode: React.FC<OneDayBeforeTestModeProps> = ({
  currentDate,
  chapterProgress,
  onToggleMilestone,
  onOpenChapterModal,
}) => {
  const nextTestInfo = getUpcomingTest(currentDate);
  const [selectedTestId, setSelectedTestId] = useState<string>(nextTestInfo?.test.id || ALL_TESTS[0].id);

  const selectedTest = ALL_TESTS.find((t) => t.id === selectedTestId) || ALL_TESTS[0];
  const daysLeft = getDaysDifference(currentDate, selectedTest.date);

  // Exam kit checklist state (persisted locally during session)
  const [examKit, setExamKit] = useState<Record<string, boolean>>({
    admitCard: false,
    blackPens: false,
    analogWatch: false,
    waterBottle: false,
    goodSleep: false,
  });

  const toggleKit = (key: string) => {
    setExamKit((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get all chapters in this test's syllabus
  const testChapters = ALL_CHAPTERS.filter((ch) => {
    if (selectedTest.type === 'full') return true;
    return ch.partTestIds.includes(selectedTest.testNumber);
  });

  const physicsChapters = testChapters.filter((c) => c.subject === 'Physics');
  const chemChapters = testChapters.filter((c) => c.subject === 'Chemistry');
  const mathChapters = testChapters.filter((c) => c.subject === 'Math');

  return (
    <div className="space-y-6">
      {/* Header and Test Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Dedicated 1-Day-Before-Test Blitz Protocol</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Previous Part Test Paper & 1-Page Summary Review
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Execution checklist for the final 24-48 hours before any Super-50 test.
          </p>
        </div>

        {/* Test Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Target Test:</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
          >
            {ALL_TESTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.date}) - {t.mode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Urgency Callout */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          daysLeft <= 1 && daysLeft >= 0
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : 'bg-slate-900/40 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="block text-sm font-semibold text-white">
              Target: {selectedTest.name} ({selectedTest.date}) · {selectedTest.mode} OMR
            </strong>
            <span className="text-slate-400">
              {daysLeft === 0
                ? 'Exam is scheduled TODAY. Keep your mind calm and focus on formula recall.'
                : daysLeft === 1
                ? 'Tomorrow is test day! Complete your previous part test paper solving & formula blitz today.'
                : `${daysLeft} days until this exam. You can preview the final-day revision checklist anytime.`}
            </span>
          </div>
        </div>

        <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-bold text-amber-400 tabular-nums shrink-0 self-start sm:self-auto">
          {daysLeft >= 0 ? `${daysLeft} Days to Exam` : 'Test Passed'}
        </span>
      </div>

      {/* 1-Page Summary & Previous Part Test Chapter Checklist for PCM */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center justify-between">
          <span>Syllabus Revision Checklist ({testChapters.length} Chapters)</span>
          <span className="text-xs text-slate-400 font-normal">
            Click checkbox to mark 'Previous Part Test' or '1-Page Summary' reviewed
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Physics Column */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sky-400 text-xs uppercase tracking-wide">
                Physics ({physicsChapters.length} Chapters)
              </span>
            </div>

            <div className="space-y-2">
              {physicsChapters.map((ch) => {
                const prog = chapterProgress[ch.id];
                const has1Page = !!prog?.conclusion1Page;
                const hasPrevTest = !!prog?.prevPartTest;

                return (
                  <div
                    key={ch.id}
                    className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-slate-200">{ch.name}</span>
                      <button
                        onClick={() => onOpenChapterModal(ch)}
                        title="View/Edit 1-page notes"
                        className="text-slate-500 hover:text-amber-400 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900 text-[11px]">
                      <button
                        onClick={() => onToggleMilestone(ch.id, 'conclusion1Page')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          has1Page
                            ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {has1Page && <Check className="w-3 h-3 text-amber-400" />}
                        <span>1-Page Summary</span>
                      </button>

                      <button
                        onClick={() => onToggleMilestone(ch.id, 'prevPartTest')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          hasPrevTest
                            ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {hasPrevTest && <Check className="w-3 h-3 text-rose-400" />}
                        <span>Prev Part Test</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chemistry Column */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400 text-xs uppercase tracking-wide">
                Chemistry ({chemChapters.length} Chapters)
              </span>
            </div>

            <div className="space-y-2">
              {chemChapters.map((ch) => {
                const prog = chapterProgress[ch.id];
                const has1Page = !!prog?.conclusion1Page;
                const hasPrevTest = !!prog?.prevPartTest;

                return (
                  <div
                    key={ch.id}
                    className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-semibold text-slate-200 block">{ch.name}</span>
                        <span className="text-[10px] text-emerald-400/90 font-medium">
                          {ch.chemBranch} Chemistry
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenChapterModal(ch)}
                        title="View/Edit 1-page notes"
                        className="text-slate-500 hover:text-amber-400 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900 text-[11px]">
                      <button
                        onClick={() => onToggleMilestone(ch.id, 'conclusion1Page')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          has1Page
                            ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {has1Page && <Check className="w-3 h-3 text-amber-400" />}
                        <span>1-Page Summary</span>
                      </button>

                      <button
                        onClick={() => onToggleMilestone(ch.id, 'prevPartTest')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          hasPrevTest
                            ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {hasPrevTest && <Check className="w-3 h-3 text-rose-400" />}
                        <span>Prev Part Test</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Math Column */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400 text-xs uppercase tracking-wide">
                Mathematics ({mathChapters.length} Chapters)
              </span>
            </div>

            <div className="space-y-2">
              {mathChapters.map((ch) => {
                const prog = chapterProgress[ch.id];
                const has1Page = !!prog?.conclusion1Page;
                const hasPrevTest = !!prog?.prevPartTest;

                return (
                  <div
                    key={ch.id}
                    className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-semibold text-slate-200">{ch.name}</span>
                      <button
                        onClick={() => onOpenChapterModal(ch)}
                        title="View/Edit 1-page notes"
                        className="text-slate-500 hover:text-amber-400 shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-900 text-[11px]">
                      <button
                        onClick={() => onToggleMilestone(ch.id, 'conclusion1Page')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          has1Page
                            ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {has1Page && <Check className="w-3 h-3 text-amber-400" />}
                        <span>1-Page Summary</span>
                      </button>

                      <button
                        onClick={() => onToggleMilestone(ch.id, 'prevPartTest')}
                        className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 transition-colors ${
                          hasPrevTest
                            ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {hasPrevTest && <Check className="w-3 h-3 text-rose-400" />}
                        <span>Prev Part Test</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Eve Kit & Temperament Checklist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          Exam Eve Kit & Logistics Checklist
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-300 pt-1">
          {[
            { key: 'admitCard', label: 'BSEB Super-50 Hall Ticket / ID Card ready' },
            { key: 'blackPens', label: '2 Black Ballpoint Pens (Bold tip for fast OMR bubbling)' },
            { key: 'analogWatch', label: 'Simple Analog Watch (Smartwatches prohibited)' },
            { key: 'waterBottle', label: 'Transparent Water Bottle' },
            { key: 'goodSleep', label: '7+ Hours Sleep Planned (No all-nighter before exam)' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => toggleKit(item.key)}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                examKit[item.key]
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                  examKit[item.key]
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {examKit[item.key] && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="leading-snug">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
