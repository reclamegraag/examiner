'use client';

import { useSearchParams } from 'next/navigation';
import { use, useRef, useEffect, useMemo } from 'react';
import { useWordSet, useWordPairs, usePracticeSession, useUpdateWordPair, useCreatePracticeSession } from '@/hooks';
import { FlashcardMode } from '@/components/practice/FlashcardMode';
import { TypingMode } from '@/components/practice/TypingMode';
import { MultipleChoiceMode } from '@/components/practice/MultipleChoiceMode';
import { QuickMode } from '@/components/practice/QuickMode';
import { CircularProgress } from '@/components/ui';
import { calculateNextReview, getQualityFromCorrect } from '@/lib/spaced-repetition';
import type { PracticeMode, WordPair, PracticeConfig } from '@/types';

export default function PracticeSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setId = parseInt(id);
  const searchParams = useSearchParams();

  const { set } = useWordSet(setId);
  const { pairs } = useWordPairs(setId);
  const { update } = useUpdateWordPair();
  const { create: createSession } = useCreatePracticeSession();

  const mode = (searchParams.get('mode') as PracticeMode) || 'flashcard';
  const direction = (searchParams.get('direction') as 'a-to-b' | 'b-to-a' | 'random') || 'a-to-b';
  const filter = searchParams.get('filter');

  const filteredPairs = useMemo(() => {
    if (filter === 'mistakes') {
      return pairs.filter(p => p.incorrectCount > 0);
    }
    return pairs;
  }, [pairs, filter]);

  const config: PracticeConfig = {
    mode,
    direction,
    showProgress: true,
    enableSpeech: true,
  };

  const {
    currentPair,
    currentIndex,
    totalQuestions,
    reviewedPairs,
    progress,
    isComplete,
    correctCount,
    incorrectCount,
    isRetryRound,
    answer,
    next,
    reset,
    getStats,
  } = usePracticeSession({ pairs: filteredPairs, config });

  const handleAnswer = async (isCorrect: boolean, timeMs?: number) => {
    answer(isCorrect, timeMs);

    if (currentPair) {
      const quality = getQualityFromCorrect(isCorrect, timeMs);
      const srResult = calculateNextReview(quality, currentPair.easeFactor, currentPair.interval);

      await update(currentPair.id!, {
        ...srResult,
        correctCount: currentPair.correctCount + (isCorrect ? 1 : 0),
        incorrectCount: currentPair.incorrectCount + (isCorrect ? 0 : 1),
        lastPractice: new Date(),
      });
    }
  };

  const handleNext = () => {
    next();
  };

  const sessionSaved = useRef(false);

  useEffect(() => {
    if (isComplete && !sessionSaved.current) {
      sessionSaved.current = true;
      const stats = getStats();
      createSession({
        setId,
        mode,
        startedAt: new Date(),
        completedAt: new Date(),
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        incorrectAnswers: stats.incorrect,
        reviewedPairs,
      });
    }
  }, [isComplete]);

  useEffect(() => {
    if (!isComplete) {
      sessionSaved.current = false;
    }
  }, [isComplete]);

  if (!set || pairs.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-muted text-center font-medium">Geen woorden gevonden</p>
      </div>
    );
  }

  if (filteredPairs.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-muted font-medium mb-4">Geen foute woorden gevonden in deze set.</p>
        <a
          href={`/sets/${setId}/practice`}
          className="px-4 py-2.5 bg-accent border-2 border-border-bold text-white rounded-xl font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-block"
        >
          Terug naar instellingen
        </a>
      </div>
    );
  }

  const getQuestionAnswer = (pair: WordPair): { question: string; answer: string } => {
    if (direction === 'random') {
      return Math.random() > 0.5
        ? { question: pair.termA, answer: pair.termB }
        : { question: pair.termB, answer: pair.termA };
    }
    return direction === 'a-to-b'
      ? { question: pair.termA, answer: pair.termB }
      : { question: pair.termB, answer: pair.termA };
  };

  if (isComplete) {
    const stats = getStats();
    const scorePercent = stats.total > 0 ? stats.correct / stats.total : 0;
    const isMistakesMode = filter === 'mistakes';
    const allWordsUrl = `/sets/${setId}/practice/session?${new URLSearchParams({ mode, direction })}`;

    return (
      <div className="max-w-lg mx-auto px-4 py-8 bg-background min-h-screen flex items-center">
        <div className="text-center w-full">
          <div className="bg-card border-2 border-border-bold rounded-3xl p-8 shadow-brutal inline-block mb-6">
            <CircularProgress
              value={stats.correct}
              max={stats.total}
              size={120}
              color={scorePercent >= 0.7 ? 'success' : scorePercent >= 0.5 ? 'warning' : 'error'}
            />
          </div>
          <h2 className="text-2xl font-bold mb-2">Klaar!</h2>
          <p className="text-muted mb-6 font-medium">
            <span className="font-bold text-foreground">{stats.correct}</span> van <span className="font-bold text-foreground">{stats.total}</span> goed ({stats.percentage}%)
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2.5 bg-card border-2 border-border-bold rounded-xl text-foreground font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Opnieuw
              </button>
              <a
                href={`/sets/${setId}`}
                className="flex-1 px-4 py-2.5 bg-accent border-2 border-border-bold text-white rounded-xl font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center"
              >
                Terug
              </a>
            </div>
            {isMistakesMode && (
              <a
                href={allWordsUrl}
                className="px-4 py-2.5 bg-card border-2 border-border-bold rounded-xl text-foreground font-bold shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center"
              >
                Oefen alle woorden
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentPair) return null;

  const { question, answer: correctAnswer } = getQuestionAnswer(currentPair);

  const commonProps = {
    pair: currentPair,
    question,
    correctAnswer,
    onAnswer: handleAnswer,
    onNext: handleNext,
    progress,
    currentIndex,
    totalQuestions,
    set,
    languageA: set.languageA,
    languageB: set.languageB,
    isRetryRound,
  };

  switch (mode) {
    case 'flashcard':
      return <FlashcardMode {...commonProps} />;
    case 'typing':
      return <TypingMode {...commonProps} />;
    case 'multiple-choice':
      return <MultipleChoiceMode {...commonProps} allPairs={pairs} />;
    case 'quick':
      return <QuickMode pairs={filteredPairs} config={config} set={set} />;
    default:
      return <FlashcardMode {...commonProps} />;
  }
}
