'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Select } from '@/components/ui';
import { WordPairEditor } from '@/components/sets';
import { useCreateWordSet, useOcr, useCamera } from '@/hooks';
import { languages } from '@/lib/languages';
import { faCamera, faKeyboard, faImage, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type InputMode = 'manual' | 'upload' | 'camera';

export default function NewSetPage() {
  const router = useRouter();
  const { create } = useCreateWordSet();
  const { isProcessing, progress, parsedPairs, lowConfidencePairs, error: ocrError, process, reset: resetOcr } = useOcr();
  const { isActive, error: cameraError, start, stop, capture, videoRef } = useCamera();

  const [name, setName] = useState('');
  const [languageA, setLanguageA] = useState('en');
  const [languageB, setLanguageB] = useState('nl');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [pairs, setPairs] = useState<{ termA: string; termB: string }[]>([{ termA: '', termB: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [showOcrResults, setShowOcrResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const languageOptions = languages.map(l => ({ value: l.code, label: l.name }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lang = languages.find(l => l.code === languageA);
    await process(file, lang?.tesseractCode || 'eng');
    setShowOcrResults(true);
  };

  const handleCapture = async () => {
    const blob = await capture();
    if (!blob) return;

    const lang = languages.find(l => l.code === languageA);
    await process(blob, lang?.tesseractCode || 'eng');
    setShowOcrResults(true);
    stop();
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
    if (!name.trim()) return;
    
    const validPairs = pairs.filter(p => p.termA.trim() && p.termB.trim());
    if (validPairs.length === 0) return;

    setIsSaving(true);
    try {
      const setId = await create(name, languageA, languageB, validPairs);
      router.push(`/sets/${setId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

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
          </div>
        </Card>

        <Card>
          <div className="flex gap-2 mb-4">
            <Button
              variant={inputMode === 'manual' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setInputMode('manual'); resetOcr(); }}
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
                  languageA={languageA.toUpperCase()}
                  languageB={languageB.toUpperCase()}
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
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  icon={isProcessing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faImage} />}
                >
                  {isProcessing ? `Verwerken... ${progress}%` : 'Kies afbeelding'}
                </Button>
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
                <Button
                  onClick={handleCapture}
                  disabled={!isActive || isProcessing}
                  loading={isProcessing}
                  icon={<FontAwesomeIcon icon={faCamera} />}
                >
                  {isProcessing ? `Verwerken... ${progress}%` : 'Foto maken'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {showOcrResults && (parsedPairs.length > 0 || lowConfidencePairs.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h3 className="text-lg font-semibold mb-4">OCR Resultaat</h3>
              <p className="text-muted text-sm mb-4">
                {parsedPairs.length} woordparen herkend
                {lowConfidencePairs.length > 0 && `, ${lowConfidencePairs.length} met lage zekerheid`}
              </p>
              <WordPairEditor
                pairs={[...parsedPairs, ...lowConfidencePairs].map(p => ({ termA: p.termA, termB: p.termB }))}
                onChange={(updated) => {
                  setPairs(updated);
                }}
                languageA={languageA.toUpperCase()}
                languageB={languageB.toUpperCase()}
              />
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => { setShowOcrResults(false); resetOcr(); }}>
                  Opnieuw
                </Button>
                <Button onClick={handleOcrConfirm}>
                  Gebruiken
                </Button>
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
            disabled={!name.trim() || pairs.filter(p => p.termA.trim() && p.termB.trim()).length === 0}
            loading={isSaving}
          >
            Opslaan
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
