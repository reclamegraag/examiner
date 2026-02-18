'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, ProgressBar } from '@/components/ui';
import { useSpeech } from '@/hooks';
import { faVolumeHigh, faCheck, faXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordPair, WordSet } from '@/types';

interface FlashcardModeProps {
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

export function FlashcardMode({
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
}: FlashcardModeProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime] = useState(Date.now());
  const { speakText, isSupported } = useSpeech();

  useEffect(() => {
    setIsFlipped(false);
  }, [pair.id]);

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    const timeMs = Date.now() - startTime;
    onAnswer(isCorrect, timeMs);
    onNext();
  };

  const handleSpeak = () => {
    if (isSupported) {
      speakText(question, set.languageA);
    }
  };

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
        {isRetryRound && (
          <p className="text-center text-sm text-warning font-bold mb-2">Herhaling van foute woorden</p>
        )}
        <div className="w-full max-w-sm perspective-1000">
          <motion.div
            className="relative w-full aspect-[4/3] cursor-pointer"
            onClick={!isFlipped ? handleFlip : undefined}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 bg-card border-2 border-border-bold rounded-3xl p-4 flex flex-col items-center justify-center shadow-brutal"
              style={{ backfaceVisibility: 'hidden' }}
            >
              {isSupported && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
                  className="absolute top-3 right-3 p-2 text-muted hover:text-accent transition-colors"
                >
                  <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5" />
                </button>
              )}
              <p className="text-2xl md:text-3xl text-center font-bold">{question}</p>
              <p className="text-sm text-muted mt-2 font-medium bg-background px-3 py-1 rounded-lg border border-border">Tik om te draaien</p>
            </div>

            <div
              className="absolute inset-0 bg-accent-light border-2 border-accent rounded-3xl p-4 flex flex-col items-center justify-center shadow-brutal-accent"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-2xl md:text-3xl text-center font-bold text-accent">{correctAnswer}</p>
            </div>
          </motion.div>
        </div>

        <div className={`w-full max-w-sm mt-4 ${!isFlipped ? 'invisible' : ''}`}>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={() => handleAnswer(false)}
              icon={<FontAwesomeIcon icon={faXmark} />}
            >
              Fout
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
        </div>
      </div>
    </div>
  );
}
