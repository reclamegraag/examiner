'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Card, CircularProgress } from '@/components/ui';
import { SetCard, SetCardSkeleton } from '@/components/sets';
import { useWordSets, useWordPairs, useAllPracticeSessions } from '@/hooks';
import { faGraduationCap, faPlus, faArrowRight, faBookOpen, faFire, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { sets, isLoading } = useWordSets();
  const { sessions } = useAllPracticeSessions();

  const recentSets = sets.slice(0, 3);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const sessionsThisWeek = sessions.filter(s => new Date(s.startedAt) >= startOfWeek).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-accent rounded-xl border-2 border-border-bold shadow-brutal-sm flex items-center justify-center">
            <FontAwesomeIcon icon={faGraduationCap} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading tracking-tight">
              Examiner
            </h1>
            <p className="text-muted font-medium">
              Leer woordjes met slimme herhaling
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="relative overflow-hidden bg-accent-light !border-accent">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1 text-foreground">Nieuwe set starten</h2>
              <p className="text-muted font-medium">Maak handmatig een set of gebruik je camera</p>
            </div>
            <Link href="/sets/new">
              <Button size="lg" icon={<FontAwesomeIcon icon={faPlus} />}>
                Nieuwe set
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recente sets</h2>
          <Link href="/sets">
            <Button variant="ghost" size="sm">
              Alle sets
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SetCardSkeleton count={3} />
          </div>
        ) : recentSets.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-accent-light rounded-2xl border-2 border-accent mx-auto mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faBookOpen} className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nog geen sets</h3>
            <p className="text-muted mb-4 font-medium">Maak je eerste woordenset om te beginnen met leren</p>
            <Link href="/sets/new">
              <Button icon={<FontAwesomeIcon icon={faPlus} />}>
                Eerste set maken
              </Button>
            </Link>
          </Card>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {recentSets.map(set => (
              <motion.div key={set.id} variants={item}>
                <SetCardWithCount set={set} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {sets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="text-lg font-bold mb-4">Statistieken</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-accent-light rounded-xl p-3 border-2 border-accent/30">
                <div className="w-8 h-8 bg-accent rounded-lg border-2 border-border-bold mx-auto mb-2 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBookOpen} className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{sets.length}</p>
                <p className="text-xs text-muted font-bold uppercase tracking-wide">Sets</p>
              </div>
              <div className="bg-warning-light rounded-xl p-3 border-2 border-warning/30">
                <div className="w-8 h-8 bg-warning rounded-lg border-2 border-border-bold mx-auto mb-2 flex items-center justify-center">
                  <FontAwesomeIcon icon={faFire} className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{sessionsThisWeek}</p>
                <p className="text-xs text-muted font-bold uppercase tracking-wide">Deze week</p>
              </div>
              <div className="bg-success-light rounded-xl p-3 border-2 border-success/30">
                <div className="w-8 h-8 bg-success rounded-lg border-2 border-border-bold mx-auto mb-2 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTrophy} className="w-4 h-4 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                <p className="text-xs text-muted font-bold uppercase tracking-wide">Oefeningen</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function SetCardWithCount({ set }: { set: { id?: number; name: string; languageA: string; languageB: string; createdAt: Date; updatedAt: Date } }) {
  const { pairs } = useWordPairs(set.id);
  return <SetCard set={set} pairCount={pairs.length} />;
}
