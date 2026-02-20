'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { faPlus, faTrash, faGripLines, faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordPair } from '@/types';

interface WordPairEditorProps {
  pairs: { termA: string; termB: string }[];
  onChange: (pairs: { termA: string; termB: string }[]) => void;
  languageA: string;
  languageB: string;
  readonly?: boolean;
}

export function WordPairEditor({ pairs, onChange, languageA, languageB, readonly = false }: WordPairEditorProps) {
  const addPair = () => {
    onChange([...pairs, { termA: '', termB: '' }]);
  };

  const updatePair = (index: number, field: 'termA' | 'termB', value: string) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs font-bold text-muted mb-3 px-1 uppercase tracking-wide">
        <span className="flex-1">{languageA}</span>
        <span className="flex-1">{languageB}</span>
        {!readonly && <span className="w-10" />}
      </div>

      <AnimatePresence initial={false}>
        {pairs.map((pair, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center text-muted">
              <span className="w-6 h-6 bg-background border-2 border-border rounded-md flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
            </div>

            <Input
              value={pair.termA}
              onChange={e => updatePair(index, 'termA', e.target.value)}
              placeholder={`${languageA} woord`}
              disabled={readonly}
              className="flex-1"
            />

            <Input
              value={pair.termB}
              onChange={e => updatePair(index, 'termB', e.target.value)}
              placeholder={`${languageB} woord`}
              disabled={readonly}
              className="flex-1"
            />

            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePair(index)}
                className="text-error hover:text-error"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {!readonly && (
        <Button
          variant="secondary"
          onClick={addPair}
          className="w-full mt-4"
          icon={<FontAwesomeIcon icon={faPlus} />}
        >
          Woordpaar toevoegen
        </Button>
      )}
    </div>
  );
}

interface WordPairRowProps {
  pair: WordPair;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WordPairRow({ pair, onEdit, onDelete }: WordPairRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group flex items-center justify-between p-3 bg-card rounded-xl border-2 border-border hover:border-border-bold transition-colors"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className="text-foreground font-medium truncate">{pair.termA}</span>
        <span className="text-accent font-bold">→</span>
        <span className="text-foreground font-medium truncate">{pair.termB}</span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-md font-bold border ${
          pair.correctCount > pair.incorrectCount ? 'bg-success-light text-success border-success/30' :
          pair.correctCount < pair.incorrectCount ? 'bg-error-light text-error border-error/30' :
          'bg-background text-muted border-border'
        }`}>
          {pair.correctCount}/{pair.correctCount + pair.incorrectCount}
        </span>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-muted hover:text-accent rounded-lg hover:bg-accent-light transition-colors"
                aria-label="Woordpaar bewerken"
              >
                <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error-light transition-colors"
                aria-label="Woordpaar verwijderen"
              >
                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
