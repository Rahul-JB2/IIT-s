import { Chapter, ChapterProgress, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS } from '../data/super50Data';

export interface OverdueSummaryViolation {
  chapter: Chapter;
  theoryCompletedDate: string;
  daysElapsed: number;
}

/**
 * Checks if the student completed Theory on a chapter without writing
 * the mandatory 1-Page Summary conclusion on the same or next day.
 */
export function checkTheorySummaryViolations(
  chapterProgress: UserStudyState['chapterProgress'],
  currentDate: string
): OverdueSummaryViolation[] {
  const violations: OverdueSummaryViolation[] = [];
  const currTime = new Date(currentDate + 'T00:00:00').getTime();

  ALL_CHAPTERS.forEach((ch) => {
    const prog = chapterProgress[ch.id];
    if (!prog) return;

    // If theory is done, but 1-page summary is NOT done
    if (prog.theory && !prog.conclusion1Page) {
      // Use theoryCompletedDate or fallback to 2 days prior to currentDate if not explicitly set
      const theoryDate = prog.theoryCompletedDate || '2026-09-25';
      const theoryTime = new Date(theoryDate + 'T00:00:00').getTime();
      const diffDays = Math.floor((currTime - theoryTime) / (1000 * 60 * 60 * 24));

      // Rule: 1-Page summary must be done today or tomorrow (diffDays <= 1 is permitted; >= 2 is violation!)
      if (diffDays >= 2) {
        violations.push({
          chapter: ch,
          theoryCompletedDate: theoryDate,
          daysElapsed: diffDays,
        });
      }
    }
  });

  return violations;
}
