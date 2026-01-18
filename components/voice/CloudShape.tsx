'use client';

import { useEffect, useMemo } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface CloudShapeProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0-1 normalized audio level
}

export function CloudShape({ isListening, isSpeaking, audioLevel }: CloudShapeProps) {
  const controls = useAnimation();

  // Generate cloud path with variable puffiness
  const generateCloudPath = (puffiness: number, phase: number) => {
    // Cloud shape made of overlapping circles/bumps
    const baseY = 120;
    const width = 160;
    const height = 80;

    // Dynamic offsets based on phase for animation
    const p = phase * 0.1;
    const puff = puffiness;

    // Main cloud body path using bezier curves
    return `
      M 30 ${baseY + Math.sin(p) * 3}
      C 30 ${baseY - 20 + Math.sin(p) * puff}, 50 ${baseY - 40 - puff + Math.cos(p) * 3}, 70 ${baseY - 45 - puff + Math.sin(p + 1) * 3}
      C 75 ${baseY - 70 - puff * 1.2 + Math.cos(p) * 3}, 95 ${baseY - 80 - puff * 1.5 + Math.sin(p + 2) * 3}, 115 ${baseY - 75 - puff * 1.3 + Math.cos(p + 1) * 3}
      C 130 ${baseY - 85 - puff * 1.4 + Math.sin(p) * 3}, 155 ${baseY - 75 - puff * 1.2 + Math.cos(p + 2) * 3}, 165 ${baseY - 55 - puff + Math.sin(p + 1) * 3}
      C 185 ${baseY - 45 - puff * 0.8 + Math.cos(p) * 3}, 195 ${baseY - 25 + Math.sin(p + 2) * 3}, 180 ${baseY + Math.cos(p + 1) * 3}
      C 175 ${baseY + 15 + Math.sin(p) * 2}, 160 ${baseY + 20 + Math.cos(p) * 2}, 140 ${baseY + 18 + Math.sin(p + 1) * 2}
      C 120 ${baseY + 22 + Math.cos(p + 2) * 2}, 90 ${baseY + 20 + Math.sin(p) * 2}, 70 ${baseY + 15 + Math.cos(p + 1) * 2}
      C 50 ${baseY + 18 + Math.sin(p + 2) * 2}, 35 ${baseY + 10 + Math.cos(p) * 2}, 30 ${baseY + Math.sin(p) * 3}
      Z
    `;
  };

  // Animate based on state
  useEffect(() => {
    if (isSpeaking) {
      controls.start({
        scale: [1, 1.08 + audioLevel * 0.15, 1],
        y: [0, -5, 0],
        transition: {
          duration: 0.4,
          repeat: Infinity,
          repeatType: 'reverse',
        },
      });
    } else if (isListening) {
      controls.start({
        scale: [1, 1.03 + audioLevel * 0.1, 1],
        y: [0, -3, 0],
        transition: {
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
        },
      });
    } else {
      controls.start({
        scale: 1,
        y: 0,
        transition: { duration: 0.5 },
      });
    }
  }, [isListening, isSpeaking, audioLevel, controls]);

  // Calculate dynamic puffiness based on audio
  const puffiness = useMemo(() => {
    return 5 + audioLevel * 20;
  }, [audioLevel]);

  return (
    <div className="relative w-72 h-56 flex items-center justify-center">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.4), rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.2), transparent)',
        }}
        animate={{
          scale: isListening || isSpeaking ? [1, 1.15, 1] : 1,
          opacity: isListening || isSpeaking ? [0.4, 0.6, 0.4] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Main cloud shape */}
      <motion.div
        className="relative w-full h-full"
        animate={controls}
      >
        <svg
          viewBox="0 0 200 160"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 8px 32px rgba(168, 85, 247, 0.4))' }}
        >
          <defs>
            {/* Main gradient - logo theme colors */}
            <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop
                offset="0%"
                animate={{
                  stopColor: isSpeaking
                    ? ['#00D4FF', '#A855F7', '#00D4FF']
                    : isListening
                    ? ['#00D4FF', '#EC4899', '#00D4FF']
                    : '#00D4FF',
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.stop
                offset="50%"
                animate={{
                  stopColor: isSpeaking
                    ? ['#A855F7', '#EC4899', '#A855F7']
                    : isListening
                    ? ['#A855F7', '#00D4FF', '#A855F7']
                    : '#A855F7',
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.stop
                offset="100%"
                animate={{
                  stopColor: isSpeaking
                    ? ['#EC4899', '#00D4FF', '#EC4899']
                    : isListening
                    ? ['#EC4899', '#A855F7', '#EC4899']
                    : '#EC4899',
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </linearGradient>

            {/* White highlight gradient */}
            <linearGradient id="cloudHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="cloudGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Inner shadow */}
            <filter id="innerShadow">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="3" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="white" floodOpacity="0.2" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Animated cloud path - main body */}
          <motion.path
            fill="url(#cloudGradient)"
            filter="url(#cloudGlow)"
            animate={{
              d: [
                generateCloudPath(puffiness, 0),
                generateCloudPath(puffiness, Math.PI * 0.5),
                generateCloudPath(puffiness, Math.PI),
                generateCloudPath(puffiness, Math.PI * 1.5),
                generateCloudPath(puffiness, Math.PI * 2),
              ],
            }}
            transition={{
              duration: isSpeaking ? 0.8 : isListening ? 1.5 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Highlight overlay */}
          <motion.path
            fill="url(#cloudHighlight)"
            animate={{
              d: [
                generateCloudPath(puffiness * 0.8, Math.PI),
                generateCloudPath(puffiness * 0.8, Math.PI * 1.5),
                generateCloudPath(puffiness * 0.8, Math.PI * 2),
                generateCloudPath(puffiness * 0.8, Math.PI * 2.5),
                generateCloudPath(puffiness * 0.8, Math.PI * 3),
              ],
            }}
            transition={{
              duration: isSpeaking ? 0.6 : isListening ? 1.2 : 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transform: 'scale(0.85) translate(12px, 8px)' }}
          />
        </svg>

        {/* Center icon/indicator */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-10px' }}>
          <motion.div
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"
            animate={{
              scale: isListening || isSpeaking ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isListening || isSpeaking ? Infinity : 0,
              repeatType: 'reverse',
            }}
          >
            {isSpeaking ? (
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-5 rounded-full bg-white"
                    animate={{
                      scaleY: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            ) : isListening ? (
              <motion.div
                className="w-3 h-3 rounded-full bg-white"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Floating particles when active */}
      {(isListening || isSpeaking) && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0
                  ? 'linear-gradient(135deg, #00D4FF, #A855F7)'
                  : 'linear-gradient(135deg, #A855F7, #EC4899)',
                left: `${20 + i * 12}%`,
                top: '70%',
              }}
              animate={{
                y: [-20, -60 - i * 10, -20],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Ripple effects when speaking */}
      {isSpeaking && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border border-purple-500/20 rounded-full"
              style={{
                borderRadius: '45% 55% 50% 50% / 50% 50% 50% 50%',
              }}
              initial={{ scale: 0.7, opacity: 0.4 }}
              animate={{
                scale: [0.7, 1.3],
                opacity: [0.4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
