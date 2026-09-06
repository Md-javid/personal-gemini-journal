import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Network, Compass, Filter, X } from 'lucide-react';
import type { JournalEntry, KnowledgeNode, KnowledgeEdge } from '../types';

interface Props {
  journals: JournalEntry[];
  onSelectJournal: (journal: JournalEntry) => void;
}

export const KnowledgeMesh: React.FC<Props> = ({ journals, onSelectJournal }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showSerendipity, setShowSerendipity] = useState(true);

  // Generate dynamic nodes & edges based on user's journal entries
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);

  useEffect(() => {
    // Extract unique topics, emotions, and breakthroughs
    const generatedNodes: KnowledgeNode[] = [];
    const generatedEdges: KnowledgeEdge[] = [];
    const topicMap: { [key: string]: string[] } = {};

    journals.forEach((j) => {
      // Add journal node
      generatedNodes.push({
        id: `journal_${j.id}`,
        label: j.title.length > 22 ? j.title.substring(0, 22) + '...' : j.title,
        type: 'BREAKTHROUGH',
        weight: 14,
        connectedJournalIds: [j.id],
        color: '#10b981', // Emerald
      });

      // Add mood/emotion node
      const emotionLabel = j.moodLabel || 'Reflective';
      if (!generatedNodes.some(n => n.id === `emotion_${emotionLabel}`)) {
        generatedNodes.push({
          id: `emotion_${emotionLabel}`,
          label: emotionLabel,
          type: 'EMOTION',
          weight: 11,
          connectedJournalIds: [j.id],
          color: '#8b5cf6', // Violet
        });
      }

      generatedEdges.push({
        source: `journal_${j.id}`,
        target: `emotion_${emotionLabel}`,
        strength: 0.8
      });

      // Add tags / topic nodes
      j.tags.forEach(t => {
        if (!topicMap[t]) topicMap[t] = [];
        topicMap[t].push(j.id);

        if (!generatedNodes.some(n => n.id === `topic_${t}`)) {
          generatedNodes.push({
            id: `topic_${t}`,
            label: `#${t}`,
            type: 'TOPIC',
            weight: 12,
            connectedJournalIds: [j.id],
            color: '#38bdf8', // Cyan
          });
        }

        generatedEdges.push({
          source: `journal_${j.id}`,
          target: `topic_${t}`,
          strength: 0.6
        });
      });
    });

    // Cross-link topics that appear together
    Object.keys(topicMap).forEach((t1, i) => {
      Object.keys(topicMap).forEach((t2, j) => {
        if (i < j) {
          const overlap = topicMap[t1].filter(id => topicMap[t2].includes(id));
          if (overlap.length > 0) {
            generatedEdges.push({
              source: `topic_${t1}`,
              target: `topic_${t2}`,
              strength: 0.4
            });
          }
        }
      });
    });

    // Initialize random positions
    const width = 800;
    const height = 460;
    const positionedNodes = generatedNodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 350,
      y: height / 2 + (Math.random() - 0.5) * 260,
      vx: 0,
      vy: 0
    }));

    setNodes(positionedNodes);
    setEdges(generatedEdges);
  }, [journals]);

  // Force simulation loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let localNodes = [...nodes];

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Simple physics step
      for (let i = 0; i < localNodes.length; i++) {
        for (let j = i + 1; j < localNodes.length; j++) {
          const dx = (localNodes[j].x || 0) - (localNodes[i].x || 0);
          const dy = (localNodes[j].y || 0) - (localNodes[i].y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 120) {
            const force = (120 - dist) / 120 * 0.4;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            localNodes[i].x = (localNodes[i].x || 0) - fx;
            localNodes[i].y = (localNodes[i].y || 0) - fy;
            localNodes[j].x = (localNodes[j].x || 0) + fx;
            localNodes[j].y = (localNodes[j].y || 0) + fy;
          }
        }

        // Center gravity pull
        const cx = width / 2;
        const cy = height / 2;
        localNodes[i].x = (localNodes[i].x || cx) + (cx - (localNodes[i].x || cx)) * 0.01;
        localNodes[i].y = (localNodes[i].y || cy) + (cy - (localNodes[i].y || cy)) * 0.01;

        // Keep inside bounds
        localNodes[i].x = Math.max(40, Math.min(width - 40, localNodes[i].x || cx));
        localNodes[i].y = Math.max(40, Math.min(height - 40, localNodes[i].y || cy));
      }

      // Draw Edges
      edges.forEach(e => {
        const sourceNode = localNodes.find(n => n.id === e.source);
        const targetNode = localNodes.find(n => n.id === e.target);
        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Draw Nodes
      localNodes.forEach(n => {
        if (!n.x || !n.y) return;
        const isFiltered = filterType !== 'ALL' && n.type !== filterType;
        const opacity = isFiltered ? 0.2 : 1.0;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.weight + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color}22`;
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.weight, 0, Math.PI * 2);
        ctx.fillStyle = isFiltered ? '#334155' : n.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Border
        ctx.lineWidth = selectedNode?.id === n.id ? 3 : 1.5;
        ctx.strokeStyle = selectedNode?.id === n.id ? '#ffffff' : '#0f172a';
        ctx.stroke();

        // Label
        ctx.font = '11px Plus Jakarta Sans, Inter, sans-serif';
        ctx.fillStyle = isFiltered ? '#64748b' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.weight + 14);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, edges, filterType, selectedNode]);

  // Click detection on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clicked = nodes.find(n => {
      if (!n.x || !n.y) return false;
      const dist = Math.hypot(n.x - x, n.y - y);
      return dist <= n.weight + 8;
    });

    if (clicked) {
      setSelectedNode(clicked);
      // If connected to a single journal, select it
      if (clicked.connectedJournalIds.length > 0) {
        const targetJournal = journals.find(j => j.id === clicked.connectedJournalIds[0]);
        if (targetJournal && clicked.type === 'BREAKTHROUGH') {
          onSelectJournal(targetJournal);
        }
      }
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <div className="knowledge-mesh-container card-glass">
      <div className="mesh-header">
        <div className="flex-center gap-2">
          <div className="icon-badge cyan">
            <Network size={20} />
          </div>
          <div>
            <h3>Cognitive Knowledge Mesh & Temporal Thought Galaxy</h3>
            <p className="subtitle">
              Gemini Vector Embeddings mapping subconscious patterns, recurring themes, and emotional shifts
            </p>
          </div>
        </div>

        <div className="mesh-controls">
          <div className="filter-pill-group">
            <span className="filter-label"><Filter size={12} /> Filter:</span>
            {['ALL', 'TOPIC', 'EMOTION', 'BREAKTHROUGH'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filterType === f ? 'active' : ''}`}
                onClick={() => setFilterType(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Serendipity Banner */}
      {showSerendipity && (
        <div className="serendipity-banner">
          <div className="serendipity-icon">
            <Sparkles size={20} className="text-amber animate-pulse" />
          </div>
          <div className="serendipity-content">
            <div className="serendipity-title">
              <strong>Temporal Serendipity Alert</strong>
              <span className="badge-pill amber">Gemini Memory Match</span>
            </div>
            <p>
              "You were exploring a nearly identical bottleneck on <em>Architectural Zero-Trust</em> 3 days ago. 
              The breakthrough that unlocked clarity: <strong>enforce security directives at the model system level before writing code.</strong>"
            </p>
          </div>
          <button className="icon-btn-close small" onClick={() => setShowSerendipity(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Canvas Area */}
      <div className="mesh-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={880}
          height={480}
          className="mesh-canvas"
          onClick={handleCanvasClick}
        />

        {/* Legend */}
        <div className="mesh-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
            <span>Journal Thought</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#38bdf8' }}></span>
            <span>Topic Entity</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
            <span>Emotional State</span>
          </div>
        </div>
      </div>

      {/* Node Details Drawer */}
      {selectedNode && (
        <div className="node-detail-tray">
          <div className="node-detail-info">
            <span className="node-badge" style={{ backgroundColor: selectedNode.color }}>
              {selectedNode.type}
            </span>
            <h4>{selectedNode.label}</h4>
            <p>Connected across <strong>{selectedNode.connectedJournalIds.length}</strong> journal entries.</p>
          </div>
          <div className="flex-center gap-2">
            {selectedNode.connectedJournalIds.length > 0 && (
              <button 
                className="btn-pill-primary"
                onClick={() => {
                  const target = journals.find(j => j.id === selectedNode.connectedJournalIds[0]);
                  if (target) onSelectJournal(target);
                }}
              >
                <Compass size={14} /> Open Journal Entry
              </button>
            )}
            <button className="icon-btn-close" onClick={() => setSelectedNode(null)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
