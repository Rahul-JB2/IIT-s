import { AchievementBadge, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS } from '../data/super50Data';

export function calculateAchievements(state: UserStudyState): AchievementBadge[] {
  // 1. Calculate milestones across all chapters
  let totalSummaries = 0;
  let totalMathongo = 0;
  let totalEx2 = 0;
  let totalEklavya = 0;
  let totalPreTest = 0;

  ALL_CHAPTERS.forEach((ch) => {
    const prog = state.chapterProgress[ch.id];
    if (prog) {
      if (prog.conclusion1Page) totalSummaries++;
      if (prog.mathongo) totalMathongo++;
      if (prog.moduleEx2) totalEx2++;
      if (prog.eklavya) totalEklavya++;
      if (prog.prevPartTest) totalPreTest++;
    }
  });

  // Max daily hours recorded
  const dailyHoursMap = state.dailyStudyHours || {};
  const maxDailyHours = Math.max(0, ...Object.values(dailyHoursMap), 6.5);

  // Max daily questions recorded
  const dailyQuestionsMap = state.dailyQuestionsSolved || {};
  const maxDailyQuestions = Math.max(
    0,
    ...Object.values(dailyQuestionsMap).map((q) => q.total),
    72
  );

  // High score in mock tests
  const maxMockScore = Math.max(0, ...state.mockResults.map((m) => m.totalScore));

  const badges: AchievementBadge[] = [
    {
      id: 'streak-7',
      title: '7-Day Consistency Torch',
      description: 'Study 7 consecutive days without breaking your Super-50 streak.',
      category: 'streak',
      icon: 'Flame',
      target: 7,
      current: Math.min(7, state.dailyStreak),
      isUnlocked: state.dailyStreak >= 7,
    },
    {
      id: 'streak-14',
      title: '14-Day Super-50 Titan',
      description: 'Sustain uninterrupted focus for two complete weeks.',
      category: 'streak',
      icon: 'Zap',
      target: 14,
      current: Math.min(14, state.dailyStreak),
      isUnlocked: state.dailyStreak >= 14,
    },
    {
      id: 'daily-8h',
      title: 'Daily Hours Centurion',
      description: 'Log 8.0+ hours of focused self-study in a single day.',
      category: 'hours',
      icon: 'Clock',
      target: 8.0,
      current: Number(Math.min(8.0, maxDailyHours).toFixed(1)),
      isUnlocked: maxDailyHours >= 8.0,
    },
    {
      id: 'total-100h',
      title: '100-Hour Study Veteran',
      description: 'Accumulate 100+ total logged preparation hours.',
      category: 'hours',
      icon: 'Trophy',
      target: 100,
      current: Math.min(100, Math.round(state.studyHoursLoggedTotal)),
      isUnlocked: state.studyHoursLoggedTotal >= 100,
    },
    {
      id: 'summary-5',
      title: '1-Page Summary Alchemist',
      description: 'Synthesize formulas & traps into 1-Page Summaries for 5 chapters.',
      category: 'milestones',
      icon: 'BookOpen',
      target: 5,
      current: Math.min(5, totalSummaries),
      isUnlocked: totalSummaries >= 5,
    },
    {
      id: 'mathongo-10',
      title: 'MathonGo Concept Sprinter',
      description: 'Master core concept builder questions across 10 chapters.',
      category: 'practice',
      icon: 'Target',
      target: 10,
      current: Math.min(10, totalMathongo),
      isUnlocked: totalMathongo >= 10,
    },
    {
      id: 'ex2-10',
      title: 'Module Ex-2 Gladiator',
      description: 'Solve coaching module Level-2 problem sets for 10 chapters.',
      category: 'practice',
      icon: 'Award',
      target: 10,
      current: Math.min(10, totalEx2),
      isUnlocked: totalEx2 >= 10,
    },
    {
      id: 'eklavya-5',
      title: 'EKLAVYA Advanced Master',
      description: 'Conquer tough multi-concept Advanced questions for 5 chapters.',
      category: 'practice',
      icon: 'Sparkles',
      target: 5,
      current: Math.min(5, totalEklavya),
      isUnlocked: totalEklavya >= 5,
    },
    {
      id: 'pretest-3',
      title: 'Pre-Test Blitz Warrior',
      description: 'Drill past test series papers 1 day before test for 3 chapters.',
      category: 'milestones',
      icon: 'ShieldCheck',
      target: 3,
      current: Math.min(3, totalPreTest),
      isUnlocked: totalPreTest >= 3,
    },
    {
      id: 'mock-150',
      title: 'Mock Test High Scorer',
      description: 'Achieve 150+ marks out of 300 in any Super-50 mock test.',
      category: 'practice',
      icon: 'CheckCircle2',
      target: 150,
      current: Math.min(150, maxMockScore),
      isUnlocked: maxMockScore >= 150,
    },
    {
      id: 'triad-master',
      title: 'Daily PCM Triad Finisher',
      description: 'Complete all 3 Physics, Chemistry, and Math daily goals.',
      category: 'milestones',
      icon: 'Flame',
      target: 3,
      current: 3,
      isUnlocked: true, // Baseline starter badge unlocked
    },
    {
      id: 'questions-100',
      title: 'Daily 100+ Questions Crusher',
      description: 'Solve minimum 100 practice questions across PCM in one single day.',
      category: 'practice',
      icon: 'Trophy',
      target: 100,
      current: Math.min(100, maxDailyQuestions),
      isUnlocked: maxDailyQuestions >= 100,
    },
  ];

  return badges;
}
