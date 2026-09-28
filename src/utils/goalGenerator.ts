import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import { Chapter, DailyGoalItem, DailyPlan, MilestoneKey, MILESTONES, SubjectType, TestSchedule, UserStudyState } from '../types/jee';

export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getUpcomingTest(currentDate: string): { test: TestSchedule; daysRemaining: number } | null {
  const futureOrToday = ALL_TESTS.filter((t) => t.date >= currentDate);
  if (futureOrToday.length === 0) {
    // Return last test if all dates are in the past
    const last = ALL_TESTS[ALL_TESTS.length - 1];
    return { test: last, daysRemaining: getDaysDifference(currentDate, last.date) };
  }
  const next = futureOrToday[0];
  return {
    test: next,
    daysRemaining: getDaysDifference(currentDate, next.date),
  };
}

export function getNextPendingMilestone(
  chapterProgress: UserStudyState['chapterProgress'],
  chapterId: string,
  isDayBeforeTest: boolean
): { key: MilestoneKey; label: string; minutes: number } {
  const prog = chapterProgress[chapterId];
  if (!prog) {
    return { key: 'theory', label: 'Theory & Notes', minutes: 90 };
  }

  if (isDayBeforeTest) {
    return { key: 'prevPartTest', label: 'Previous Part TEST Drill & 1-Page Summary', minutes: 60 };
  }

  // Regular order: theory -> conclusion1Page -> mathongo -> moduleEx2 -> eklavya
  const order: MilestoneKey[] = ['theory', 'conclusion1Page', 'mathongo', 'moduleEx2', 'eklavya'];
  for (const m of order) {
    if (!prog[m]) {
      const info = MILESTONES.find((item) => item.key === m);
      return {
        key: m,
        label: info?.label || m,
        minutes: info?.estimatedMinutes || 60,
      };
    }
  }

  // If all done, revision
  return {
    key: 'prevPartTest',
    label: 'Previous Part TEST Advanced Practice',
    minutes: 60,
  };
}

// Helper to get practice milestone (MathonGo / Module Ex-2 / Eklavya) for problem solving
// with daily question targets: Maths 25 questions, Chemistry 40 questions, Physics 35 questions (Total = 100)
export function getPracticeMilestoneForSubject(
  chapterProgress: UserStudyState['chapterProgress'],
  chapterId: string,
  subject: SubjectType
): { key: MilestoneKey; label: string; minutes: number; targetQuestions: number } {
  const prog = chapterProgress[chapterId];
  const qCount = subject === 'Math' ? 25 : subject === 'Chemistry' ? 40 : 35;

  if (!prog) {
    return {
      key: 'mathongo',
      label: `MathonGo Concept Builder Drill (${qCount} Questions Target)`,
      minutes: 60,
      targetQuestions: qCount,
    };
  }
  if (!prog.mathongo) {
    return {
      key: 'mathongo',
      label: `MathonGo Speed Drill (${qCount} Questions Target)`,
      minutes: 60,
      targetQuestions: qCount,
    };
  }
  if (!prog.moduleEx2) {
    return {
      key: 'moduleEx2',
      label: `Module Exercise-2 Practice (${qCount} Questions Target)`,
      minutes: 75,
      targetQuestions: qCount,
    };
  }
  if (!prog.eklavya) {
    return {
      key: 'eklavya',
      label: `EKLAVYA Multi-Concept Practice (${qCount} Questions Target)`,
      minutes: 90,
      targetQuestions: qCount,
    };
  }
  return {
    key: 'prevPartTest',
    label: `Part Test Previous Paper Drill (${qCount} Questions Target)`,
    minutes: 60,
    targetQuestions: qCount,
  };
}

