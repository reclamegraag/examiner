'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, Modal, ProgressBar } from '@/components/ui';
import { WordPairEditor, WordPairRow } from '@/components/sets';
import { useWordSet, useWordPairs, useUpdateWordSet, useDeleteWordSet, useAddWordPair, useDeleteWordPair } from '@/hooks';
import { faPlay, faEdit, faTrash, faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const setId = parseInt(id);
  const router = useRouter();

  const { set } = useWordSet(setId);
  const { pairs } = useWordPairs(setId);
  const { update } = useUpdateWordSet();
  const { deleteSet } = useDeleteWordSet();
  const { add } = useAddWordPair();
  const { deletePair } = useDeleteWordPair();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newPair, setNewPair] = useState({ termA: '', termB: '' });

  const handleStartEdit = () => {
    if (set) {
      setEditName(set.name);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (set && editName.trim()) {
      await update(set.id!, { name: editName });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteSet(setId);
    router.push('/sets');
  };

  const handleAddPair = async () => {
    if (newPair.termA.trim() && newPair.termB.trim()) {
      await add(setId, newPair.termA, newPair.termB);
      setNewPair({ termA: '', termB: '' });
      setAddModal(false);
    }
  };

  if (!set) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3" />
          <div className="h-4 bg-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  const stats = {
    total: pairs.length,
    mastered: pairs.filter(p => p.correctCount > 0 && p.correctCount > p.incorrectCount).length,
    learning: pairs.filter(p => p.correctCount === 0).length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/sets" className="inline-flex items-center text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
          Terug naar sets
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            {isEditing ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="text-2xl md:text-3xl font-bold font-heading bg-transparent border-b-2 border-accent focus:outline-none"
                autoFocus
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold font-heading">{set.name}</h1>
            )}
            <p className="text-muted mt-1 font-medium">
              <span className="bg-background px-2 py-0.5 rounded-md border-2 border-border text-xs font-bold uppercase">
                {set.languageA} → {set.languageB}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <Button size="sm" onClick={handleSaveEdit}>Opslaan</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteModal(true)} className="text-error">
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-background rounded-xl p-3 border-2 border-border">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted font-bold uppercase tracking-wide">Woorden</p>
            </div>
            <div className="bg-success-light rounded-xl p-3 border-2 border-success/30">
              <p className="text-2xl font-bold text-success">{stats.mastered}</p>
              <p className="text-xs text-muted font-bold uppercase tracking-wide">Gekend</p>
            </div>
            <div className="bg-warning-light rounded-xl p-3 border-2 border-warning/30">
              <p className="text-2xl font-bold text-warning">{stats.learning}</p>
              <p className="text-xs text-muted font-bold uppercase tracking-wide">Nieuw</p>
            </div>
          </div>
          {stats.total > 0 && (
            <div className="mt-4">
              <ProgressBar
                value={stats.mastered}
                max={stats.total}
                color="success"
                size="sm"
              />
            </div>
          )}
        </Card>

        <div className="flex gap-3 mb-6">
          <Link href={`/sets/${setId}/practice`} className="flex-1">
            <Button size="lg" className="w-full" icon={<FontAwesomeIcon icon={faPlay} />}>
              Start oefenen
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setAddModal(true)}
            icon={<FontAwesomeIcon icon={faPlus} />}
          />
        </div>

        <div className="space-y-2">
          {pairs.map(pair => (
            <WordPairRow key={pair.id} pair={pair} />
          ))}
        </div>

        {pairs.length === 0 && (
          <Card className="text-center py-12">
            <div className="w-12 h-12 bg-accent-light rounded-xl border-2 border-accent mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faPlus} className="w-6 h-6 text-accent" />
            </div>
            <p className="text-muted mb-4 font-medium">Nog geen woorden in deze set</p>
            <Button onClick={() => setAddModal(true)} icon={<FontAwesomeIcon icon={faPlus} />}>
              Woord toevoegen
            </Button>
          </Card>
        )}
      </motion.div>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Set verwijderen?" size="sm">
        <p className="text-muted mb-6 font-medium">
          Weet je zeker dat je &quot;{set.name}&quot; wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteModal(false)}>
            Annuleren
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            Verwijderen
          </Button>
        </div>
      </Modal>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Woord toevoegen">
        <div className="space-y-4">
          <input
            value={newPair.termA}
            onChange={e => setNewPair(p => ({ ...p, termA: e.target.value }))}
            placeholder={set.languageA.toUpperCase()}
            className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent"
          />
          <input
            value={newPair.termB}
            onChange={e => setNewPair(p => ({ ...p, termB: e.target.value }))}
            placeholder={set.languageB.toUpperCase()}
            className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={() => setAddModal(false)}>
            Annuleren
          </Button>
          <Button
            className="flex-1"
            onClick={handleAddPair}
            disabled={!newPair.termA.trim() || !newPair.termB.trim()}
          >
            Toevoegen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
