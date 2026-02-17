'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Modal } from '@/components/ui';
import { SetCard, SetCardSkeleton } from '@/components/sets';
import { useWordSets, useWordPairs, useDeleteWordSet } from '@/hooks';
import { faPlus, faSearch, faTrash, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  const filteredSets = sets.filter(set =>
    set.name.toLowerCase().includes(search.toLowerCase()) ||
    set.languageA.toLowerCase().includes(search.toLowerCase()) ||
    set.languageB.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteModal.id) {
      await deleteSet(deleteModal.id);
      setDeleteModal({ open: false, id: null });
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

        <div className="flex gap-2">
          <Link href="/sets/generate">
            <Button variant="secondary" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}>
              Genereer met AI
            </Button>
          </Link>
          <Link href="/sets/new">
            <Button icon={<FontAwesomeIcon icon={faPlus} />}>
              Nieuwe set
            </Button>
          </Link>
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
                <SetCardWithCount set={set} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteModal({ open: true, id: set.id! });
                  }}
                  className="absolute top-5 right-5 p-2 rounded-lg bg-error-light text-error border-2 border-error opacity-0 group-hover:opacity-100 transition-opacity shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                </button>
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
    </div>
  );
}

function SetCardWithCount({ set }: { set: { id?: number; name: string; languageA: string; languageB: string; createdAt: Date; updatedAt: Date } }) {
  const { pairs } = useWordPairs(set.id);
  return <SetCard set={set} pairCount={pairs.length} />;
}
