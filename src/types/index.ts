export interface WordSet {
  id?: number;
  name: string;
  languageA: string;
  languageB: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordPair {
  id?: number;
  setId: number;
  termA: string;
  termB: string;
  easeFactor: number;
  interval: number;
  nextReview: Date;
  correctCount: number;
  incorrectCount: number;
  lastPractice?: Date;
}

export interface PracticeSession {
  id?: number;
  setId: number;
  mode: PracticeMode;
  startedAt: Date;
  completedAt?: Date;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  reviewedPairs: ReviewedPair[];
}

export interface ReviewedPair {
  pairId: number;
  termA: string;
  termB: string;
  userAnswer?: string;
  correct: boolean;
  timeSpent?: number;
}

export type PracticeMode = 'flashcard' | 'typing' | 'multiple-choice' | 'quick';

export interface Language {
  code: string;
  name: string;
  tesseractCode: string;
  speechCode: string;
}

export interface OcrResult {
  text: string;
  confidence: number;
  lines: OcrLine[];
}

export interface OcrLine {
  text: string;
  confidence: number;
  words: OcrWord[];
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface ParsedWordPair {
  termA: string;
  termB: string;
  confidence: number;
  line: number;
}

export interface PracticeConfig {
  mode: PracticeMode;
  direction: 'a-to-b' | 'b-to-a' | 'random';
  showProgress: boolean;
  enableSpeech: boolean;
}

export interface SpacedRepetitionResult {
  easeFactor: number;
  interval: number;
  nextReview: Date;
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