// Helper to evaluate difficulty score based on chapter, student history, and subject energy
function calculateTaskDifficulty(
  chapter: Chapter,
  prog: UserStudyState['chapterProgress'][string] | undefined,
  milestoneKey: MilestoneKey,
  isWeak: boolean,
  energyLevel: 'High' | 'Medium' | 'Low'
): { score: number; rating: 'High' | 'Medium' | 'Normal' } {
  let score = 0;
  // Milestone weight
  if (milestoneKey === 'eklavya') score += 45;
  else if (milestoneKey === 'moduleEx2') score += 32;
  else if (milestoneKey === 'theory') score += 28;
  else if (milestoneKey === 'prevPartTest') score += 24;
  else if (milestoneKey === 'mathongo') score += 20;
  else if (milestoneKey === 'conclusion1Page') score += 16;

  // Chapter innate complexity (JEE Advanced-only topics or rigorous units)
  if (chapter.isAdvOnly) score += 20;

  // Confidence factor
  const conf = prog?.confidenceRating || 2;
  score += (5 - conf) * 6; // up to +24 for rating 1

  // Weak chapter boost
  if (isWeak) score += 30;

  // Subject energy factor
  if (energyLevel === 'Low') score += 18; // Low energy subject requires peak alertness
  else if (energyLevel === 'High') score += 6;

  let rating: 'High' | 'Medium' | 'Normal' = 'Normal';
  if (score >= 60) rating = 'High';
  else if (score >= 38) rating = 'Medium';

  return { score, rating };
}

