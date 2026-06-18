'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, ProgressBar } from '@/components/ui';
import { useSpeech } from '@/hooks';
import { faVolumeHigh, faArrowLeft, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordPair, WordSet } from '@/types';

interface MultipleChoiceModeProps {
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
  allPairs: WordPair[];
  isRetryRound?: boolean;
}

export function MultipleChoiceMode({
  pair,
  question,
  correctAnswer,
  onAnswer,
  onNext,
  progress,
  currentIndex,
  totalQuestions,
  set,
  allPairs,
  isRetryRound,
}: MultipleChoiceModeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const { speakText, isSupported } = useSpeech();

  // Compute options once per question (pair.id). Intentionally omitting allPairs and
  // correctAnswer from deps: the component is remounted per question via key={questionKey},
  // and allPairs can update reactively (Dexie) after onAnswer saves to the DB which would
  // reshuffle the cards while feedback is still visible.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => {
    const otherAnswers = allPairs
      .filter(p => p.id !== pair.id)
      .map(p => p.termB)
      .filter(a => a !== correctAnswer);

    const shuffled = [...otherAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffled, correctAnswer].sort(() => Math.random() - 0.5);

    return allOptions;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.id]);

  useEffect(() => {
    setSelected(null);
  }, [pair.id]);

  useEffect(() => {
    if (selected === null) return;
    const delay = selected === correctAnswer ? 1500 : 4000;
    const timer = setTimeout(() => {
      onNext();
    }, delay);
    return () => clearTimeout(timer);
  }, [selected, correctAnswer, onNext]);

  const handleSelect = (option: string) => {
    if (selected) return;

    setSelected(option);
    const timeMs = Date.now() - startTime;
    onAnswer(option === correctAnswer, timeMs);
  };

  const handleNext = () => {
    onNext();
  };

  const handleSpeak = () => {
    if (isSupported) {
      speakText(question, set.languageA);
    }
  };

  const isCorrect = selected === correctAnswer;
  const showFeedback = selected !== null;

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
          <div className="text-center mb-3">
            {isSupported && (
              <button
                onClick={handleSpeak}
                className="mb-1 p-2 text-muted hover:text-accent transition-colors"
              >
                <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5" />
              </button>
            )}
            <p className="text-2xl md:text-3xl font-bold">{question}</p>
          </div>

          <div className="space-y-2">
            {options.map((option, index) => {
              const isSelected = selected === option;
              const isCorrectOption = option === correctAnswer;

              let styles = 'bg-card border-border-bold hover:border-accent';
              if (showFeedback) {
                if (isCorrectOption) {
                  styles = 'bg-success-light border-success text-success';
                } else if (isSelected && !isCorrectOption) {
                  styles = 'bg-error-light border-error text-error';
                } else {
                  styles = 'bg-card border-border opacity-50';
                }
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelect(option)}
                  disabled={showFeedback}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all font-medium cursor-pointer ${styles} ${
                    !showFeedback ? 'shadow-brutal-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px]' : ''
                  }`}
                  whileTap={{ scale: showFeedback ? 1 : 0.98 }}
                  animate={showFeedback && isCorrectOption && !isCorrect ? { scale: 1.03 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <span className={showFeedback && isCorrectOption && !isCorrect ? 'text-lg font-bold' : 'text-base'}>{option}</span>
                  {showFeedback && isCorrectOption && (
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 ml-2" />
                  )}
                  {showFeedback && isSelected && !isCorrectOption && (
                    <FontAwesomeIcon icon={faXmark} className="w-4 h-4 ml-2" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-xl border-2 text-center font-bold ${
                isCorrect
                  ? 'bg-success-light border-success text-success'
                  : 'bg-error-light border-error text-error'
              }`}
            >
              {isCorrect ? (
                <p>Goed!</p>
              ) : (
                <>
                  <p>Fout!</p>
                  <p className="mt-1 text-lg">Het juiste antwoord is: <span className="underline">{correctAnswer}</span></p>
                </>
              )}
            </motion.div>
          )}

          <div className={`mt-3 ${!showFeedback ? 'invisible' : ''}`}>
            <Button
              size="lg"
              className="w-full"
              onClick={handleNext}
            >
              {isCorrect ? 'Volgende' : 'Doorgaan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
