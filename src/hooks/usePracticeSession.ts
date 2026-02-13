'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  answer: (isCorrect: boolean, timeHint?: number) => void;
  next: () => void;
  reset: () => void;
  getStats: () => { correct: number; incorrect: number; total: number; percentage: number };
}

export function usePracticeSession({ pairs, config }: UsePracticeSessionProps): UsePracticeSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedPairs, setReviewedPairs] = useState<ReviewedPair[]>([]);
  const [queue, setQueue] = useState<WordPair[]>(() => shuffleArray([...pairs]));

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
  }, [currentPair]);

  const next = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setReviewedPairs([]);
    setQueue(shuffleArray([...pairs]));
  }, [pairs]);

  const getStats = useCallback(() => ({
    correct: correctCount,
    incorrect: incorrectCount,
    total: reviewedPairs.length,
    percentage: reviewedPairs.length > 0 
      ? Math.round((correctCount / reviewedPairs.length) * 100) 
      : 0,
  }), [correctCount, incorrectCount, reviewedPairs.length]);

  return {
    currentPair,
    currentIndex,
    totalQuestions,
    reviewedPairs,
    progress,
    isComplete,
    correctCount,
    incorrectCount,
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