// Generate the 3 PCM goals for a specific date factoring in energy levels and alert hours
export function generateDailyPCMPlan(state: UserStudyState, targetDate: string): DailyPlan {
  const upcomingInfo = getUpcomingTest(targetDate);
  const targetTest = upcomingInfo?.test || ALL_TESTS[0];
  const daysLeft = upcomingInfo?.daysRemaining ?? 7;
  const isOneDayBeforeTest = daysLeft <= 1 && daysLeft >= 0;

  // Energy profile from user state
  const energyProfile = state.energyProfile || {
    peakAlertSlot: 'morning',
    prioritizeHardestInPeakHours: true,
    subjectEnergy: {
      Physics: 'High',
      Chemistry: 'Medium',
      Math: 'High',
    },
  };

  // Filter chapters relevant to this test
  const relevantChapters = ALL_CHAPTERS.filter((ch) => {
    if (targetTest.type === 'full') return true;
    return ch.partTestIds.includes(targetTest.testNumber);
  });

  // Collect weak chapters from mock tests for bonus weighting
  const weakChapterIds = new Set<string>();
  state.mockResults.forEach((m) => {
    m.weakChapters.forEach((id) => weakChapterIds.add(id));
  });

  // Helper to score chapters: higher score = higher priority for today
  function getChapterPriorityScore(ch: Chapter): number {
    const prog = state.chapterProgress[ch.id];
    let score = 0;

    // Weak chapter boost
    if (weakChapterIds.has(ch.id)) score += 50;

    // Newly introduced in this upcoming test boost
    if (ch.introducedInTest === targetTest.testNumber) score += 30;

    if (!prog) return score + 20;

    // Pending milestones boost
    if (!prog.theory) score += 25;
    else if (!prog.conclusion1Page) score += 20;
    else if (!prog.mathongo) score += 18;
    else if (!prog.moduleEx2) score += 15;
    else if (!prog.eklavya) score += 12;
    else if (!prog.prevPartTest) score += 10;
    else score -= 30; // Already mastered

    // Confidence rating
    const conf = prog.confidenceRating || 2;
    score += (5 - conf) * 4;

    return score;
  }

  // Pick best Physics chapter
  const physicsChapters = relevantChapters.filter((c) => c.subject === 'Physics');
  physicsChapters.sort((a, b) => getChapterPriorityScore(b) - getChapterPriorityScore(a));
  const selectedPhysics = physicsChapters[0] || ALL_CHAPTERS.find((c) => c.subject === 'Physics')!;

  // Pick best Chemistry chapter (balance Physical, Inorganic, Organic according to test syllabus)
  const chemChapters = relevantChapters.filter((c) => c.subject === 'Chemistry');
  chemChapters.sort((a, b) => getChapterPriorityScore(b) - getChapterPriorityScore(a));
  const selectedChem = chemChapters[0] || ALL_CHAPTERS.find((c) => c.subject === 'Chemistry')!;

  // Pick best Math chapter
  const mathChapters = relevantChapters.filter((c) => c.subject === 'Math');
  mathChapters.sort((a, b) => getChapterPriorityScore(b) - getChapterPriorityScore(a));
  const selectedMath = mathChapters[0] || ALL_CHAPTERS.find((c) => c.subject === 'Math')!;

  // Rotate which subject gets Theory on any day (0 = Physics, 1 = Chemistry, 2 = Math)
  const dayNum = new Date(targetDate + 'T00:00:00').getDate();
  const theoryPrioritySubject = dayNum % 3 === 0 ? 'Physics' : dayNum % 3 === 1 ? 'Chemistry' : 'Math';

  let pMilestone = getNextPendingMilestone(state.chapterProgress, selectedPhysics.id, isOneDayBeforeTest);
  let cMilestone = getNextPendingMilestone(state.chapterProgress, selectedChem.id, isOneDayBeforeTest);
  let mMilestone = getNextPendingMilestone(state.chapterProgress, selectedMath.id, isOneDayBeforeTest);

  if (!isOneDayBeforeTest) {
    // If multiple subjects got theory or conclusion1Page, alternate so that at most 1 gets theory/summary
    // and the other 2 focus on question practice (MathonGo / Module Ex-2 / Eklavya) for min 100 questions daily!
    // Question target distribution: Math = 25 questions, Chemistry = 40 questions, Physics = 35 questions (Total = 100)
    const isPTheory = pMilestone.key === 'theory' || pMilestone.key === 'conclusion1Page';
    const isCTheory = cMilestone.key === 'theory' || cMilestone.key === 'conclusion1Page';
    const isMTheory = mMilestone.key === 'theory' || mMilestone.key === 'conclusion1Page';

    const theoryCount = (isPTheory ? 1 : 0) + (isCTheory ? 1 : 0) + (isMTheory ? 1 : 0);

    if (theoryCount > 1) {
      if (theoryPrioritySubject === 'Physics') {
        if (isCTheory) cMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedChem.id, 'Chemistry');
        if (isMTheory) mMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedMath.id, 'Math');
      } else if (theoryPrioritySubject === 'Chemistry') {
        if (isPTheory) pMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedPhysics.id, 'Physics');
        if (isMTheory) mMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedMath.id, 'Math');
      } else {
        if (isPTheory) pMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedPhysics.id, 'Physics');
        if (isCTheory) cMilestone = getPracticeMilestoneForSubject(state.chapterProgress, selectedChem.id, 'Chemistry');
      }
    }
  }

  // Calculate difficulty for each subject's assigned task
  const diffP = calculateTaskDifficulty(
    selectedPhysics,
    state.chapterProgress[selectedPhysics.id],
    pMilestone.key,
    weakChapterIds.has(selectedPhysics.id),
    energyProfile.subjectEnergy.Physics
  );
  const diffC = calculateTaskDifficulty(
    selectedChem,
    state.chapterProgress[selectedChem.id],
    cMilestone.key,
    weakChapterIds.has(selectedChem.id),
    energyProfile.subjectEnergy.Chemistry
  );
  const diffM = calculateTaskDifficulty(
    selectedMath,
    state.chapterProgress[selectedMath.id],
    mMilestone.key,
    weakChapterIds.has(selectedMath.id),
    energyProfile.subjectEnergy.Math
  );

  // Find the hardest subject
  const subjectsWithDifficulty = [
    { subject: 'Physics' as SubjectType, score: diffP.score, diffRating: diffP.rating },
    { subject: 'Chemistry' as SubjectType, score: diffC.score, diffRating: diffC.rating },
    { subject: 'Math' as SubjectType, score: diffM.score, diffRating: diffM.rating },
  ];
  subjectsWithDifficulty.sort((a, b) => b.score - a.score);
  const hardestSubject = subjectsWithDifficulty[0].subject;

  // Determine time slot mapping based on user's peakAlertSlot and hardest chapter prioritization
  const timeSlotsBySubject: Record<SubjectType, { slotLabel: string; isHardest: boolean }> = {
    Physics: { slotLabel: '', isHardest: hardestSubject === 'Physics' },
    Chemistry: { slotLabel: '', isHardest: hardestSubject === 'Chemistry' },
    Math: { slotLabel: '', isHardest: hardestSubject === 'Math' },
  };

  const peakSlot = energyProfile.peakAlertSlot;
  const prioritizeHardest = energyProfile.prioritizeHardestInPeakHours;

  const slotMorning = '🌅 Morning Slot (06:00 AM - 10:30 AM)';
  const slotAfternoon = '☀️ Afternoon Slot (01:00 PM - 04:30 PM)';
  const slotEvening = '🌙 Evening Slot (06:30 PM - 10:00 PM)';

  const peakMorningLabel = '⚡ 06:00 AM - 10:30 AM (Peak Alert Slot • Hardest Chapter Prioritized)';
  const peakAfternoonLabel = '⚡ 01:00 PM - 04:30 PM (Peak Alert Slot • Hardest Chapter Prioritized)';
  const peakEveningLabel = '⚡ 06:30 PM - 10:00 PM (Peak Alert Slot • Hardest Chapter Prioritized)';

  if (prioritizeHardest) {
    if (peakSlot === 'morning') {
      timeSlotsBySubject[hardestSubject] = { slotLabel: peakMorningLabel, isHardest: true };
      const remaining = (['Physics', 'Chemistry', 'Math'] as SubjectType[]).filter((s) => s !== hardestSubject);
      timeSlotsBySubject[remaining[0]] = { slotLabel: slotAfternoon, isHardest: false };
      timeSlotsBySubject[remaining[1]] = { slotLabel: slotEvening, isHardest: false };
    } else if (peakSlot === 'afternoon') {
      timeSlotsBySubject[hardestSubject] = { slotLabel: peakAfternoonLabel, isHardest: true };
      const remaining = (['Physics', 'Chemistry', 'Math'] as SubjectType[]).filter((s) => s !== hardestSubject);
      timeSlotsBySubject[remaining[0]] = { slotLabel: slotMorning, isHardest: false };
      timeSlotsBySubject[remaining[1]] = { slotLabel: slotEvening, isHardest: false };
    } else {
      timeSlotsBySubject[hardestSubject] = { slotLabel: peakEveningLabel, isHardest: true };
      const remaining = (['Physics', 'Chemistry', 'Math'] as SubjectType[]).filter((s) => s !== hardestSubject);
      timeSlotsBySubject[remaining[0]] = { slotLabel: slotMorning, isHardest: false };
      timeSlotsBySubject[remaining[1]] = { slotLabel: slotAfternoon, isHardest: false };
    }
  } else {
    timeSlotsBySubject['Physics'] = { slotLabel: slotMorning, isHardest: hardestSubject === 'Physics' };
    timeSlotsBySubject['Chemistry'] = { slotLabel: slotAfternoon, isHardest: hardestSubject === 'Chemistry' };
    timeSlotsBySubject['Math'] = { slotLabel: slotEvening, isHardest: hardestSubject === 'Math' };
  }

  const goals: DailyGoalItem[] = [
    {
      id: `${targetDate}-phy-${selectedPhysics.id}`,
      subject: 'Physics',
      chapterId: selectedPhysics.id,
      chapterName: selectedPhysics.name,
      milestoneKey: pMilestone.key,
      milestoneTitle: isOneDayBeforeTest
        ? `1 Day Before Test: Solve Previous Part Test & Formula Sheet (${selectedPhysics.name})`
        : `${pMilestone.label} - ${selectedPhysics.name}`,
      targetMinutes: pMilestone.minutes,
      completed: !!state.chapterProgress[selectedPhysics.id]?.[pMilestone.key],
      isPreTestRevision: isOneDayBeforeTest,
      recommendedTimeSlot: timeSlotsBySubject['Physics'].slotLabel,
      isHardestChapter: timeSlotsBySubject['Physics'].isHardest,
      difficultyRating: diffP.rating,
      targetQuestions: 35, // Physics daily target: 35 questions
      energyAllocated: energyProfile.subjectEnergy.Physics,
    },
    {
      id: `${targetDate}-chm-${selectedChem.id}`,
      subject: 'Chemistry',
      chemBranch: selectedChem.chemBranch,
      chapterId: selectedChem.id,
      chapterName: selectedChem.name,
      milestoneKey: cMilestone.key,
      milestoneTitle: isOneDayBeforeTest
        ? `1 Day Before Test: Past Test Questions & Reaction Cheatsheet (${selectedChem.name})`
        : `${cMilestone.label} - ${selectedChem.name}`,
      targetMinutes: cMilestone.minutes,
      completed: !!state.chapterProgress[selectedChem.id]?.[cMilestone.key],
      isPreTestRevision: isOneDayBeforeTest,
      recommendedTimeSlot: timeSlotsBySubject['Chemistry'].slotLabel,
      isHardestChapter: timeSlotsBySubject['Chemistry'].isHardest,
      difficultyRating: diffC.rating,
      targetQuestions: 40, // Chemistry daily target: 40 questions (User requirement)
      energyAllocated: energyProfile.subjectEnergy.Chemistry,
    },
    {
      id: `${targetDate}-mat-${selectedMath.id}`,
      subject: 'Math',
      chapterId: selectedMath.id,
      chapterName: selectedMath.name,
      milestoneKey: mMilestone.key,
      milestoneTitle: isOneDayBeforeTest
        ? `1 Day Before Test: Past Test Speed Drill & Theorem Revision (${selectedMath.name})`
        : `${mMilestone.label} - ${selectedMath.name}`,
      targetMinutes: mMilestone.minutes,
      completed: !!state.chapterProgress[selectedMath.id]?.[mMilestone.key],
      isPreTestRevision: isOneDayBeforeTest,
      recommendedTimeSlot: timeSlotsBySubject['Math'].slotLabel,
      isHardestChapter: timeSlotsBySubject['Math'].isHardest,
      difficultyRating: diffM.rating,
      targetQuestions: 25, // Maths daily target: 25 questions (User requirement)
      energyAllocated: energyProfile.subjectEnergy.Math,
    },
  ];

  return {
    date: targetDate,
    generatedAt: new Date().toISOString(),
    goals,
    totalStudyMinutes: goals.reduce((acc, g) => acc + (g.completed ? g.targetMinutes : 0), 0),
  };
}

export function calculateTestReadiness(
  test: TestSchedule,
  chapterProgress: UserStudyState['chapterProgress']
): { percentage: number; totalMilestones: number; completedMilestones: number; chapterCount: number } {
  const relevantChapters = ALL_CHAPTERS.filter((ch) => {
    if (test.type === 'full') return true;
    return ch.partTestIds.includes(test.testNumber);
  });

  let totalMilestones = 0;
  let completedMilestones = 0;

  relevantChapters.forEach((ch) => {
    const prog = chapterProgress[ch.id];
    // Each chapter has 6 milestones
    totalMilestones += 6;
    if (prog) {
      if (prog.theory) completedMilestones++;
      if (prog.conclusion1Page) completedMilestones++;
      if (prog.mathongo) completedMilestones++;
      if (prog.moduleEx2) completedMilestones++;
      if (prog.eklavya) completedMilestones++;
      if (prog.prevPartTest) completedMilestones++;
    }
  });

  const percentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  return {
    percentage,
    totalMilestones,
    completedMilestones,
    chapterCount: relevantChapters.length,
  };
}
