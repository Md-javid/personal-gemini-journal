import React from 'react';
import { Sparkles, Brain, Award, Activity, Tag, X, ShieldCheck } from 'lucide-react';
import type { JournalSummary } from '../types';

interface Props {
  summary: JournalSummary | null;
  journalTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SummaryDetailModal: React.FC<Props> = ({ summary, journalTitle, isOpen, onClose }) => {
  if (!isOpen || !summary) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-badge emerald">
              <Sparkles size={22} />
            </div>
            <div>
              <h3>Autonomous Gemini Synthesis</h3>
              <p className="subtitle">{journalTitle || 'Journal Entry Reflection'}</p>
            </div>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Executive Summary Card */}
          <div className="summary-section card-glass-inner">
            <div className="section-label">
              <Brain size={16} className="text-emerald" />
              <span>Executive Summary</span>
            </div>
            <p className="executive-text">{summary.executiveSummary}</p>
          </div>

          {/* Key Takeaways */}
          <div className="summary-section">
            <div className="section-label">
              <Award size={16} className="text-cyan" />
              <span>High-Leverage Breakthroughs & Action Items</span>
            </div>
            <ul className="takeaways-list">
              {summary.keyTakeaways.map((item, idx) => (
                <li key={idx}>
                  <span className="bullet-number">{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Emotional & Cognitive Valence Grid */}
          <div className="valence-grid">
            <div className="valence-card card-glass-inner">
              <div className="section-label">
                <Activity size={15} className="text-violet" />
                <span>Emotional Valence Shift</span>
              </div>
              <div className="valence-primary-mood">{summary.emotionalValence?.primaryMood || 'Reflective'}</div>
              <p className="valence-shift-desc">{summary.emotionalValence?.shift || 'Mindful reframing observed.'}</p>
            </div>

            <div className="valence-card card-glass-inner">
              <div className="section-label">
                <ShieldCheck size={15} className="text-amber" />
                <span>Cognitive Biases Reframed</span>
              </div>
              <div className="distortion-tags">
                {summary.cognitiveDistortions?.map((d, i) => (
                  <span key={i} className="distortion-tag-pill">{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Topics & Entities */}
          <div className="summary-section">
            <div className="section-label">
              <Tag size={15} className="text-muted" />
              <span>Extracted Semantic Topics</span>
            </div>
            <div className="flex-center gap-2 flex-wrap">
              {summary.topics?.map((topic, i) => (
                <span key={i} className="badge-pill cyan">#{topic}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Close Synthesis</button>
        </div>
      </div>
    </div>
  );
};
