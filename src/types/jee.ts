export type SubjectType = 'Physics' | 'Chemistry' | 'Math';

export type ChemBranch = 'Physical' | 'Inorganic' | 'Organic';

export type MilestoneKey =
  | 'theory'
  | 'conclusion1Page'
  | 'mathongo'
  | 'moduleEx2'
  | 'eklavya'
  | 'prevPartTest';

export interface MilestoneInfo {
  key: MilestoneKey;
  label: string;
  shortLabel: string;
  description: string;
  estimatedMinutes: number;
}

export const MILESTONES: MilestoneInfo[] = [
  {
    key: 'theory',
    label: 'Theory & Lecture Notes',
    shortLabel: 'Theory',
    description: 'Complete concept lectures, class notes, and derivation mastery',
    estimatedMinutes: 90,
  },
  {
    key: 'conclusion1Page',
    label: '1-Page Short Conclusion',
    shortLabel: '1-Page Summary',
    description: 'Single-page formula cheatsheet, key reactions, and vital traps',
    estimatedMinutes: 45,
  },
  {
    key: 'mathongo',
    label: 'MathonGo Concept Builder',
    shortLabel: 'MathonGo',
    description: 'Solve core concept builder questions for speed & accuracy',
    estimatedMinutes: 60,
  },
  {
    key: 'moduleEx2',
    label: 'Module Exercise-2',
    shortLabel: 'Module Ex-2',
    description: 'Advanced drill questions from coaching module (JEE Main+)',
    estimatedMinutes: 75,
  },
  {
    key: 'eklavya',
    label: 'EKLAVYA Batch Problems',
    shortLabel: 'EKLAVYA',
    description: 'High-difficulty multi-concept problems (JEE Advanced level)',
    estimatedMinutes: 90,
  },
  {
    key: 'prevPartTest',
    label: 'Previous Part TEST',
    shortLabel: 'Part Test Drill',
    description: 'Solve past test series paper questions 1 day before test',
    estimatedMinutes: 60,
  },
];

export interface ChapterProgress {
  theory: boolean;
  conclusion1Page: boolean;
  mathongo: boolean;
  moduleEx2: boolean;
  eklavya: boolean;
  prevPartTest: boolean;
  theoryCompletedDate?: string;
  conclusion1PageCompletedDate?: string;
  notes?: string;
  mathongoSolved?: number;
  moduleEx2Solved?: number;
  eklavyaSolved?: number;
  lastUpdated?: string;
  confidenceRating?: 1 | 2 | 3 | 4 | 5; // 1-5 scale
}

export interface Chapter {
  id: string;
  name: string;
  subject: SubjectType;
  chemBranch?: ChemBranch;
  partTestIds: number[]; // e.g. [1, 2] means introduced in PT1, revised in PT2
  introducedInTest: number; // which Part Test it was first introduced
  isAdvOnly?: boolean;
  keyTopics?: string[];
}

export interface TestSchedule {
  id: string;
  testNumber: number;
  type: 'part' | 'full';
  name: string; // "PART TEST-1", "FULL TEST-2"
  date: string; // YYYY-MM-DD (e.g. "2026-10-04")
  pattern: string; // "JEE MAIN & JEE ADV" or "JEE MAIN"
  mode: 'Offline' | 'CBT';
  physicsSyllabus: string;
  mathSyllabus: string;
  pChemSyllabus: string;
  iChemSyllabus?: string;
  oChemSyllabus?: string;
  advSpecific?: string;
  cumulativeNotes?: string;
}

export type AlertSlotKey = 'morning' | 'afternoon' | 'evening';
export type EnergyLevel = 'High' | 'Medium' | 'Low';

export interface UserEnergyProfile {
  peakAlertSlot: AlertSlotKey; // 'morning' | 'afternoon' | 'evening'
  prioritizeHardestInPeakHours: boolean;
  subjectEnergy: {
    Physics: EnergyLevel;
    Chemistry: EnergyLevel;
    Math: EnergyLevel;
  };
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[]; // 4 options
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  milestoneFocus: string;
  topic?: string;
}

