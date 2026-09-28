import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import { MilestoneKey, SubjectType, UserStudyState } from '../types/jee';

export interface AssistantAction {
  type: 'MARK_MILESTONE' | 'LOG_QUESTIONS' | 'LOG_HOURS';
  chapterId?: string;
  chapterName?: string;
  milestones?: MilestoneKey[];
  subject?: SubjectType;
  count?: number;
  hours?: number;
  status?: boolean;
}

export interface AssistantResponse {
  reply: string;
  actions: AssistantAction[];
  pendingSummary?: string[];
  punishmentEvent?: {
    activate: boolean;
    release: boolean;
    reason: string;
  };
}

export async function askGeminiAssistant(
  message: string,
  state: UserStudyState,
  todayGoals: any[] = [],
  overdueViolations: any[] = []
): Promise<AssistantResponse> {
  const context = {
    currentDate: state.currentSimulatedDate,
    dailyHoursToday: state.dailyStudyHours?.[state.currentSimulatedDate] || 0,
    dailyQuestions: state.dailyQuestionsSolved?.[state.currentSimulatedDate] || {
      total: 0,
      physics: 0,
      chemistry: 0,
      math: 0,
    },
    todayGoals: todayGoals.map((g) => ({
      subject: g.subject,
      chapterName: g.chapterName,
      milestone: g.milestoneTitle,
      completed: g.completed,
    })),
    overdueViolations: overdueViolations.map((v) => ({
      chapterName: v.chapter.name,
      theoryDate: v.theoryCompletedDate,
    })),
    relevantChapters: ALL_CHAPTERS.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
    })),
  };

  try {
    const res = await fetch('/api/assistant/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (!data.fallback && data.reply) {
        return data as AssistantResponse;
      }
    }
  } catch (err) {
    console.warn('Backend Assistant call failed, using intelligent offline parser:', err);
  }

  // Intelligent Local NLP Fallback (Hindi, Hinglish & English)
  return parseOfflineAssistantCommand(message, state, todayGoals, overdueViolations);
}

