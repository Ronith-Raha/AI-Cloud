'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { GraphNode, CATEGORY_COLORS, MEMORY_TYPE_ICONS } from '@/types/nexus';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemoryNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  zoomLevel: 1 | 2 | 3;
  transitionPhase: 'stable' | 'merging' | 'splitting';
  memberCount?: number;  // For category nodes
  onClick: (node: GraphNode) => void;
  onHover: (node: GraphNode | null) => void;
}

export const MemoryNodeComponent = memo(function MemoryNodeComponent({
  node,
  isSelected,
  isHighlighted,
  zoomLevel,
  transitionPhase,
  memberCount,
  onClick,
  onHover,
}: MemoryNodeProps) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };
  const iconName = MEMORY_TYPE_ICONS[node.type] as keyof typeof Icons;
  const Icon = Icons[iconName] as React.ComponentType<{ className?: string }>;

  // Determine visibility based on zoom level and node depth
  const shouldShow = zoomLevel >= (node.depth + 1);
  const baseOpacity = shouldShow ? 1 : 0;
  const opacity = node.deletedAt ? baseOpacity * 0.4 : baseOpacity;

  // Enhanced animation state based on transition phase
  const getAnimationState = () => {
    if (!shouldShow) {
      return transitionPhase === 'merging'
        ? { opacity: 0, scale: 0.3 }  // Shrink toward center
        : { opacity: 0, scale: 0 };
    }
    if (transitionPhase === 'splitting' && node.depth > 0) {
      return { opacity, scale: [0, 1.15, 1] };  // Pop out effect
    }
    return { opacity, scale: 1 };
  };

  const animationState = getAnimationState();

  // Size based on zoom level
  const baseSize = zoomLevel === 1 ? 80 : zoomLevel === 2 ? 50 : 30;
  const size = node.depth === 0 ? baseSize * 1.2 : node.depth === 1 ? baseSize : baseSize * 0.8;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: animationState.opacity,
        scale: animationState.scale,
        x: node.x || 0,
        y: node.y || 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 25,
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 },
      }}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(node)}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Glow effect */}
      <circle
        r={size * 0.8}
        fill={categoryColor.glow}
        filter="url(#glow)"
        className={cn(
          'transition-opacity duration-300',
          isSelected || isHighlighted ? 'opacity-100' : 'opacity-40'
        )}
      />

      {/* Main circle */}
      <circle
        r={size * 0.5}
        fill="rgba(0,0,0,0.8)"
        stroke={categoryColor.base}
        strokeWidth={isSelected ? 3 : 2}
        className={cn(
          'transition-all duration-200',
          isHighlighted && 'stroke-white',
          node.deletedAt && 'opacity-60'
        )}
      />

      {/* Inner gradient */}
      <circle
        r={size * 0.45}
        fill={`url(#gradient-${node.category.toLowerCase()})`}
        opacity={0.3}
      />

      {/* Icon */}
      {Icon && (
        <foreignObject
          x={-size * 0.25}
          y={-size * 0.25}
          width={size * 0.5}
          height={size * 0.5}
          className="pointer-events-none"
        >
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-4 w-4 text-white opacity-80" />
          </div>
        </foreignObject>
      )}

      {/* Label (only at higher zoom levels) */}
      {zoomLevel >= 2 && (
        <text
          y={size * 0.7}
          textAnchor="middle"
          fill="white"
          fontSize={zoomLevel === 3 ? 10 : 8}
          fontWeight="500"
          className="pointer-events-none select-none"
          opacity={0.9}
        >
          {node.summary.length > 20 ? node.summary.slice(0, 20) + '...' : node.summary}
        </text>
      )}

      {/* Category label at zoom level 1 */}
      {zoomLevel === 1 && node.depth === 0 && (
        <text
          y={size * 0.7}
          textAnchor="middle"
          fill={categoryColor.base}
          fontSize={12}
          fontWeight="600"
          className="pointer-events-none select-none"
        >
          {node.category}
        </text>
      )}

      {/* Count badge for category nodes */}
      {node.isGroup && memberCount && memberCount > 0 && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
        >
          <circle
            cx={size * 0.4}
            cy={-size * 0.4}
            r={size * 0.22}
            fill={categoryColor.base}
            stroke="rgba(0,0,0,0.8)"
            strokeWidth={2}
          />
          <text
            x={size * 0.4}
            y={-size * 0.4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="black"
            fontSize={size * 0.18}
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {memberCount > 99 ? '99+' : memberCount}
          </text>
        </motion.g>
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          r={size * 0.65}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeDasharray="4 2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="10s"
            repeatCount="indefinite"
          />
        </motion.circle>
      )}
    </motion.g>
  );
});
