'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { TransformWrapper, TransformComponent, useControls, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { GraphNode, GraphLink, GraphData, CATEGORY_COLORS, ZoomLevel, TransitionState } from '@/types/nexus';
import { MemoryNodeComponent } from './MemoryNode';
import { NodeDetailPanel } from './NodeDetailPanel';
import { getZoomLevelFromScale } from '@/lib/utils';
import { getRelationshipThreshold } from '@/lib/api/graph';

interface MemoryGraphProps {
  data: GraphData;
  searchQuery: string;
  onNodeSelect: (node: GraphNode | null) => void;
  selectedNodeId: string | null;
  onNodeUpdated?: () => void;
}

type SimNode = GraphNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & GraphLink;

function GraphControls({ zoomLevel }: { zoomLevel: ZoomLevel }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const viewModeLabel = zoomLevel === 1 ? 'Categories' : zoomLevel === 2 ? 'Clusters' : 'Memories';

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
      <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-1 flex flex-col gap-1">
        <button
          onClick={() => zoomIn(1.5)}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="text-xl font-light">+</span>
        </button>
        <div className="h-px bg-white/10" />
        <button
          onClick={() => zoomOut(1.5)}
          className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="text-xl font-light">−</span>
        </button>
      </div>
      <button
        onClick={() => resetTransform()}
        className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        Reset
      </button>
      <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs">
        <div className="text-white/50 mb-1">View</div>
        <div className="text-white/90 font-medium">{viewModeLabel}</div>
      </div>
    </div>
  );
}

