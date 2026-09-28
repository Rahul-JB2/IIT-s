import { QuizQuestion, SubjectType, MilestoneKey } from '../types/jee';
import { getCuratedQuestionsForChapter } from '../data/curatedQuizBank';

export async function fetchPracticeQuiz(
  subject: SubjectType,
  chapterId: string,
  chapterName: string,
  milestoneKey: MilestoneKey
): Promise<QuizQuestion[]> {
  try {
    const res = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        chapterId,
        chapterName,
        milestoneKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions.map((q: any, idx: number) => ({
          id: idx + 1,
          question: q.question || 'Practice Question',
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: ['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? q.correctAnswer : 'A',
          explanation: q.explanation || 'Refer to fundamental formulas and concepts for this topic.',
          difficulty: q.difficulty || 'Medium',
          milestoneFocus: q.milestoneFocus || `${chapterName} • ${milestoneKey}`,
          topic: q.topic || chapterName,
        }));
      }
    }
  } catch (err) {
    console.warn('API quiz generation failed or offline, falling back to curated question bank:', err);
  }

  // Fallback to high-quality curated bank
  return getCuratedQuestionsForChapter(subject, chapterName, milestoneKey);
}
