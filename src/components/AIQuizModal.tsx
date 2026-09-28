import React, { useState, useEffect } from 'react';
import { Chapter, DailyGoalItem, MilestoneKey, QuizQuestion, SubjectType } from '../types/jee';
import { fetchPracticeQuiz } from '../services/geminiQuizService';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Trophy,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  BookOpen,
  Award,
} from 'lucide-react';

interface AIQuizModalProps {
  goal: DailyGoalItem;
  onClose: () => void;
  onAddQuestions?: (subject: SubjectType, count: number) => void;
  onMarkMilestoneCompleted?: (chapterId: string, milestoneKey: MilestoneKey) => void;
}

export const AIQuizModal: React.FC<AIQuizModalProps> = ({
  goal,
  onClose,
  onAddQuestions,
  onMarkMilestoneCompleted,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasLoggedQuestions, setHasLoggedQuestions] = useState<boolean>(false);
  const [hasCompletedMilestone, setHasCompletedMilestone] = useState<boolean>(false);

  // Load questions on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPracticeQuiz(goal.subject, goal.chapterId, goal.chapterName, goal.milestoneKey)
      .then((qs) => {
        if (isMounted) {
          setQuestions(qs);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Quiz loading failed:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [goal.chapterId, goal.milestoneKey, goal.subject, goal.chapterName]);

  // Elapsed timer
  useEffect(() => {
    if (loading || isFinished) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, isFinished]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length || 10;
  const currentAnswer = userAnswers[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (isFinished) return;
    const optLetter = (['A', 'B', 'C', 'D'][optIndex]) as 'A' | 'B' | 'C' | 'D';
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optLetter,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(!!userAnswers[currentIndex + 1]);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(!!userAnswers[currentIndex - 1]);
    }
  };

  // Calculations for summary
  const correctCount = questions.reduce((acc, q, idx) => {
    return userAnswers[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  const attemptedCount = Object.keys(userAnswers).length;
  const incorrectCount = attemptedCount - correctCount;
  const accuracyPct = attemptedCount > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const jeeSimulatedScore = correctCount * 4 - incorrectCount * 1;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const handleLogQuestions = () => {
    if (!hasLoggedQuestions && onAddQuestions) {
      onAddQuestions(goal.subject, 10);
      setHasLoggedQuestions(true);
    }
  };

  const handleMarkMilestone = () => {
    if (!hasCompletedMilestone && onMarkMilestoneCompleted) {
      onMarkMilestoneCompleted(goal.chapterId, goal.milestoneKey);
      setHasCompletedMilestone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                  AI Practice Quiz
                </span>
                <span className="text-xs text-slate-400 font-mono truncate">
                  {goal.subject} • {goal.milestoneKey}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {goal.chapterName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-base font-bold text-white">Generating 10 JEE Retention Questions...</p>
                <p className="text-xs text-slate-400 mt-1">
                  Calibrating questions for {goal.chapterName} based on active milestone standards.
                </p>
              </div>
            </div>
          ) : isFinished ? (
            /* Results Screen */
            <div className="space-y-6 py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
                  <Trophy className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  {accuracyPct >= 80
                    ? 'Outstanding! Concept retention is verified at JEE Advanced level.'
                    : accuracyPct >= 50
                    ? 'Solid effort! Review the step-by-step solutions below to eliminate traps.'
                    : 'Revise key formulas & 1-page summary before taking on high-volume problem drills.'}
                </p>
              </div>

              {/* Score Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-mono">Accuracy</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">{accuracyPct}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-mono">Correct</span>
                  <span className="text-xl font-bold text-white font-mono">
                    {correctCount} / {totalQuestions}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-mono">Simulated JEE Marks</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    {jeeSimulatedScore > 0 ? `+${jeeSimulatedScore}` : jeeSimulatedScore} / 40
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-mono">Time Spent</span>
                  <span className="text-xl font-bold text-sky-400 font-mono">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold block text-white">Daily 100 Practice Sync</span>
                  <span>
                    Count these 10 solved questions toward your daily{' '}
                    <strong className="text-amber-300">{goal.subject} target</strong> (Maths: 25, Chem: 40, Phys: 35).
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleLogQuestions}
                    disabled={hasLoggedQuestions}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      hasLoggedQuestions
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 cursor-default'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {hasLoggedQuestions ? 'Logged to Daily Count! ✓' : 'Log +10 Questions'}
                  </button>

                  {accuracyPct >= 60 && (
                    <button
                      onClick={handleMarkMilestone}
                      disabled={hasCompletedMilestone}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        hasCompletedMilestone
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      {hasCompletedMilestone ? 'Milestone Marked! ✓' : 'Complete Milestone'}
                    </button>
                  )}
                </div>
              </div>

              {/* Review Questions button */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    setIsFinished(false);
                    setCurrentIndex(0);
                    setShowExplanation(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Review Questions & Explanations
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Question Active Screen */
            <div className="space-y-4">
              {/* Question Tracker Dots */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((q, idx) => {
                    const ans = userAnswers[idx];
                    const isCur = idx === currentIndex;
                    let dotColor = 'bg-slate-800 text-slate-400 border-slate-700';

                    if (ans) {
                      dotColor =
                        ans === q.correctAnswer
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border-rose-700';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowExplanation(!!userAnswers[idx]);
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold border transition-all flex items-center justify-center ${dotColor} ${
                          isCur ? 'ring-2 ring-amber-400 scale-105' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      currentQ.difficulty === 'Hard'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : currentQ.difficulty === 'Medium'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentIndex + 1} of {totalQuestions}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="bg-slate-950/60 p-4 sm:p-5 rounded-xl border border-slate-800/80 space-y-2">
                <p className="text-xs font-mono text-amber-400 font-semibold">
                  Q{currentIndex + 1} • {currentQ.milestoneFocus || goal.chapterName}
                </p>
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed select-text">
                  {currentQ.question}
                </p>
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQ.options.map((optText, optIdx) => {
                  const optLetter = (['A', 'B', 'C', 'D'][optIdx]) as 'A' | 'B' | 'C' | 'D';
                  const isSelected = currentAnswer === optLetter;
                  const isCorrect = currentQ.correctAnswer === optLetter;

                  let cardStyle =
                    'bg-slate-950/80 hover:bg-slate-800/70 border-slate-800 text-slate-200';

                  if (currentAnswer) {
                    if (isCorrect) {
                      cardStyle =
                        'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 shadow-sm';
                    } else if (isSelected && !isCorrect) {
                      cardStyle =
                        'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-sm';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${cardStyle}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          currentAnswer
                            ? isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                            : isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {optLetter}
                      </div>
                      <span className="text-xs sm:text-sm leading-snug">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Explanation Accordion */}
              {showExplanation && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-amber-300">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Detailed Solution & Concept Note
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        currentAnswer === currentQ.correctAnswer
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      Correct Answer: Option {currentQ.correctAnswer}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans select-text">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </button>

                <div className="flex items-center gap-2">
                  {!showExplanation && currentAnswer && (
                    <button
                      onClick={() => setShowExplanation(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-400/10 transition-colors"
                    >
                      Show Solution
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                  >
                    <span>{currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No questions found. Please check connection and try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
