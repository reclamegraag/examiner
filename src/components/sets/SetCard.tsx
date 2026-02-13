'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { faArrowRight, faLanguage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { WordSet, WordPair } from '@/types';

interface SetCardProps {
  set: WordSet;
  pairCount: number;
  recentScore?: number;
}

export function SetCard({ set, pairCount, recentScore }: SetCardProps) {
  return (
    <Link href={`/sets/${set.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card hoverable className="group">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate group-hover:text-accent transition-colors">
                {set.name}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted font-medium">
                <FontAwesomeIcon icon={faLanguage} className="w-4 h-4" />
                <span className="bg-background px-2 py-0.5 rounded-md border border-border text-xs font-bold uppercase">
                  {set.languageA} ↔ {set.languageB}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-accent-light border-2 border-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
              <FontAwesomeIcon
                icon={faArrowRight}
                className="w-3.5 h-3.5 text-accent group-hover:text-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t-2 border-border">
            <div className="text-sm">
              <span className="text-muted font-medium">Woorden</span>
              <p className="font-bold text-foreground text-lg">{pairCount}</p>
            </div>
            {recentScore !== undefined && (
              <div className="text-sm">
                <span className="text-muted font-medium">Laatste score</span>
                <p className={`font-bold text-lg ${recentScore >= 70 ? 'text-success' : recentScore >= 50 ? 'text-warning' : 'text-error'}`}>
                  {recentScore}%
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

interface SetCardSkeletonProps {
  count?: number;
}

export function SetCardSkeleton({ count = 1 }: SetCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border-2 border-border-bold rounded-2xl p-5 shadow-brutal animate-pulse">
          <div className="h-5 bg-border rounded w-2/3 mb-3" />
          <div className="h-4 bg-border rounded w-1/2 mb-4" />
          <div className="flex gap-4 pt-4 border-t-2 border-border">
            <div className="h-10 bg-border rounded w-16" />
            <div className="h-10 bg-border rounded w-16" />
          </div>
        </div>
      ))}
    </>
  );
}
