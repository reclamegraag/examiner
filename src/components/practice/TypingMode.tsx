'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, ProgressBar } from '@/components/ui';
import { useSpeech } from '@/hooks';
import { fuzzyMatch, getMatchFeedback } from '@/lib/fuzzy-match';
import { faVolumeHigh, faArrowRight, faArrowLeft, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordPair, WordSet } from '@/types';

interface TypingModeProps {
  pair: WordPair;
  question: string;
  correctAnswer: string;
  onAnswer: (isCorrect: boolean, timeMs?: number) => void;
  onNext: () => void;
  progress: number;
  currentIndex: number;
  totalQuestions: number;
  set: WordSet;
  languageA: string;
  languageB: string;
  isRetryRound?: boolean;
}

export function TypingMode({
  pair,
  question,
  correctAnswer,
  onAnswer,
  onNext,
  progress,
  currentIndex,
  totalQuestions,
  set,
  isRetryRound,
}: TypingModeProps) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string | null } | null>(null);
  const [retypeValue, setRetypeValue] = useState('');
  const [retypeCorrect, setRetypeCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const { speakText, isSupported } = useSpeech();

  useEffect(() => {
    setAnswer('');
    setFeedback(null);
    setRetypeValue('');
    setRetypeCorrect(false);
  }, [pair.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || feedback) return;

    const result = fuzzyMatch(answer, correctAnswer);
    const timeMs = Date.now() - startTime;

    setFeedback({
      isCorrect: result.isExact || result.isAccentMatch || result.isFuzzyMatch,
      message: getMatchFeedback(result, correctAnswer),
    });

    onAnswer(result.isExact || result.isAccentMatch || result.isFuzzyMatch, timeMs);
  };

  const handleRetypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retypeValue.trim()) return;

    const result = fuzzyMatch(retypeValue, correctAnswer);
    if (result.isExact || result.isAccentMatch || result.isFuzzyMatch) {
      setRetypeCorrect(true);
    }
  };

  const handleNext = () => {
    onNext();
  };

  const handleSpeak = () => {
    if (isSupported) {
      speakText(question, set.languageA);
    }
  };

  const isCorrect = feedback?.isCorrect;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/sets/${set.id}`} className="p-2 text-muted hover:text-foreground transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
          </Link>
          <span className="text-sm text-muted font-bold bg-card px-3 py-1 rounded-lg border-2 border-border">
            {isRetryRound && <span className="text-warning mr-1">↻</span>}
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {isRetryRound && (
            <p className="text-center text-sm text-warning font-bold mb-4">Herhaling van foute woorden</p>
          )}
          <div className="text-center mb-8">
            {isSupported && (
              <button
                onClick={handleSpeak}
                className="mb-4 p-2 text-muted hover:text-accent transition-colors"
              >
                <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5" />
              </button>
            )}
            <p className="text-2xl md:text-3xl font-bold">{question}</p>
          </div>

          {!feedback ? (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Typ je antwoord..."
                className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-3 text-center text-lg font-medium focus:outline-none focus:border-accent shadow-brutal-sm"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={!answer.trim()}
                icon={<FontAwesomeIcon icon={faArrowRight} />}
              >
                Controleren
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border-2 ${
                isCorrect ? 'bg-success-light text-success border-success' : 'bg-error-light text-error border-error'
              }`}>
                <FontAwesomeIcon icon={isCorrect ? faCheck : faXmark} className="w-8 h-8" />
              </div>
              {feedback.message && (
                <p className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
                  {feedback.message}
                </p>
              )}
              {!isCorrect && !retypeCorrect && (
                <form onSubmit={handleRetypeSubmit} className="mt-6">
                  <p className="text-sm text-muted mb-2 font-medium">Typ het juiste antwoord over</p>
                  <input
                    type="text"
                    value={retypeValue}
                    onChange={e => setRetypeValue(e.target.value)}
                    className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-3 text-center text-lg font-medium focus:outline-none focus:border-accent shadow-brutal-sm"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    className="w-full mt-3"
                    disabled={!retypeValue.trim()}
                    icon={<FontAwesomeIcon icon={faCheck} />}
                  >
                    Controleren
                  </Button>
                </form>
              )}
              {!isCorrect && retypeCorrect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <p className="text-success font-bold">Goed zo!</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {feedback && (feedback.isCorrect || retypeCorrect) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 pb-8"
        >
          <Button
            size="lg"
            className="w-full max-w-sm mx-auto"
            onClick={handleNext}
            icon={<FontAwesomeIcon icon={faArrowRight} />}
          >
            Volgende
          </Button>
        </motion.div>
      )}
    </div>
  );
}
