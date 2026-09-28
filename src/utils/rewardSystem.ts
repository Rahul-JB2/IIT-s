import { MasteryReward, ActiveRewardPass } from '../types/jee';

export const REWARDS_CATALOG: MasteryReward[] = [
  {
    id: 'reward-pocket-fm',
    title: 'Pocket FM Story Pass (15m)',
    description: 'Listen to your favourite audiobook or story episode on Pocket FM guilt-free during study break.',
    costPoints: 50,
    type: 'pocket_fm',
    durationMinutes: 15,
    icon: 'headphones',
    badgeText: '🎧 15 Min Story',
  },
  {
    id: 'reward-pocket-fm-30',
    title: 'Pocket FM Extended Pass (30m)',
    description: 'Extended 30-minute immersive audio story session on Pocket FM after completing tough goals.',
    costPoints: 90,
    type: 'pocket_fm',
    durationMinutes: 30,
    icon: 'headphones',
    badgeText: '🎧 30 Min Story',
  },
  {
    id: 'reward-youtube',
    title: 'YouTube Break Pass (15m)',
    description: 'Watch video songs, educational documentaries, or fun clips on YouTube without lockdown.',
    costPoints: 60,
    type: 'youtube',
    durationMinutes: 15,
    icon: 'play',
    badgeText: '📺 15 Min YouTube',
  },
  {
    id: 'reward-gaming',
    title: 'Phone Gaming Pass (20m)',
    description: 'Unlocks phone games (BGMI, Free Fire, Chess, etc.) for a scheduled 20-minute refreshment match.',
    costPoints: 80,
    type: 'game',
    durationMinutes: 20,
    icon: 'gamepad-2',
    badgeText: '🎮 20 Min Game Time',
  },
  {
    id: 'reward-gemini-mock',
    title: 'Gemini Mock Deep-Dive Summary',
    description: 'Unlock an exclusive AI forensic diagnosis of your mock tests with trap warnings & personalized fixes.',
    costPoints: 40,
    type: 'gemini_mock_summary',
    durationMinutes: 0,
    icon: 'sparkles',
    badgeText: '✨ AI Deep-Dive',
  },
  {
    id: 'reward-chrome',
    title: 'Google Chrome Web Pass (15m)',
    description: '15-minute unblocked research or browsing window in Chrome.',
    costPoints: 30,
    type: 'chrome',
    durationMinutes: 15,
    icon: 'globe',
    badgeText: '🌐 15 Min Web',
  },
];

/**
 * Creates an active reward pass
 */
export function activateRewardPass(reward: MasteryReward): ActiveRewardPass {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (reward.durationMinutes || 15) * 60 * 1000);

  return {
    id: `pass-${Date.now()}`,
    rewardId: reward.id,
    title: reward.title,
    type: reward.type,
    durationMinutes: reward.durationMinutes,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    remainingSeconds: (reward.durationMinutes || 15) * 60,
    appName:
      reward.type === 'pocket_fm'
        ? 'Pocket FM'
        : reward.type === 'youtube'
        ? 'YouTube'
        : reward.type === 'game'
        ? 'Phone Games'
        : reward.type === 'chrome'
        ? 'Google Chrome'
        : 'Gemini AI',
  };
}

/**
 * Checks if a specific pass type is currently active and unexpired
 */
export function isPassActive(
  passes: ActiveRewardPass[] = [],
  passType: 'pocket_fm' | 'youtube' | 'game' | 'chrome' | 'gemini_mock_summary'
): ActiveRewardPass | null {
  const now = Date.now();
  const valid = passes.find(
    (p) => p.type === passType && new Date(p.expiresAt).getTime() > now
  );
  return valid || null;
}

/**
 * Recalculates remaining seconds for all active passes and removes expired ones
 */
export function pruneAndTickPasses(passes: ActiveRewardPass[] = []): ActiveRewardPass[] {
  const now = Date.now();
  return passes
    .map((p) => {
      const remainingMs = new Date(p.expiresAt).getTime() - now;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      return {
        ...p,
        remainingSeconds,
      };
    })
    .filter((p) => p.remainingSeconds > 0);
}
