export function speak(text: string, languageCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode;
    utterance.rate = 0.9;
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

interface SpeechRecognitionInterface {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventInterface) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventInterface) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventInterface {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventInterface {
  error: string;
}

export function getSpeechRecognition(): SpeechRecognitionInterface | null {
  if (typeof window === 'undefined') return null;

  const win = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInterface;
    webkitSpeechRecognition?: new () => SpeechRecognitionInterface;
  };

  const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) return null;

  return new SpeechRecognitionCtor();
}

export function listenForSpeech(
  languageCode: string,
  onResult: (transcript: string) => void,
  onError?: (error: string) => void
): () => void {
  const recognition = getSpeechRecognition();
  
  if (!recognition) {
    onError?.('Speech recognition not supported');
    return () => {};
  }

  recognition.lang = languageCode;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEventInterface) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEventInterface) => {
    onError?.(event.error);
  };

  recognition.start();

  return () => {
    recognition.stop();
  };
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return !!win.SpeechRecognition || !!win.webkitSpeechRecognition;
}
