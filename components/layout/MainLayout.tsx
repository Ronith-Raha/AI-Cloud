'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { VoiceBubble } from '../voice/VoiceBubble';

interface MainLayoutProps {
  children: ReactNode;
  hideNavOnMobile?: boolean;
}

export function MainLayout({ children, hideNavOnMobile = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Desktop Navigation */}
      <Navbar />

      {/* Mobile Navigation - hidden on desktop */}
      {!hideNavOnMobile && <MobileNav />}

      {/* Main Content */}
      <main className="relative z-10 pt-0 md:pt-16 pb-20 md:pb-0">
        {children}
      </main>

      {/* Voice Bubble - desktop only */}
      <VoiceBubble />
    </div>
  );
}
