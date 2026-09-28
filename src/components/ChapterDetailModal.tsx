import React, { useState } from 'react';
import { Chapter, ChapterProgress, MilestoneKey, MILESTONES } from '../types/jee';
import { X, Check, Star, BookOpen, Save, FileText, CheckCircle2 } from 'lucide-react';

interface ChapterDetailModalProps {
  chapter: Chapter | null;
  progress: ChapterProgress | undefined;
  onClose: () => void;
  onSaveProgress: (chapterId: string, updates: Partial<ChapterProgress>) => void;
  onToggleMilestone: (chapterId: string, key: MilestoneKey) => void;
}

export const ChapterDetailModal: React.FC<ChapterDetailModalProps> = ({
  chapter,
  progress,
  onClose,
  onSaveProgress,
  onToggleMilestone,
}) => {
  if (!chapter) return null;

  const currentProg = progress || {
    theory: false,
    conclusion1Page: false,
    mathongo: false,
    moduleEx2: false,
    eklavya: false,
    prevPartTest: false,
    mathongoSolved: 0,
    moduleEx2Solved: 0,
    eklavyaSolved: 0,
    confidenceRating: 2,
    notes: '',
  };

  const [notes, setNotes] = useState(currentProg.notes || '');
  const [mathongoSolved, setMathongoSolved] = useState(currentProg.mathongoSolved || 0);
  const [moduleEx2Solved, setModuleEx2Solved] = useState(currentProg.moduleEx2Solved || 0);
  const [eklavyaSolved, setEklavyaSolved] = useState(currentProg.eklavyaSolved || 0);
  const [confidence, setConfidence] = useState<number>(currentProg.confidenceRating || 2);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveProgress(chapter.id, {
      notes,
      mathongoSolved: Number(mathongoSolved),
      moduleEx2Solved: Number(moduleEx2Solved),
      eklavyaSolved: Number(eklavyaSolved),
      confidenceRating: confidence as any,
      lastUpdated: new Date().toISOString(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-amber-400">{chapter.subject}</span>
              {chapter.chemBranch && <span>· {chapter.chemBranch}</span>}
              <span aria-hidden="true">·</span>
              <span>Introduced in Part Test #{chapter.introducedInTest}</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {chapter.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs text-slate-300">
          
          {/* Key Syllabus Topics */}
          {chapter.keyTopics && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 font-medium block mb-1">Core Topics & Sub-Concepts:</span>
              <div className="flex flex-wrap gap-1.5">
                {chapter.keyTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-slate-300 text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 6-Milestone Quick Toggles */}
          <div>
            <span className="text-slate-300 font-semibold block mb-2">
              Milestone Completion Pipeline:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MILESTONES.map((m) => {
                const isChecked = !!currentProg[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => onToggleMilestone(chapter.id, m.key)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                      isChecked
                        ? 'bg-slate-800/90 border-amber-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        isChecked
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <strong className="block text-xs font-semibold">{m.shortLabel}</strong>
                      <span className="text-[10px] text-slate-500">{m.estimatedMinutes}m target</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Solved Counts */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-3">
            <span className="text-slate-200 font-semibold block text-xs">
              Practice Question Count Solved:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  MathonGo Concept Builder:
                </label>
                <input
                  type="number"
                  min="0"
                  value={mathongoSolved}
                  onChange={(e) => setMathongoSolved(Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Module Exercise-2:
                </label>
                <input
                  type="number"
                  min="0"
                  value={moduleEx2Solved}
                  onChange={(e) => setModuleEx2Solved(Number(e.target.value))}
                  placeholder="e.g. 30"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  EKLAVYA Batch Problems:
                </label>
                <input
                  type="number"
                  min="0"
                  value={eklavyaSolved}
                  onChange={(e) => setEklavyaSolved(Number(e.target.value))}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Confidence Rating */}
          <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <div>
              <span className="text-slate-200 font-semibold block text-xs">Self-Assessed Confidence:</span>
              <span className="text-[11px] text-slate-400">Rate exam readiness for this chapter</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setConfidence(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= confidence
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 1-Page Conclusion Cheatsheet & Chapter Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                1-Page Short Conclusion & Important Formulas:
              </label>
              <span className="text-[11px] text-slate-500">Formulas, critical traps & notes</span>
            </div>
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down the essential 1-page conclusion for this chapter:
• Key formulas & sign conventions
• High-yield concepts frequently tested in Super-50 tests
• Mistakes committed in past tests
• Special tricks & shortcut methods..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 sticky bottom-0">
          <span className="text-[11px] text-slate-400">
            {isSaved && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully!
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
