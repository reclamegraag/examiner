'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Select } from '@/components/ui';
import { WordPairEditor } from '@/components/sets';
import { useCreateWordSet } from '@/hooks';
import { languages } from '@/lib/languages';
import { getGeminiApiKey } from '@/lib/settings';
import { generateWordPairs, type Difficulty } from '@/lib/gemini-generator';
import { faWandMagicSparkles, faSpinner, faArrowLeft, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Gemiddeld' },
  { value: 'advanced', label: 'Gevorderd' },
];

const countValues = [5, 10, 15, 20, 25, 30, 40, 50];

type Phase = 'config' | 'results';

export default function GeneratePage() {
  const router = useRouter();
  const { create } = useCreateWordSet();

  const [phase, setPhase] = useState<Phase>('config');
  const [theme, setTheme] = useState('');
  const [languageA, setLanguageA] = useState('en');
  const [languageB, setLanguageB] = useState('nl');
  const [count, setCount] = useState('10');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [conjugation, setConjugation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairs, setPairs] = useState<{ termA: string; termB: string }[]>([]);
  const [setName, setSetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const languageOptions = languages.map(l => ({ value: l.code, label: l.name }));
  const itemNoun = conjugation ? 'kaartjes' : 'woordparen';
  const countOptions = countValues.map(n => ({ value: String(n), label: `${n} ${itemNoun}` }));
  const apiKey = typeof window !== 'undefined' ? getGeminiApiKey() : null;

  const langAName = languages.find(l => l.code === languageA)?.name ?? languageA;
  const langBName = languages.find(l => l.code === languageB)?.name ?? languageB;

  const handleGenerate = async () => {
    if (!theme.trim()) return;

    const key = getGeminiApiKey();
    if (!key) {
      setError('Geen Gemini API key gevonden. Stel die eerst in via "Nieuwe set".');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generated = await generateWordPairs(
        key,
        theme.trim(),
        langAName,
        conjugation ? langAName : langBName,
        parseInt(count, 10),
        difficulty,
        { conjugation },
      );

      if (generated.length === 0) {
        setError('Gemini heeft niets gegenereerd. Probeer een ander thema.');
        return;
      }

      setPairs(generated);
      setSetName(
        conjugation
          ? `${theme.trim()} (${langAName} vervoegingen)`
          : `${theme.trim()} (${langAName} → ${langBName})`,
      );
      setPhase('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!setName.trim()) return;
    const validPairs = pairs.filter(p => p.termA.trim() && p.termB.trim());
    if (validPairs.length === 0) return;

    setIsSaving(true);
    try {
      const setId = await create(
        setName.trim(),
        languageA,
        conjugation ? languageA : languageB,
        validPairs,
      );
      router.push(`/sets/${setId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (phase === 'results') {
      setPhase('config');
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <FontAwesomeIcon icon={faRobot} className="text-accent text-xl" />
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Genereer woordenset</h1>
        </div>
        <p className="text-muted">
          Laat Gemini AI een woordenlijst maken op basis van een thema
        </p>
      </motion.div>

      {!apiKey && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-error-light border-2 border-error/30 rounded-xl text-sm text-error font-medium"
        >
          Geen Gemini API key ingesteld. Ga naar{' '}
          <button
            className="underline font-bold"
            onClick={() => router.push('/sets/new')}
          >
            Nieuwe set
          </button>{' '}
          om je key in te stellen.
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <div className="space-y-4">
                <Input
                  label="Thema of onderwerp"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  placeholder="bijv. dieren, eten, vakantie, het lichaam..."
                  onKeyDown={e => e.key === 'Enter' && !isGenerating && theme.trim() && apiKey && handleGenerate()}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label={conjugation ? 'Taal' : 'Van taal'}
                    value={languageA}
                    onChange={e => setLanguageA(e.target.value)}
                    options={languageOptions}
                  />
                  {!conjugation && (
                    <Select
                      label="Naar taal"
                      value={languageB}
                      onChange={e => setLanguageB(e.target.value)}
                      options={languageOptions}
                    />
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl border-2 border-border-bold bg-card px-4 py-3 transition-colors hover:border-accent">
                  <input
                    type="checkbox"
                    checked={conjugation}
                    onChange={e => setConjugation(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-accent cursor-pointer"
                  />
                  <span>
                    <span className="block text-sm font-bold text-foreground">Werkwoordvervoegingen</span>
                    <span className="block text-xs text-muted font-medium">
                      Een kaartje per persoon of tijd, bijvoorbeeld &quot;aller: il&quot; met als antwoord
                      &quot;va&quot;.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label={`Aantal ${itemNoun}`}
                    value={count}
                    onChange={e => setCount(e.target.value)}
                    options={countOptions}
                  />
                  <Select
                    label="Moeilijkheidsgraad"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as Difficulty)}
                    options={difficultyOptions}
                  />
                </div>
              </div>
            </Card>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-error text-sm font-medium"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleBack}>
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Terug
              </Button>
              <Button
                className="flex-1"
                onClick={handleGenerate}
                disabled={!theme.trim() || !apiKey || isGenerating}
                loading={isGenerating}
                icon={isGenerating
                  ? <FontAwesomeIcon icon={faSpinner} spin />
                  : <FontAwesomeIcon icon={faWandMagicSparkles} />
                }
              >
                {isGenerating ? 'Genereren...' : 'Genereer'}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Card>
              <p className="text-sm text-muted mb-4">
                Gemini heeft <strong>{pairs.length} {itemNoun}</strong> gegenereerd over{' '}
                <strong>{theme}</strong>. Pas ze aan als gewenst.
              </p>

              <Input
                label="Naam van de set"
                value={setName}
                onChange={e => setSetName(e.target.value)}
                placeholder="Geef de set een naam"
                className="mb-4"
              />

              <WordPairEditor
                pairs={pairs}
                onChange={setPairs}
                languageA={conjugation ? 'Vraag' : languageA.toUpperCase()}
                languageB={conjugation ? 'Antwoord' : languageB.toUpperCase()}
              />
            </Card>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleBack}>
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Opnieuw instellen
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={
                  !setName.trim() ||
                  pairs.filter(p => p.termA.trim() && p.termB.trim()).length === 0
                }
                loading={isSaving}
              >
                Opslaan
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
