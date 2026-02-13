'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useSpeech } from '@/hooks';
import { faVolumeHigh, faVolumeOff, faMicrophone, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fuzzyMatch } from '@/lib/fuzzy-match';

interface SpeakButtonProps {
  text: string;
  language: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SpeakButton({ text, language, size = 'md' }: SpeakButtonProps) {
  const { speakText, isSpeaking, isSupported } = useSpeech();

  if (!isSupported) return null;

  const handleSpeak = () => {
    if (!isSpeaking) {
      speakText(text, language);
    }
  };

  return (
    <motion.button
      onClick={handleSpeak}
      disabled={isSpeaking}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center justify-center rounded-full bg-card border border-border text-muted hover:text-accent hover:border-accent transition-colors ${
        size === 'sm' ? 'p-2' : size === 'lg' ? 'p-3' : 'p-2.5'
      }`}
    >
      <FontAwesomeIcon 
        icon={isSpeaking ? faVolumeOff : faVolumeHigh} 
        className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}
        spin={isSpeaking}
      />
    </motion.button>
  );
}

interface PronunciationCheckProps {
  targetText: string;
  language: string;
  onSuccess?: () => void;
  onFail?: () => void;
}

export function PronunciationCheck({ targetText, language, onSuccess, onFail }: PronunciationCheckProps) {
  const { startListening, stopListening, isListening, transcript, isRecognitionSupported, error } = useSpeech();
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleStart = () => {
    setResult(null);
    startListening(language);
  };

  const handleCheck = () => {
    if (!transcript) return;
    
    const matchResult = fuzzyMatch(transcript, targetText);
    const isCorrect = matchResult.isExact || matchResult.isAccentMatch || matchResult.isFuzzyMatch;
    
    setResult(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      onSuccess?.();
    } else {
      onFail?.();
    }
  };

  if (!isRecognitionSupported) {
    return (
      <p className="text-sm text-muted">Spraakherkenning wordt niet ondersteund in deze browser</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant={isListening ? 'primary' : 'secondary'}
          onClick={isListening ? stopListening : handleStart}
          icon={<FontAwesomeIcon icon={faMicrophone} />}
        >
          {isListening ? 'Stop' : 'Spreek'}
        </Button>
        
        {transcript && (
          <span className="text-sm text-muted">
            Gehoord: <span className="text-foreground">{transcript}</span>
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {transcript && !result && (
        <Button onClick={handleCheck} icon={<FontAwesomeIcon icon={faCheck} />}>
          Controleren
        </Button>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 ${
            result === 'correct' ? 'text-success' : 'text-error'
          }`}
        >
          <FontAwesomeIcon icon={result === 'correct' ? faCheck : faXmark} />
          <span>{result === 'correct' ? 'Goed zo!' : `Het juiste antwoord is: ${targetText}`}</span>
        </motion.div>
      )}
    </div>
  );
}
