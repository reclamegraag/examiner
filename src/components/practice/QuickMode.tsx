'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, ProgressBar, CircularProgress } from '@/components/ui';
import { useSpeech, useUpdateWordPair } from '@/hooks';
import { faVolumeHigh, faArrowLeft, faCheck, faXmark, faRedo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordPair, WordSet, PracticeConfig } from '@/types';

interface QuickModeProps {
  pairs: WordPair[];
  config: PracticeConfig;
  set: WordSet;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function QuickMode({ pairs, config, set }: QuickModeProps) {
  const { update } = useUpdateWordPair();
  const { speakText, isSupported } = useSpeech();

  const [queue, setQueue] = useState<WordPair[]>(() => shuffleArray(pairs));
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  const currentPair = queue[0] || null;
  const isComplete = queue.length === 0;
  const progress = pairs.length > 0 ? (completed.size / pairs.length) * 100 : 0;

  const { question, correctAnswer } = useMemo(() => {
    if (!currentPair) return { question: '', correctAnswer: '' };

    if (config.direction === 'random') {
      return Math.random() > 0.5
        ? { question: currentPair.termA, correctAnswer: currentPair.termB }
        : { question: currentPair.termB, correctAnswer: currentPair.termA };
    }
    return config.direction === 'a-to-b'
      ? { question: currentPair.termA, correctAnswer: currentPair.termB }
      : { question: currentPair.termB, correctAnswer: currentPair.termA };
  }, [currentPair, config.direction]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentPair) return;

    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    if (isCorrect) {
      setCompleted(prev => new Set([...prev, currentPair.id!]));
      setQueue(prev => prev.slice(1));
    } else {
      setQueue(prev => [...prev.slice(1), currentPair]);
    }

    await update(currentPair.id!, {
      correctCount: currentPair.correctCount + (isCorrect ? 1 : 0),
      incorrectCount: currentPair.incorrectCount + (isCorrect ? 0 : 1),
      lastPractice: new Date(),
    });

    setShowAnswer(false);
  };

  const handleReset = () => {
    setQueue(shuffleArray(pairs));
    setCompleted(new Set());
    setShowAnswer(false);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  const handleSpeak = () => {
    if (isSupported) {
      speakText(question, set.languageA);
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="bg-card border-2 border-border-bold rounded-3xl p-8 shadow-brutal inline-block">
            <CircularProgress
              value={completed.size}
              max={pairs.length}
              size={140}
              color="success"
            />
          </div>
          <h2 className="text-2xl font-bold mt-6 mb-2">Alles goed!</h2>
          <p className="text-muted font-medium mb-2">
            {completed.size} van {pairs.length} woorden onder de knie
          </p>
          <p className="text-sm text-muted mb-6 font-medium">
            {sessionStats.correct} goed, {sessionStats.incorrect} fout
          </p>
          <div className="flex flex-wrap gap-3 max-w-xs mx-auto justify-center">
            <Button
              variant="secondary"
              onClick={handleReset}
              icon={<FontAwesomeIcon icon={faRedo} />}
            >
              Opnieuw
            </Button>
            <Link href={`/sets/${set.id}`}>
              <Button>
                Terug
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between mb-1">
        <Link href={`/sets/${set.id}`} className="p-2 text-muted hover:text-foreground transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
        </Link>
        <span className="text-sm text-muted font-bold bg-card px-3 py-1 rounded-lg border-2 border-border">
          {completed.size} / {pairs.length} onder de knie
        </span>
      </div>
      <ProgressBar value={progress} color="success" size="sm" />

      <div className="flex flex-col items-center pt-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            {isSupported && (
              <button
                onClick={handleSpeak}
                className="mb-2 p-2 text-muted hover:text-accent transition-colors"
              >
                <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5" />
              </button>
            )}
            <p className="text-2xl md:text-3xl font-bold">{question}</p>
            <p className="text-sm text-muted mt-2 font-medium">
              <span className="bg-warning-light px-2 py-0.5 rounded-md border border-warning/30 text-warning font-bold">
                {queue.length} resterend
              </span>
            </p>
          </div>

          <div className={`mb-3 ${!showAnswer ? 'invisible' : ''}`}>
            <div className="bg-accent-light border-2 border-accent rounded-2xl p-4 shadow-brutal-sm">
              <p className="text-2xl font-bold text-accent">{showAnswer ? correctAnswer : '\u00A0'}</p>
            </div>
          </div>

          {!showAnswer ? (
            <Button
              size="lg"
              className="w-full"
              onClick={handleShowAnswer}
            >
              Toon antwoord
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1"
                  onClick={() => handleAnswer(false)}
                  icon={<FontAwesomeIcon icon={faXmark} />}
                >
                  Nog niet
                </Button>
                <Button
                  size="lg"
                  className="flex-1 !bg-success !border-border-bold hover:!bg-success/90"
                  onClick={() => handleAnswer(true)}
                  icon={<FontAwesomeIcon icon={faCheck} />}
                >
                  Goed
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
