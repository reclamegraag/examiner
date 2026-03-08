'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Select } from '@/components/ui';
import { WordPairEditor } from '@/components/sets';
import { ImagePreviewStack } from '@/components/ocr';
import { useCreateWordSet, useWordSets, useWordPairs, useCamera } from '@/hooks';
import { useMultiImageOcr } from '@/hooks/useMultiImageOcr';
import { languages } from '@/lib/languages';
import { getGeminiApiKey, setGeminiApiKey } from '@/lib/settings';
import { deduplicateWordPairs } from '@/lib/dedup';
import { db } from '@/lib/db';
import { faCamera, faKeyboard, faImage, faSpinner, faKey, faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type InputMode = 'manual' | 'upload' | 'camera';
type TargetMode = 'new' | 'existing';

export default function NewSetPage() {
  const router = useRouter();
  const { create } = useCreateWordSet();
  const { sets } = useWordSets();
  const {
    images, addImages, removeImage,
    isProcessing, progress, currentImageIndex,
    parsedPairs, lowConfidencePairs,
    error: ocrError, processAll, reset: resetOcr,
  } = useMultiImageOcr();
  const { isActive, error: cameraError, start, stop, capture, videoRef } = useCamera();

  const [name, setName] = useState('');
  const [languageA, setLanguageA] = useState('en');
  const [languageB, setLanguageB] = useState('nl');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [targetMode, setTargetMode] = useState<TargetMode>('new');
  const [targetSetId, setTargetSetId] = useState<number | null>(null);
  const [pairs, setPairs] = useState<{ termA: string; termB: string }[]>([{ termA: '', termB: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [apiKey, setApiKeyValue] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasApiKey = typeof window !== 'undefined' && !!getGeminiApiKey();

  const languageOptions = languages.map(l => ({ value: l.code, label: l.name }));

  const targetSet = targetMode === 'existing' && targetSetId
    ? sets.find(s => s.id === targetSetId)
    : null;

  const effectiveLanguageA = targetSet ? targetSet.languageA : languageA;
  const effectiveLanguageB = targetSet ? targetSet.languageB : languageB;

  const setOptions = sets.map(s => ({ value: String(s.id), label: s.name }));

  const applyOcrResults = (result: { valid: typeof parsedPairs; lowConfidence: typeof lowConfidencePairs } | null) => {
    if (!result) return;
    const allPairs = [...result.valid, ...result.lowConfidence].map(p => ({
      termA: p.termA,
      termB: p.termB,
    }));
    if (allPairs.length > 0) {
      setPairs(allPairs);
    }
    setShowOcrResults(true);
  };

  const getOcrLangs = () => {
    const langA = languages.find(l => l.code === effectiveLanguageA);
    const langB = languages.find(l => l.code === effectiveLanguageB);
    const codeA = langA?.tesseractCode || 'eng';
    const codeB = langB?.tesseractCode || 'nld';
    return codeA === codeB ? codeA : `${codeA}+${codeB}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addImages(Array.from(files));
    e.target.value = '';
  };

  const handleCapture = async () => {
    const blob = await capture();
    if (!blob) return;
    addImages([blob]);
  };

  const handleProcessAll = async () => {
    const langAName = languages.find(l => l.code === effectiveLanguageA)?.name || effectiveLanguageA;
    const langBName = languages.find(l => l.code === effectiveLanguageB)?.name || effectiveLanguageB;
    const result = await processAll(getOcrLangs(), langAName, langBName);
    applyOcrResults(result);
  };

  const handleOcrConfirm = () => {
    const allPairs = [...parsedPairs, ...lowConfidencePairs].map(p => ({
      termA: p.termA,
      termB: p.termB,
    }));
    setPairs(allPairs.length > 0 ? allPairs : [{ termA: '', termB: '' }]);
    setShowOcrResults(false);
    setInputMode('manual');
  };

  const handleSave = async () => {
    const validPairs = pairs.filter(p => p.termA.trim() && p.termB.trim());
    if (validPairs.length === 0) return;

    setIsSaving(true);
    try {
      if (targetMode === 'existing' && targetSetId && targetSet) {
        const existingPairs = await db.wordPairs.where('setId').equals(targetSetId).toArray();
        const combined = [
          ...existingPairs.map(p => ({ termA: p.termA, termB: p.termB, correctCount: p.correctCount })),
          ...validPairs.map(p => ({ termA: p.termA, termB: p.termB, correctCount: 0 })),
        ];
        const deduped = deduplicateWordPairs(combined);
        const newPairs = deduped.filter(dp =>
          !existingPairs.some(ep =>
            ep.termA.trim().toLowerCase() === dp.termA.trim().toLowerCase() &&
            ep.termB.trim().toLowerCase() === dp.termB.trim().toLowerCase()
          )
        );

        if (newPairs.length > 0) {
          const now = new Date();
          await db.wordPairs.bulkAdd(
            newPairs.map(p => ({
              setId: targetSetId,
              termA: p.termA,
              termB: p.termB,
              easeFactor: 2.5,
              interval: 0,
              nextReview: now,
              correctCount: 0,
              incorrectCount: 0,
            }))
          );
          await db.wordSets.update(targetSetId, { updatedAt: now });
        }

        router.push(`/sets/${targetSetId}`);
      } else {
        if (!name.trim()) return;
        const setId = await create(name, effectiveLanguageA, effectiveLanguageB, validPairs);
        router.push(`/sets/${setId}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = targetMode === 'existing'
    ? targetSetId !== null && pairs.filter(p => p.termA.trim() && p.termB.trim()).length > 0
    : name.trim() !== '' && pairs.filter(p => p.termA.trim() && p.termB.trim()).length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold font-heading">Nieuwe set</h1>
        <p className="text-muted">Maak handmatig een set of importeer via OCR</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Card>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={targetMode === 'new' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => { setTargetMode('new'); setTargetSetId(null); }}
              >
                Nieuwe set
              </Button>
              <Button
                variant={targetMode === 'existing' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTargetMode('existing')}
                disabled={sets.length === 0}
              >
                Toevoegen aan set
              </Button>
            </div>

            {targetMode === 'existing' ? (
              <Select
                label="Kies set"
                value={targetSetId ? String(targetSetId) : ''}
                onChange={e => setTargetSetId(e.target.value ? Number(e.target.value) : null)}
                options={[{ value: '', label: 'Selecteer een set...' }, ...setOptions]}
              />
            ) : (
              <>
                <Input
                  label="Naam"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="bijv. Engels hoofdstuk 5"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Taal A"
                    value={languageA}
                    onChange={e => setLanguageA(e.target.value)}
                    options={languageOptions}
                  />
                  <Select
                    label="Taal B"
                    value={languageB}
                    onChange={e => setLanguageB(e.target.value)}
                    options={languageOptions}
                  />
                </div>
              </>
            )}

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <FontAwesomeIcon icon={faKey} className="w-3 h-3" />
                {hasApiKey ? 'Gemini AI OCR actief' : 'AI OCR instellen (optioneel)'}
              </button>
              {showApiKey && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted">
                    Gratis Gemini API key van ai.google.dev voor betere OCR herkenning.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      onChange={e => setApiKeyValue(e.target.value)}
                      placeholder={hasApiKey ? '••••••••' : 'Plak je Gemini API key'}
                      type="password"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setGeminiApiKey(apiKey);
                        setApiKeyValue('');
                        setShowApiKey(false);
                      }}
                      disabled={!apiKey.trim()}
                    >
                      Opslaan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex gap-2 mb-4">
            <Button
              variant={inputMode === 'manual' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setInputMode('manual'); resetOcr(); stop(); }}
              icon={<FontAwesomeIcon icon={faKeyboard} />}
            >
              Handmatig
            </Button>
            <Button
              variant={inputMode === 'upload' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setInputMode('upload'); stop(); }}
              icon={<FontAwesomeIcon icon={faImage} />}
            >
              Upload
            </Button>
            <Button
              variant={inputMode === 'camera' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setInputMode('camera'); start(); }}
              icon={<FontAwesomeIcon icon={faCamera} />}
            >
              Camera
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {inputMode === 'manual' && (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WordPairEditor
                  pairs={pairs}
                  onChange={setPairs}
                  languageA={effectiveLanguageA.toUpperCase()}
                  languageB={effectiveLanguageB.toUpperCase()}
                />
              </motion.div>
            )}

            {inputMode === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  icon={<FontAwesomeIcon icon={faImage} />}
                >
                  Kies afbeeldingen
                </Button>

                <ImagePreviewStack
                  images={images}
                  onRemove={removeImage}
                  disabled={isProcessing}
                />

                {images.length > 0 && !isProcessing && (
                  <div className="mt-4">
                    <Button onClick={handleProcessAll} icon={<FontAwesomeIcon icon={faCog} />}>
                      Verwerken ({images.length} afbeelding{images.length !== 1 ? 'en' : ''})
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-4">
                    <p className="text-sm text-muted mb-2">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Afbeelding {currentImageIndex + 1}/{images.length} verwerken... {progress}%
                    </p>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {ocrError && <p className="text-error mt-2 text-sm">{ocrError}</p>}
              </motion.div>
            )}

            {inputMode === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card">
                      <p className="text-error">{cameraError}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleCapture}
                    disabled={!isActive || isProcessing}
                    icon={<FontAwesomeIcon icon={faCamera} />}
                  >
                    Foto maken
                  </Button>
                  {images.length > 0 && !isProcessing && (
                    <Button
                      onClick={() => { stop(); handleProcessAll(); }}
                      icon={<FontAwesomeIcon icon={faCog} />}
                    >
                      Verwerken ({images.length})
                    </Button>
                  )}
                </div>

                <ImagePreviewStack
                  images={images}
                  onRemove={removeImage}
                  disabled={isProcessing}
                />

                {isProcessing && (
                  <div className="mt-4">
                    <p className="text-sm text-muted mb-2">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Afbeelding {currentImageIndex + 1}/{images.length} verwerken... {progress}%
                    </p>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {showOcrResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4">OCR Resultaat</h3>
              {parsedPairs.length > 0 || lowConfidencePairs.length > 0 ? (
                <>
                  <p className="text-muted text-sm mb-4">
                    {parsedPairs.length} woordparen herkend
                    {lowConfidencePairs.length > 0 && `, ${lowConfidencePairs.length} met lage zekerheid`}
                  </p>
                  <WordPairEditor
                    pairs={[...parsedPairs, ...lowConfidencePairs].map(p => ({ termA: p.termA, termB: p.termB }))}
                    onChange={(updated) => {
                      setPairs(updated);
                    }}
                    languageA={effectiveLanguageA.toUpperCase()}
                    languageB={effectiveLanguageB.toUpperCase()}
                  />
                </>
              ) : (
                <p className="text-muted text-sm mb-4">
                  Geen woordparen gevonden. Probeer een andere afbeelding of voer de woorden handmatig in.
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => { setShowOcrResults(false); resetOcr(); }}>
                  Opnieuw
                </Button>
                {(parsedPairs.length > 0 || lowConfidencePairs.length > 0) && (
                  <Button onClick={handleOcrConfirm}>
                    Gebruiken
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.back()}
          >
            Annuleren
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!canSave}
            loading={isSaving}
          >
            {targetMode === 'existing' ? 'Toevoegen' : 'Opslaan'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
