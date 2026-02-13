import { vi } from 'vitest';
import 'fake-indexeddb/auto';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockSpeechSynthesis {
  speak = vi.fn();
  cancel = vi.fn();
  getVoices = vi.fn(() => []);
}

class MockSpeechRecognition {
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

Object.defineProperty(window, 'speechSynthesis', {
  value: new MockSpeechSynthesis(),
});

Object.defineProperty(window, 'SpeechRecognition', {
  value: MockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition,
});