// Client NLP parser supporting Hindi, Hinglish and English
function parseOfflineAssistantCommand(
  msg: string,
  state: UserStudyState,
  todayGoals: any[],
  overdueViolations: any[]
): AssistantResponse {
  const lower = msg.toLowerCase();
  const actions: AssistantAction[] = [];
  const pendingSummary: string[] = [];
  let punishmentEvent = { activate: false, release: false, reason: '' };

  // 1. Detect Chapter mentioned
  let matchedChapter = ALL_CHAPTERS.find((ch) => {
    const nameLower = ch.name.toLowerCase();
    const words = nameLower.split(' ').filter((w) => w.length > 3);
    return words.some((w) => lower.includes(w)) || lower.includes(nameLower);
  });

  // Default to today's active physics/chem/math goal if not explicitly named
  if (!matchedChapter) {
    if (lower.includes('physics') || lower.includes('phy')) {
      const g = todayGoals.find((t) => t.subject === 'Physics');
      if (g) matchedChapter = ALL_CHAPTERS.find((c) => c.id === g.chapterId);
    } else if (lower.includes('chemistry') || lower.includes('chem')) {
      const g = todayGoals.find((t) => t.subject === 'Chemistry');
      if (g) matchedChapter = ALL_CHAPTERS.find((c) => c.id === g.chapterId);
    } else if (lower.includes('math') || lower.includes('maths')) {
      const g = todayGoals.find((t) => t.subject === 'Math');
      if (g) matchedChapter = ALL_CHAPTERS.find((c) => c.id === g.chapterId);
    }
  }

  // 2. Detect Milestones to mark
  const milestonesToMark: MilestoneKey[] = [];
  const isTheory =
    lower.includes('theory') ||
    lower.includes('lecture') ||
    lower.includes('concept') ||
    lower.includes('padha') ||
    lower.includes('samajh');

  const isSummary =
    lower.includes('1 page') ||
    lower.includes('1-page') ||
    lower.includes('summary') ||
    lower.includes('formula') ||
    lower.includes('cheatsheet') ||
    lower.includes('notes');

  const isMathongo =
    lower.includes('mathongo') || lower.includes('builder') || lower.includes('concept builder');

  const isModule =
    lower.includes('module') ||
    lower.includes('ex-2') ||
    lower.includes('ex 2') ||
    lower.includes('exercise 2') ||
    lower.includes('exercise-2');

  const isEklavya =
    lower.includes('eklavya') || lower.includes('batch problem') || lower.includes('tough questions');

  const isPartTest =
    lower.includes('part test') || lower.includes('prev test') || lower.includes('paper solve');

  if (isTheory) milestonesToMark.push('theory');
  if (isSummary) milestonesToMark.push('conclusion1Page');
  if (isMathongo) milestonesToMark.push('mathongo');
  if (isModule) milestonesToMark.push('moduleEx2');
  if (isEklavya) milestonesToMark.push('eklavya');
  if (isPartTest) milestonesToMark.push('prevPartTest');

  if (matchedChapter && milestonesToMark.length > 0) {
    actions.push({
      type: 'MARK_MILESTONE',
      chapterId: matchedChapter.id,
      chapterName: matchedChapter.name,
      milestones: milestonesToMark,
      status: true,
    });

    // If 1-page summary is done, release punishment if any
    if (milestonesToMark.includes('conclusion1Page')) {
      punishmentEvent = {
        activate: false,
        release: true,
        reason: `${matchedChapter.name} ka 1-Page Summary complete ho gaya! App lockdown release ho gaya hai.`,
      };
    }
  }

  // 3. Detect study hours
  const hoursMatch = lower.match(/(\d+(\.\d+)?)\s*(ghante|ghanta|hr|hrs|hour|hours)/);
  if (hoursMatch) {
    const hrs = parseFloat(hoursMatch[1]);
    if (!isNaN(hrs) && hrs > 0 && hrs <= 16) {
      actions.push({
        type: 'LOG_HOURS',
        hours: hrs,
      });
    }
  }

  // 4. Detect questions solved
  const quesMatch = lower.match(/(\d+)\s*(questions|ques|question|q|problem|problems)/);
  if (quesMatch) {
    const qCount = parseInt(quesMatch[1], 10);
    if (!isNaN(qCount) && qCount > 0 && qCount <= 200) {
      const subj: SubjectType = matchedChapter?.subject || (lower.includes('chem') ? 'Chemistry' : lower.includes('math') ? 'Math' : 'Physics');
      actions.push({
        type: 'LOG_QUESTIONS',
        subject: subj,
        count: qCount,
      });
    }
  }

  // 5. Detect if asking what is pending ("kya baki hai", "pending", "status", "batao")
  const isAskingPending =
    lower.includes('baki') ||
    lower.includes('baaki') ||
    lower.includes('pending') ||
    lower.includes('kya kya') ||
    lower.includes('status') ||
    lower.includes('karna hai');

  todayGoals.forEach((g) => {
    if (!g.completed) {
      pendingSummary.push(`[Aaj ka Goal] ${g.subject}: ${g.chapterName} (${g.milestoneTitle})`);
    }
  });

  // 6. Check Punishment enforcement condition
  if (overdueViolations.length > 0 && !milestonesToMark.includes('conclusion1Page')) {
    punishmentEvent = {
      activate: true,
      release: false,
      reason: `Warning: ${overdueViolations[0].chapter.name} ka Theory kiya hua hai par 1-Page Summary 24h se pending hai! Strict mode active hai.`,
    };
  }

  // Generate friendly mentor reply
  let reply = '';
  if (actions.length > 0) {
    reply = `Shabash Super-50 Aspirant! 🎉\nMaine aapki progress automatically mark kar di hai:`;
    actions.forEach((a) => {
      if (a.type === 'MARK_MILESTONE') {
        reply += `\n• Chapter: ${a.chapterName} -> [${a.milestones?.join(', ')}] MARKED DONE! ✅`;
      } else if (a.type === 'LOG_QUESTIONS') {
        reply += `\n• +${a.count} Questions logged to ${a.subject} practice quota! 🎯`;
      } else if (a.type === 'LOG_HOURS') {
        reply += `\n• +${a.hours} Study Hours successfully logged! ⏱️`;
      }
    });
  } else if (isAskingPending) {
    reply = `Aapka current preparation status aur pending tasks ye rahe:\n`;
  } else {
    reply = `Namaste Super-50 Aspirant! Main aapka personal Gemini AI Mentor hoon. Aap mujhe voice ya text me bata sakte hain ki aaj aapne kya complete kiya, main automatically progress mark kar dunga.`;
  }

  if (pendingSummary.length > 0 && (isAskingPending || actions.length > 0)) {
    reply += `\n\n📌 Abhi ye pending tasks baki hain:`;
    pendingSummary.forEach((p) => {
      reply += `\n• ${p}`;
    });
  }

  if (punishmentEvent.activate) {
    reply += `\n\n🚨 DHYAN DEIN: Punishment Lockdown mode active hai! YouTube aur Chrome browser tab tak block rahenge jab tak aap 1-Page Summary complete nahi karte!`;
  } else if (punishmentEvent.release) {
    reply += `\n\n✨ Badhai ho! 1-Page Summary submit hone par Punishment Lockdown successfully release kar diya gaya hai.`;
  }

  return {
    reply,
    actions,
    pendingSummary,
    punishmentEvent,
  };
}
