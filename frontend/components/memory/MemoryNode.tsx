'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { GraphNode, CATEGORY_COLORS } from '@/types/nexus';
import { cn } from '@/lib/utils';

// Neuron-inspired color palette - warm pinkish tones like actual neurons
const NEURON_COLORS = {
  core: '#E8B4B8', // Soft pink neuron body
  membrane: '#F5D0D3', // Lighter membrane
  nucleus: '#C9A0A4', // Darker nucleus
  glow: 'rgba(232, 180, 184, 0.5)', // Pink glow
  axon: 'rgba(200, 160, 165, 0.6)', // Connection color
};

interface MemoryNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  zoomLevel: 1 | 2 | 3;
  onClick: (node: GraphNode) => void;
  onHover: (node: GraphNode | null) => void;
}

export const MemoryNodeComponent = memo(function MemoryNodeComponent({
  node,
  isSelected,
  isHighlighted,
  zoomLevel,
  onClick,
  onHover,
}: MemoryNodeProps) {
  const categoryColor = CATEGORY_COLORS[node.category] || { base: '#ffffff', glow: 'rgba(255,255,255,0.6)' };

  // Determine visibility based on zoom level and node depth
  const shouldShow = zoomLevel >= node.depth;
  const opacity = shouldShow ? 1 : 0;
  const scale = shouldShow ? 1 : 0;

  // Use the node's radius directly - it's already calculated based on memory count
  // Apply a multiplier to make size differences more apparent
  const baseRadius = node.radius || 30;
  // depth 0 = category (biggest), depth 1 = subcategory/project, depth 2 = individual memories
  const sizeMultiplier = node.depth === 0 ? 2.5 : node.depth === 1 ? 1.5 : 1;
  const size = baseRadius * sizeMultiplier;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity,
        scale,
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
      {/* Outer glow - neuron-like soft glow */}
      <circle
        r={size * 1.2}
        fill={isSelected || isHighlighted ? categoryColor.glow : NEURON_COLORS.glow}
        filter="url(#glow)"
        className={cn(
          'transition-opacity duration-300',
          isSelected || isHighlighted ? 'opacity-100' : 'opacity-30'
        )}
      />

      {/* Cell membrane - outer ring */}
      <circle
        r={size * 0.9}
        fill="none"
        stroke={categoryColor.base}
        strokeWidth={size * 0.08}
        opacity={isSelected || isHighlighted ? 0.8 : 0.4}
      />

      {/* Main neuron body - colored by category */}
      <circle
        r={size * 0.7}
        fill={categoryColor.base}
        stroke={isSelected ? 'white' : categoryColor.base}
        strokeWidth={isSelected ? 3 : 2}
        opacity={0.9}
        className="transition-all duration-200"
      />

      {/* Inner gradient for depth */}
      <circle
        r={size * 0.55}
        fill={`url(#gradient-${node.category.toLowerCase()})`}
        opacity={isSelected || isHighlighted ? 0.5 : 0.2}
      />

      {/* Nucleus - center dot (white for contrast) */}
      <circle
        r={size * 0.25}
        fill="white"
        opacity={isSelected || isHighlighted ? 1 : 0.7}
      />

      {/* Small dendrite dots around the neuron for larger nodes */}
      {size > 40 && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const distance = size * 0.85;
            return (
              <circle
                key={i}
                cx={Math.cos(rad) * distance}
                cy={Math.sin(rad) * distance}
                r={size * 0.08}
                fill={categoryColor.base}
                opacity={0.5}
              />
            );
          })}
        </>
      )}

      {/* Label (only at higher zoom levels) */}
      {zoomLevel >= 2 && (
        <text
          y={size + 15}
          textAnchor="middle"
          fill="white"
          fontSize={zoomLevel === 3 ? 11 : 9}
          fontWeight="500"
          className="pointer-events-none select-none"
          opacity={0.9}
        >
          {node.summary.length > 25 ? node.summary.slice(0, 25) + '...' : node.summary}
        </text>
      )}

      {/* Category label at zoom level 1 for category nodes */}
      {zoomLevel === 1 && node.depth === 0 && (
        <text
          y={size + 18}
          textAnchor="middle"
          fill={categoryColor.base}
          fontSize={14}
          fontWeight="600"
          className="pointer-events-none select-none"
        >
          {node.category}
        </text>
      )}

      {/* Selection ring - pulsing effect */}
      {isSelected && (
        <motion.circle
          r={size * 1.0}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeDasharray="6 3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="8s"
            repeatCount="indefinite"
          />
        </motion.circle>
      )}
    </motion.g>
  );
});
