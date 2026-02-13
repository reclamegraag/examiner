'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { faChartLine, faFolderOpen, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const navItems = [
  { href: '/', label: 'Dashboard', icon: faChartLine },
  { href: '/sets', label: 'Sets', icon: faFolderOpen },
  { href: '/sets/new', label: 'Nieuw', icon: faPlus },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-t-2 border-border-bold z-40">
      <div className="h-full flex items-center justify-around px-4">
        {navItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 py-1"
            >
              <div className={`relative p-2 rounded-xl transition-all ${
                isActive ? 'text-accent' : 'text-muted'
              }`}>
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-indicator"
                    className="absolute inset-0 bg-accent-light rounded-xl border-2 border-accent"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5 relative z-10" />
              </div>
              <span className={`text-xs mt-0.5 font-bold ${
                isActive ? 'text-accent' : 'text-muted'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
