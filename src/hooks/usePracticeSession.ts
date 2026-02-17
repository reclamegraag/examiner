'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { WordPair, PracticeMode, ReviewedPair, PracticeConfig } from '@/types';
import { calculateNextReview, getQualityFromCorrect } from '@/lib/spaced-repetition';

interface UsePracticeSessionProps {
  pairs: WordPair[];
  config: PracticeConfig;
}

interface UsePracticeSessionReturn {
  currentPair: WordPair | null;
  currentIndex: number;
  totalQuestions: number;
  reviewedPairs: ReviewedPair[];
  progress: number;
  isComplete: boolean;
  correctCount: number;
  incorrectCount: number;
  isRetryRound: boolean;
  questionKey: number;
  answer: (isCorrect: boolean, timeHint?: number) => void;
  next: () => void;
  reset: () => void;
  getStats: () => { correct: number; incorrect: number; total: number; percentage: number };
}

export function usePracticeSession({ pairs, config }: UsePracticeSessionProps): UsePracticeSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedPairs, setReviewedPairs] = useState<ReviewedPair[]>([]);
  const [queue, setQueue] = useState<WordPair[]>(() => shuffleArray([...pairs]));
  const [isRetryRound, setIsRetryRound] = useState(false);
  const [firstRoundStats, setFirstRoundStats] = useState<{ correct: number; incorrect: number; total: number } | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const incorrectInRound = useRef<Set<number>>(new Set());
  const roundStats = useRef({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (pairs.length > 0 && queue.length === 0) {
      setQueue(shuffleArray([...pairs]));
    }
  }, [pairs]);

  const currentPair = queue[currentIndex] || null;
  const totalQuestions = queue.length;
  const progress = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;
  const isComplete = currentIndex >= totalQuestions;

  const correctCount = reviewedPairs.filter(r => r.correct).length;
  const incorrectCount = reviewedPairs.filter(r => !r.correct).length;

  const answer = useCallback((isCorrect: boolean, timeHint?: number) => {
    if (!currentPair) return;

    const reviewed: ReviewedPair = {
      pairId: currentPair.id!,
      termA: currentPair.termA,
      termB: currentPair.termB,
      correct: isCorrect,
      timeSpent: timeHint,
    };

    setReviewedPairs(prev => [...prev, reviewed]);

    if (isCorrect) {
      roundStats.current.correct++;
    } else {
      roundStats.current.incorrect++;
      incorrectInRound.current.add(currentPair.id!);
    }
  }, [currentPair]);

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length && incorrectInRound.current.size > 0) {
      if (!isRetryRound) {
        setFirstRoundStats({
          correct: roundStats.current.correct,
          incorrect: roundStats.current.incorrect,
          total: roundStats.current.correct + roundStats.current.incorrect,
        });
      }

      const retryPairs = pairs.filter(p => incorrectInRound.current.has(p.id!));
      incorrectInRound.current = new Set();
      roundStats.current = { correct: 0, incorrect: 0 };
      setQueue(shuffleArray(retryPairs));
      setCurrentIndex(0);
      setIsRetryRound(true);
      setQuestionKey(prev => prev + 1);
      return;
    }

    setCurrentIndex(nextIndex);
    setQuestionKey(prev => prev + 1);
  }, [currentIndex, queue.length, pairs, isRetryRound]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setReviewedPairs([]);
    setQueue(shuffleArray([...pairs]));
    setIsRetryRound(false);
    setFirstRoundStats(null);
    setQuestionKey(0);
    incorrectInRound.current = new Set();
    roundStats.current = { correct: 0, incorrect: 0 };
  }, [pairs]);

  const getStats = useCallback(() => {
    if (firstRoundStats) {
      return {
        ...firstRoundStats,
        percentage: firstRoundStats.total > 0
          ? Math.round((firstRoundStats.correct / firstRoundStats.total) * 100)
          : 0,
      };
    }
    return {
      correct: correctCount,
      incorrect: incorrectCount,
      total: reviewedPairs.length,
      percentage: reviewedPairs.length > 0
        ? Math.round((correctCount / reviewedPairs.length) * 100)
        : 0,
    };
  }, [correctCount, incorrectCount, reviewedPairs.length, firstRoundStats]);

  return {
    currentPair,
    currentIndex,
    totalQuestions,
    reviewedPairs,
    progress,
    isComplete,
    correctCount,
    incorrectCount,
    isRetryRound,
    questionKey,
    answer,
    next,
    reset,
    getStats,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useQuickMode(pairs: WordPair[]) {
  const [queue, setQueue] = useState<WordPair[]>(() => shuffleArray([...pairs]));
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState<WordPair[]>([]);

  const currentPair = queue[0] || null;
  const isComplete = queue.length === 0 && mistakes.length === 0;
  const progress = pairs.length > 0 ? (completed.size / pairs.length) * 100 : 0;

  const answer = useCallback((isCorrect: boolean) => {
    if (!currentPair) return;

    if (isCorrect) {
      setCompleted(prev => new Set([...prev, currentPair.id!]));
      setQueue(prev => prev.slice(1));
    } else {
      setMistakes(prev => [...prev, currentPair]);
      setQueue(prev => [...prev.slice(1), currentPair]);
    }
  }, [currentPair]);

  const reset = useCallback(() => {
    setQueue(shuffleArray([...pairs]));
    setCompleted(new Set());
    setMistakes([]);
  }, [pairs]);

  return {
    currentPair,
    isComplete,
    progress,
    completed: completed.size,
    total: pairs.length,
    answer,
    reset,
  };
}
