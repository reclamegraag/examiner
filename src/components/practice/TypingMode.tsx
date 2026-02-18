'use client';

import { useState, useEffect, useRef } from 'react';
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
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; });

  // Auto-advance to next word after correct answer
  useEffect(() => {
    if (feedback?.isCorrect) {
      const timer = setTimeout(() => onNextRef.current(), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Auto-advance after correct retype
  useEffect(() => {
    if (retypeCorrect) {
      const timer = setTimeout(() => onNextRef.current(), 1000);
      return () => clearTimeout(timer);
    }
  }, [retypeCorrect]);

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
  const showFooter = feedback && (feedback.isCorrect || retypeCorrect);

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between mb-1">
        <Link href={`/sets/${set.id}`} className="p-2 text-muted hover:text-foreground transition-colors">
          <FontAwesomeIcon icon={faArrowLeft} className="w-5 h-5" />
        </Link>
        <span className="text-sm text-muted font-bold bg-card px-3 py-1 rounded-lg border-2 border-border">
          {isRetryRound && <span className="text-warning mr-1">↻</span>}
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>
      <ProgressBar value={progress} size="sm" />

      <div className="flex flex-col items-center pt-4">
        <div className="w-full max-w-sm">
          {isRetryRound && (
            <p className="text-center text-sm text-warning font-bold mb-2">Herhaling van foute woorden</p>
          )}
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
          </div>

          <div className={`text-center mb-3 ${!feedback ? 'invisible' : ''}`}>
            {feedback ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2 border-2 ${
                  isCorrect ? 'bg-success-light text-success border-success' : 'bg-error-light text-error border-error'
                }`}>
                  <FontAwesomeIcon icon={isCorrect ? faCheck : faXmark} className="w-7 h-7" />
                </div>
                {feedback.message && (
                  <p className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
                    {feedback.message}
                  </p>
                )}
                {!isCorrect && !retypeCorrect && (
                  <p className="text-sm text-muted mt-2 font-medium">Typ het juiste antwoord over</p>
                )}
                {!isCorrect && retypeCorrect && (
                  <p className="text-success font-bold mt-2">Goed zo!</p>
                )}
              </motion.div>
            ) : (
              <div className="w-14 h-14 mb-2" />
            )}
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
                size="lg"
                className="w-full mt-3"
                disabled={!answer.trim()}
                icon={<FontAwesomeIcon icon={faArrowRight} />}
              >
                Controleren
              </Button>
            </form>
          ) : !isCorrect && !retypeCorrect ? (
            <form onSubmit={handleRetypeSubmit}>
              <input
                type="text"
                value={retypeValue}
                onChange={e => setRetypeValue(e.target.value)}
                placeholder="Typ het juiste antwoord..."
                className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-3 text-center text-lg font-medium focus:outline-none focus:border-accent shadow-brutal-sm"
                autoFocus
              />
              <Button
                type="submit"
                size="lg"
                className="w-full mt-3"
                disabled={!retypeValue.trim()}
                icon={<FontAwesomeIcon icon={faCheck} />}
              >
                Controleren
              </Button>
            </form>
          ) : (
            <div>
              <input
                className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-3 text-center text-lg font-medium invisible"
                tabIndex={-1}
                aria-hidden="true"
              />
              <Button
                size="lg"
                className="w-full mt-3"
                onClick={handleNext}
                icon={<FontAwesomeIcon icon={faArrowRight} />}
              >
                Volgende
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