export function MemoryGraph({
  data,
  searchQuery,
  onNodeSelect,
  selectedNodeId,
  onNodeUpdated
}: MemoryGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const pendingFitRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [transitionState, setTransitionState] = useState<TransitionState>({
    phase: 'stable',
    previousZoomLevel: 2,
  });
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  // Memoize category member counts for badges
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    nodes.forEach(node => {
      if (!node.isGroup) {
        const key = `group:${node.category}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [nodes]);

  // Initialize dimensions
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize D3 force simulation
  useEffect(() => {
    const simNodes: SimNode[] = data.nodes.map((node) => ({
      ...node,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 200,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simLinks: SimLink[] = data.links.map((link) => ({
      ...link,
      source: link.source as string,
      target: link.target as string,
    }));

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(100)
          .strength((d) => (d as SimLink).strength * 0.5)
      )
      .force('charge', forceManyBody().strength(-150))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force(
        'collision',
        forceCollide<SimNode>().radius((d) => d.radius + 20)
      )
      .alphaDecay(0.05)
      .velocityDecay(0.4)
      .on('tick', () => {
        setNodes([...simNodes]);
        setLinks([...simLinks]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  // Dynamic force parameters based on zoom level
  useEffect(() => {
    if (!simulationRef.current) return;

    const params = {
      1: { charge: -250, distance: 140 },  // Spread categories apart
      2: { charge: -150, distance: 100 },  // Balanced
      3: { charge: -80, distance: 60 },    // Tight clustering
    }[zoomLevel];

    simulationRef.current
      .force('charge', forceManyBody().strength(params.charge))
      .force('link', forceLink<SimNode, SimLink>(links)
        .id(d => d.id)
        .distance(params.distance)
        .strength(d => (d as SimLink).strength * 0.5)
      )
      .alpha(0.2)
      .restart();
  }, [zoomLevel, links]);

  useEffect(() => {
    pendingFitRef.current += 1;
  }, [data.nodes.length, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!transformRef.current || nodes.length === 0 || pendingFitRef.current === 0) {
      return;
    }

    const validNodes = nodes.filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y));
    if (validNodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    validNodes.forEach((node) => {
      const radius = node.radius ?? 30;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      minX = Math.min(minX, x - radius);
      maxX = Math.max(maxX, x + radius);
      minY = Math.min(minY, y - radius);
      maxY = Math.max(maxY, y + radius);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    if (width <= 0 || height <= 0) return;

    const padding = 80;
    const scale = Math.min(
      (dimensions.width - padding) / width,
      (dimensions.height - padding) / height
    );
    const clampedScale = Math.min(2.5, Math.max(0.5, scale));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const translateX = dimensions.width / 2 - centerX * clampedScale;
    const translateY = dimensions.height / 2 - centerY * clampedScale;

    transformRef.current.setTransform(translateX, translateY, clampedScale, 0);
    pendingFitRef.current = 0;
  }, [nodes, dimensions]);

  // Handle node selection and re-center
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      // Category click to zoom in at zoom level 1
      if (node.isGroup && zoomLevel === 1 && transformRef.current) {
        const nodeX = node.x || dimensions.width / 2;
        const nodeY = node.y || dimensions.height / 2;

        transformRef.current.setTransform(
          dimensions.width / 2 - nodeX * 1.2,
          dimensions.height / 2 - nodeY * 1.2,
          1.2,  // Scale to zoom level 2
          300   // Animation duration
        );
        return;
      }

      if (node.isGroup) {
        return;
      }
      if (selectedNodeId === node.id) {
        onNodeSelect(null);
        return;
      }

      onNodeSelect(node);

      // Re-center simulation around the selected node
      if (simulationRef.current) {
        const simNode = nodes.find((n) => n.id === node.id);
        if (simNode) {
          simulationRef.current
            .force('center', forceCenter(simNode.x || dimensions.width / 2, simNode.y || dimensions.height / 2))
            .alpha(0.3)
            .restart();
        }
      }
    },
    [selectedNodeId, onNodeSelect, nodes, dimensions, zoomLevel]
  );

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(
      (node) =>
        node.content.toLowerCase().includes(query) ||
        node.summary.toLowerCase().includes(query) ||
        node.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        node.category.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  const highlightedIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Handle zoom level change
  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const newZoomLevel = getZoomLevelFromScale(ref.state.scale);

    if (newZoomLevel !== zoomLevel) {
      const isZoomingOut = newZoomLevel < zoomLevel;

      setTransitionState({
        phase: isZoomingOut ? 'merging' : 'splitting',
        previousZoomLevel: zoomLevel,
      });

      // Reset to stable after animation
      setTimeout(() => {
        setTransitionState(prev => ({ ...prev, phase: 'stable' }));
      }, 400);

      setZoomLevel(newZoomLevel);
    }
  }, [zoomLevel]);

  // SVG Defs for gradients and filters
  const svgDefs = (
    <defs>
      {/* Glow filter */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Category gradients */}
      {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
        <radialGradient key={category} id={`gradient-${category.toLowerCase()}`}>
          <stop offset="0%" stopColor={colors.base} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.base} stopOpacity="0" />
        </radialGradient>
      ))}

      {/* Link gradient */}
      <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
      </linearGradient>
    </defs>
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId && !n.isGroup);

  // Get relationship threshold based on zoom level
  const relationshipThreshold = getRelationshipThreshold(zoomLevel);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black/50 rounded-xl">
      <TransformWrapper
        ref={transformRef}
        initialScale={0.8}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        onTransformed={handleTransform}
        wheel={{ step: 1.5 }}
        panning={{ disabled: false }}
        doubleClick={{ disabled: true }}
      >
        {() => (
          <>
            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
              <svg
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="select-none"
              >
                {svgDefs}

                {/* Links */}
                <g className="links">
                  {links.map((link, i) => {
                    const source = link.source as SimNode;
                    const target = link.target as SimNode;
                    if (!source.x || !source.y || !target.x || !target.y) return null;

                    // Filter by threshold (category links always shown)
                    const linkData = link as SimLink;
                    const meetsThreshold = linkData.type === 'category' || linkData.strength >= relationshipThreshold;
                    if (!meetsThreshold) return null;

                    const isHighlighted =
                      (searchQuery && highlightedIds.has(source.id) && highlightedIds.has(target.id)) ||
                      source.id === selectedNodeId ||
                      target.id === selectedNodeId;

                    return (
                      <motion.line
                        key={`link-${i}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isHighlighted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}
                        strokeWidth={isHighlighted ? 2 : 1}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: i * 0.01 }}
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                <g className="nodes">
                  {nodes.map((node) => (
                    <MemoryNodeComponent
                      key={node.id}
                      node={node}
                      isSelected={node.id === selectedNodeId}
                      isHighlighted={searchQuery ? highlightedIds.has(node.id) : false}
                      zoomLevel={zoomLevel}
                      transitionPhase={transitionState.phase}
                      memberCount={node.isGroup ? categoryCounts.get(node.id) : undefined}
                      onClick={handleNodeClick}
                      onHover={setHoveredNode}
                    />
                  ))}
                </g>
              </svg>
            </TransformComponent>

            <GraphControls zoomLevel={zoomLevel} />
          </>
        )}
      </TransformWrapper>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredNode && !selectedNodeId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 left-6 max-w-sm bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[hoveredNode.category]?.base }}
              />
              <span className="text-sm font-medium text-white">{hoveredNode.category}</span>
              <span className="text-xs text-white/50">
                • {hoveredNode.isGroup ? 'Group' : hoveredNode.type}
              </span>
            </div>
            <p className="text-sm text-white/80">{hoveredNode.summary}</p>
            {!hoveredNode.isGroup && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hoveredNode.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => onNodeSelect(null)}
            onNodeUpdated={onNodeUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