export interface QuizSessionResult {
  id: string;
  chapterId: string;
  chapterName: string;
  subject: SubjectType;
  milestoneKey: MilestoneKey;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface DailyGoalItem {
  id: string;
  subject: SubjectType;
  chemBranch?: ChemBranch;
  chapterId: string;
  chapterName: string;
  milestoneKey: MilestoneKey;
  milestoneTitle: string;
  targetMinutes: number;
  completed: boolean;
  completedAt?: string;
  isPreTestRevision?: boolean; // Scheduled 1 day before test
  customNotes?: string;
  // Subject Energy & Alert Hour Enhancements
  recommendedTimeSlot?: string; // e.g. "🌅 06:00 AM - 10:30 AM (Peak Alert Slot)"
  isHardestChapter?: boolean;
  difficultyRating?: 'High' | 'Medium' | 'Normal';
  targetQuestions?: number; // 25 for Math, 40 for Chemistry, 35 for Physics
  energyAllocated?: EnergyLevel;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  generatedAt: string;
  goals: DailyGoalItem[];
  reflection?: string;
  totalStudyMinutes?: number;
}

export interface MockTestResult {
  id: string;
  testId: string; // References TestSchedule.id
  testName: string;
  date: string;
  physicsScore: number;
  chemScore: number;
  mathScore: number;
  totalScore: number;
  maxMarks: number;
  rank?: number;
  batchRank?: number; // BSEB Super-50 rank
  accuracyPercent?: number;
  sillyMistakesCount?: number;
  weakChapters: string[]; // chapter IDs
  analysisNotes: string;
}

export interface FocusSessionLog {
  id: string;
  timestamp: string;
  chapterId: string;
  chapterName: string;
  subject: SubjectType;
  durationMinutes: number;
  completedGoal: boolean;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'hours' | 'milestones' | 'practice';
  icon: string;
  target: number;
  current: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface DailyQuestionsLog {
  total: number;
  physics: number;
  chemistry: number;
  math: number;
}

export interface PunishmentLockdownState {
  active: boolean;
  reason: string;
  chapterId?: string;
  chapterName?: string;
  triggeredDate?: string;
  penaltyMinutes?: number;
}

export interface MasteryReward {
  id: string;
  title: string;
  description: string;
  costPoints: number;
  type: 'pocket_fm' | 'youtube' | 'game' | 'gemini_mock_summary' | 'chrome';
  durationMinutes: number;
  icon: string;
  badgeText?: string;
}

export interface ActiveRewardPass {
  id: string;
  rewardId: string;
  title: string;
  type: 'pocket_fm' | 'youtube' | 'game' | 'gemini_mock_summary' | 'chrome';
  durationMinutes: number;
  activatedAt: string; // ISO string
  expiresAt: string; // ISO string
  remainingSeconds: number;
  appName?: string;
}

export interface AndroidPermissionConfig {
  id: string;
  name: string;
  permissionKey: string;
  intentAction: string;
  description: string;
  requiredFor: string;
  granted: boolean;
  isCritical: boolean;
}

export interface BlockedAppConfig {
  id: string;
  appName: string;
  packageName: string;
  category: 'audio' | 'video' | 'browser' | 'games' | 'social';
  isBlockedByDefault: boolean;
  allowedWithPassType?: 'pocket_fm' | 'youtube' | 'game' | 'chrome';
  icon: string;
  playStoreUrl?: string;
  launchUrlScheme?: string;
}

export interface UserStudyState {
  currentSimulatedDate: string; // Default '2026-09-27'
  chapterProgress: Record<string, ChapterProgress>;
  dailyPlans: Record<string, DailyPlan>;
  mockResults: MockTestResult[];
  dailyStreak: number;
  lastActiveDate: string;
  studyHoursLoggedTotal: number;
  focusLogs?: FocusSessionLog[];
  dailyStudyHours?: Record<string, number>; // date -> hours (e.g. '2026-09-27': 8.5)
  targetDailyStudyHours?: number; // Customizable daily target hours (default 8.0, total time must be completed)
  dailyQuestionsSolved?: Record<string, DailyQuestionsLog>; // date -> { total, physics, chemistry, math }
  unlockedBadgeIds?: string[];
  punishmentLockdown?: PunishmentLockdownState;
  energyProfile?: UserEnergyProfile;
  quizHistory?: QuizSessionResult[];
  // Game-like Rewards & Android App Blocker
  masteryPoints?: number; // JEE Mastery Points earned for completing goals/hours
  activeRewardPasses?: ActiveRewardPass[];
  androidPermissions?: Record<string, boolean>;
  blockedAppList?: BlockedAppConfig[];
}
