'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  {
    href: '/memory',
    label: 'Memory',
    icon: Brain,
    description: 'Explore your memory cloud',
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: MessageSquare,
    description: 'Talk to your agents',
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Nexus Cloud
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-lg bg-white/10 border border-white/20"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User/Status Area */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white">
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
