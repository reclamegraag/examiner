'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import { useWordSet, useWordPairs } from '@/hooks';
import { faPlay, faArrowLeft, faLayerGroup, faKeyboard, faList, faBolt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PracticeMode } from '@/types';

const modes: { id: PracticeMode; name: string; description: string; icon: typeof faLayerGroup }[] = [
  { id: 'flashcard', name: 'Flashcards', description: 'Draai de kaart om en beoordeel jezelf', icon: faLayerGroup },
  { id: 'typing', name: 'Typen', description: 'Typ het juiste antwoord', icon: faKeyboard },
  { id: 'multiple-choice', name: 'Multiple Choice', description: 'Kies uit 4 opties', icon: faList },
  { id: 'quick', name: 'Snelle modus', description: 'Oefen tot alles goed zit', icon: faBolt },
];

export default function PracticeSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setId = parseInt(id);
  const router = useRouter();

  const { set } = useWordSet(setId);
  const { pairs } = useWordPairs(setId);

  const [mode, setMode] = useState<PracticeMode>('flashcard');
  const [direction, setDirection] = useState<'a-to-b' | 'b-to-a' | 'random'>('a-to-b');

  const handleStart = () => {
    const config = new URLSearchParams({
      mode,
      direction,
    });
    router.push(`/sets/${setId}/practice/session?${config}`);
  };

  if (!set) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href={`/sets/${setId}`} className="inline-flex items-center text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
          Terug
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2">{set.name}</h1>
        <p className="text-muted mb-6 font-medium">{pairs.length} woorden om te oefenen</p>

        <Card className="mb-6">
          <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wide">Kies een modus</h3>
          <div className="space-y-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  mode === m.id
                    ? 'border-accent bg-accent-light shadow-brutal-sm'
                    : 'border-border hover:border-border-bold'
                }`}
              >
                <div className={`p-2 rounded-lg border-2 ${mode === m.id ? 'bg-accent border-border-bold text-white' : 'bg-background border-border'}`}>
                  <FontAwesomeIcon icon={m.icon} className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className={`font-bold ${mode === m.id ? 'text-foreground' : 'text-muted'}`}>
                    {m.name}
                  </p>
                  <p className="text-xs text-muted">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wide">Richting</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDirection('a-to-b')}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                direction === 'a-to-b'
                  ? 'border-accent bg-accent-light text-foreground shadow-brutal-sm'
                  : 'border-border text-muted hover:border-border-bold'
              }`}
            >
              {set.languageA.toUpperCase()} → {set.languageB.toUpperCase()}
            </button>
            <button
              onClick={() => setDirection('b-to-a')}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                direction === 'b-to-a'
                  ? 'border-accent bg-accent-light text-foreground shadow-brutal-sm'
                  : 'border-border text-muted hover:border-border-bold'
              }`}
            >
              {set.languageB.toUpperCase()} → {set.languageA.toUpperCase()}
            </button>
            <button
              onClick={() => setDirection('random')}
              className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                direction === 'random'
                  ? 'border-accent bg-accent-light text-foreground shadow-brutal-sm'
                  : 'border-border text-muted hover:border-border-bold'
              }`}
            >
              Willekeurig
            </button>
          </div>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={pairs.length === 0}
          icon={<FontAwesomeIcon icon={faPlay} />}
        >
          Start oefenen
        </Button>
      </motion.div>
    </div>
  );
}
