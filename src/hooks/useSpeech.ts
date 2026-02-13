'use client';

import { useState, useCallback, useEffect } from 'react';
import { speak, stopSpeaking, listenForSpeech, isSpeechSupported, isRecognitionSupported } from '@/lib/speech';

interface UseSpeechReturn {
  isSpeaking: boolean;
  isListening: boolean;
  isSupported: boolean;
  isRecognitionSupported: boolean;
  transcript: string;
  error: string | null;
  speakText: (text: string, languageCode: string) => Promise<void>;
  startListening: (languageCode: string) => void;
  stopListening: () => void;
  stop: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stopListeningFn, setStopListeningFn] = useState<(() => void) | null>(null);

  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(isSpeechSupported());
    setRecognitionSupported(isRecognitionSupported());
  }, []);

  const speakText = useCallback(async (text: string, languageCode: string) => {
    if (!speechSupported) {
      setError('Speech synthesis not supported');
      return;
    }

    setIsSpeaking(true);
    setError(null);

    try {
      await speak(text, languageCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
    } finally {
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  const startListening = useCallback((languageCode: string) => {
    if (!recognitionSupported) {
      setError('Speech recognition not supported');
      return;
    }

    setIsListening(true);
    setTranscript('');
    setError(null);

    const stop = listenForSpeech(
      languageCode,
      (result) => {
        setTranscript(result);
        setIsListening(false);
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    setStopListeningFn(() => stop);
  }, [recognitionSupported]);

  const stopListening = useCallback(() => {
    if (stopListeningFn) {
      stopListeningFn();
      setIsListening(false);
    }
  }, [stopListeningFn]);

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    stopListening();
  }, [stopListening]);

  return {
    isSpeaking,
    isListening,
    isSupported: speechSupported,
    isRecognitionSupported: recognitionSupported,
    transcript,
    error,
    speakText,
    startListening,
    stopListening,
    stop,
  };
}
