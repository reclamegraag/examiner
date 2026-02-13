'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { faGraduationCap, faFolderOpen, faPlus, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const navItems = [
  { href: '/', label: 'Dashboard', icon: faChartLine },
  { href: '/sets', label: 'Sets', icon: faFolderOpen },
  { href: '/sets/new', label: 'Nieuw', icon: faPlus },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-lg border-b-2 border-border-bold z-40">
      <div className="max-w-6xl mx-auto w-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-accent rounded-lg border-2 border-border-bold shadow-brutal-sm flex items-center justify-center group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
            <FontAwesomeIcon icon={faGraduationCap} className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-heading tracking-tight">Examiner</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-accent-light rounded-xl border-2 border-accent"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
