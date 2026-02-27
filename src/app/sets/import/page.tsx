'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Button, Card } from '@/components/ui';
import { useCreateWordSet } from '@/hooks';
import { decodeShareData } from '@/lib/share';
import { getLanguageByCode } from '@/lib/languages';

export default function ImportPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = use(searchParams);
  const router = useRouter();
  const { create } = useCreateWordSet();
  const [saving, setSaving] = useState(false);

  const payload = d ? decodeShareData(d) : null;

  if (!payload) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/sets" className="inline-flex items-center text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm">
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
            Terug naar sets
          </Link>

          <Card className="text-center py-12">
            <div className="w-12 h-12 bg-warning-light rounded-xl border-2 border-warning/30 mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6 text-warning" />
            </div>
            <h1 className="text-xl font-bold font-heading mb-2">Ongeldige link</h1>
            <p className="text-muted font-medium mb-6">
              Deze deellink is ongeldig of beschadigd. Vraag de afzender om een nieuwe link.
            </p>
            <Link href="/sets">
              <Button>Naar mijn sets</Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  const langA = getLanguageByCode(payload.a);
  const langB = getLanguageByCode(payload.b);

  const handleSave = async () => {
    setSaving(true);
    try {
      const pairs = payload.p.map(([termA, termB]) => ({ termA, termB }));
      const newId = await create(payload.n, payload.a, payload.b, pairs);
      router.push(`/sets/${newId}`);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/sets" className="inline-flex items-center text-muted hover:text-foreground mb-4 transition-colors font-bold text-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
          Terug naar sets
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold font-heading mb-1 break-words">{payload.n}</h1>
        <p className="text-muted mb-6 font-medium">
          <span className="bg-background px-2 py-0.5 rounded-md border-2 border-border text-xs font-bold uppercase">
            {langA?.name ?? payload.a} → {langB?.name ?? payload.b}
          </span>
          <span className="ml-2 text-sm">{payload.p.length} woordparen</span>
        </p>

        <Card className="mb-6 max-h-80 overflow-y-auto">
          <div className="space-y-2">
            {payload.p.map(([termA, termB], i) => (
              <div key={i} className="flex items-center justify-between bg-background rounded-xl px-4 py-2.5 border-2 border-border">
                <span className="font-medium truncate mr-3">{termA}</span>
                <span className="text-muted truncate">{termB}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Link href="/sets" className="flex-1 min-w-0">
            <Button variant="secondary" size="lg" className="w-full">
              Annuleren
            </Button>
          </Link>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleSave}
            disabled={saving}
            icon={<FontAwesomeIcon icon={faDownload} />}
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
