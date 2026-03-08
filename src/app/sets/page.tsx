'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Modal } from '@/components/ui';
import { SetCard, SetCardSkeleton } from '@/components/sets';
import { useWordSets, useWordPairs, useDeleteWordSet, useCreateWordSet } from '@/hooks';
import { useMergeSets } from '@/hooks/useMergeSets';
import { faPlus, faSearch, faTrash, faWandMagicSparkles, faLink, faObjectGroup, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { decodeShareData } from '@/lib/share';
import { getLanguageByCode } from '@/lib/languages';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function SetsPage() {
  const { sets, isLoading } = useWordSets();
  const { deleteSet } = useDeleteWordSet();
  const { create } = useCreateWordSet();
  const { merge } = useMergeSets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [importModal, setImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  // Merge state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSetIds, setSelectedSetIds] = useState<Set<number>>(new Set());
  const [mergeModal, setMergeModal] = useState(false);
  const [mergeName, setMergeName] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState('');

  const filteredSets = sets.filter(set =>
    set.name.toLowerCase().includes(search.toLowerCase()) ||
    set.languageA.toLowerCase().includes(search.toLowerCase()) ||
    set.languageB.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = async () => {
    setImportError('');
    const match = importUrl.match(/[?&]d=([^&]+)/);
    if (!match) {
      setImportError('Geen geldige deellink. Plak de volledige URL.');
      return;
    }
    const payload = decodeShareData(match[1]);
    if (!payload) {
      setImportError('De link is ongeldig of beschadigd.');
      return;
    }
    setImporting(true);
    try {
      const pairs = payload.p.map(([termA, termB]) => ({ termA, termB }));
      const newId = await create(payload.n, payload.a, payload.b, pairs);
      router.push(`/sets/${newId}`);
    } catch {
      setImportError('Er ging iets mis bij het importeren.');
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteModal.id) {
      await deleteSet(deleteModal.id);
      setDeleteModal({ open: false, id: null });
    }
  };

  const toggleSelectSet = (id: number) => {
    setSelectedSetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const startSelectionMode = () => {
    setSelectionMode(true);
    setSelectedSetIds(new Set());
  };

  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedSetIds(new Set());
  };

  const openMergeModal = () => {
    const selectedSets = sets.filter(s => s.id !== undefined && selectedSetIds.has(s.id));
    const names = selectedSets.map(s => s.name);
    setMergeName(names.join(' + '));
    setMergeError('');
    setMergeModal(true);
  };

  const selectedSets = sets.filter(s => s.id !== undefined && selectedSetIds.has(s.id));
  const languagesMatch = selectedSets.length >= 2 &&
    selectedSets.every(s => s.languageA === selectedSets[0].languageA && s.languageB === selectedSets[0].languageB);

  const handleMerge = async () => {
    if (!mergeName.trim() || selectedSets.length < 2) return;
    if (!languagesMatch) {
      setMergeError('Alle sets moeten dezelfde talen hebben.');
      return;
    }

    setMerging(true);
    try {
      const ids = selectedSets.map(s => s.id!);
      const newId = await merge(mergeName, ids, selectedSets[0].languageA, selectedSets[0].languageB);
      setMergeModal(false);
      setSelectionMode(false);
      setSelectedSetIds(new Set());
      router.push(`/sets/${newId}`);
    } catch {
      setMergeError('Er ging iets mis bij het samenvoegen.');
      setMerging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading">Woordensets</h1>
          <p className="text-muted font-medium">{sets.length} sets</p>
        </div>

        <div className="flex gap-2 items-stretch">
          {selectionMode ? (
            <>
              <Button variant="secondary" onClick={cancelSelectionMode} icon={<FontAwesomeIcon icon={faXmark} />}>
                Annuleren
              </Button>
              <Button
                onClick={openMergeModal}
                disabled={selectedSetIds.size < 2}
                icon={<FontAwesomeIcon icon={faObjectGroup} />}
              >
                Samenvoegen ({selectedSetIds.size})
              </Button>
            </>
          ) : (
            <>
              {sets.length >= 2 && (
                <Button variant="secondary" onClick={startSelectionMode} icon={<FontAwesomeIcon icon={faObjectGroup} />}>
                  <span className="hidden md:inline">Samenvoegen</span>
                </Button>
              )}
              <Button variant="secondary" onClick={() => setImportModal(true)} icon={<FontAwesomeIcon icon={faLink} />}>
                <span className="hidden md:inline">Importeer</span>
              </Button>
              <Link href="/sets/generate" className="flex">
                <Button variant="secondary" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}>
                  <span className="hidden md:inline">Genereer met AI</span>
                </Button>
              </Link>
              <Link href="/sets/new" className="flex">
                <Button icon={<FontAwesomeIcon icon={faPlus} />}>
                  Nieuwe set
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {sets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek sets..."
            icon={<FontAwesomeIcon icon={faSearch} className="w-4 h-4" />}
          />
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SetCardSkeleton count={4} />
        </div>
      ) : filteredSets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-background rounded-2xl border-2 border-border mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faSearch} className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {search ? 'Geen resultaten' : 'Nog geen sets'}
            </h3>
            <p className="text-muted mb-6 font-medium">
              {search
                ? `Geen sets gevonden voor "${search}"`
                : 'Maak je eerste woordenset om te beginnen'
              }
            </p>
            {!search && (
              <Link href="/sets/new">
                <Button icon={<FontAwesomeIcon icon={faPlus} />}>
                  Eerste set maken
                </Button>
              </Link>
            )}
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2"
        >
          <AnimatePresence>
            {filteredSets.map(set => (
              <motion.div
                key={set.id}
                variants={item}
                layout
                className="relative group"
              >
                <SetCardWithCount
                  set={set}
                  selectable={selectionMode}
                  selected={set.id !== undefined && selectedSetIds.has(set.id)}
                  onSelect={() => set.id !== undefined && toggleSelectSet(set.id)}
                />
                {!selectionMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteModal({ open: true, id: set.id! });
                    }}
                    className="absolute top-5 right-16 z-10 p-2 rounded-lg bg-error-light text-error border-2 border-error opacity-0 group-hover:opacity-100 transition-opacity shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Set verwijderen?"
        size="sm"
      >
        <p className="text-muted mb-6 font-medium">
          Weet je zeker dat je deze set wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteModal({ open: false, id: null })}
          >
            Annuleren
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleDelete}
          >
            Verwijderen
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={importModal}
        onClose={() => { setImportModal(false); setImportUrl(''); setImportError(''); }}
        title="Set importeren"
        size="sm"
      >
        <p className="text-muted mb-4 font-medium text-sm">
          Plak hier de deellink die je hebt ontvangen.
        </p>
        <input
          value={importUrl}
          onChange={e => { setImportUrl(e.target.value); setImportError(''); }}
          placeholder="https://...?d=..."
          className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent text-sm"
          autoFocus
        />
        {importError && (
          <p className="text-error text-sm font-medium mt-2">{importError}</p>
        )}
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => { setImportModal(false); setImportUrl(''); setImportError(''); }}
          >
            Annuleren
          </Button>
          <Button
            className="flex-1"
            onClick={handleImport}
            disabled={!importUrl.trim() || importing}
          >
            {importing ? 'Importeren...' : 'Importeren'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={mergeModal}
        onClose={() => { setMergeModal(false); setMergeError(''); }}
        title="Sets samenvoegen"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted font-medium mb-2">
              {selectedSets.length} sets geselecteerd:
            </p>
            <ul className="text-sm space-y-1">
              {selectedSets.map(s => (
                <li key={s.id} className="font-medium">{s.name}</li>
              ))}
            </ul>
          </div>

          {!languagesMatch && selectedSets.length >= 2 && (
            <p className="text-error text-sm font-medium">
              Alle sets moeten dezelfde talen hebben om samen te voegen.
            </p>
          )}

          <input
            value={mergeName}
            onChange={e => setMergeName(e.target.value)}
            placeholder="Naam voor samengevoegde set"
            className="w-full bg-card border-2 border-border-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent text-sm"
          />

          <p className="text-xs text-muted">
            Dubbele woordparen worden automatisch samengevoegd. De voortgang van het best bekende paar wordt behouden.
          </p>

          {mergeError && (
            <p className="text-error text-sm font-medium">{mergeError}</p>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => { setMergeModal(false); setMergeError(''); }}
          >
            Annuleren
          </Button>
          <Button
            className="flex-1"
            onClick={handleMerge}
            disabled={!mergeName.trim() || !languagesMatch || merging}
          >
            {merging ? 'Samenvoegen...' : 'Samenvoegen'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SetCardWithCount({
  set,
  selectable,
  selected,
  onSelect,
}: {
  set: { id?: number; name: string; languageA: string; languageB: string; createdAt: Date; updatedAt: Date };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { pairs } = useWordPairs(set.id);
  return (
    <SetCard
      set={set}
      pairCount={pairs.length}
      selectable={selectable}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
