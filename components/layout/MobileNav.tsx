'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, Brain, MessageSquare, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-t border-white/10" />

      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-4 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isVoice = item.href === '/voice';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                isActive ? 'text-white' : 'text-white/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className={cn(
                    'absolute inset-0 rounded-xl',
                    isVoice
                      ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-purple-500/30'
                      : 'bg-white/10 border border-white/20'
                  )}
                  transition={{ type: 'spring', duration: 0.4 }}
                />
              )}

              {/* Special styling for voice button */}
              {isVoice ? (
                <div className={cn(
                  'relative p-2 rounded-full transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500'
                    : 'bg-white/10'
                )}>
                  <Icon className="relative w-5 h-5" />
                </div>
              ) : (
                <Icon className="relative w-5 h-5" />
              )}

              <span className="relative text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
