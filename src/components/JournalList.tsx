import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Lock, 
  Sparkles, 
  Trash2, 
  Calendar, 
  Smile, 
  FileText
} from 'lucide-react';
import type { JournalEntry, JournalSummary, UserProfile } from '../types';
import { CryptoVault } from '../services/cryptoVault';
import { SummaryDetailModal } from './SummaryDetailModal';

interface Props {
  journals: JournalEntry[];
  summaries: JournalSummary[];
  user?: UserProfile;
  onSelectJournal: (journal: JournalEntry) => void;
  onNewJournal: () => void;
  onDeleteJournal: (journalId: string) => void;
  onOpenVaultModal: () => void;
}

export const JournalList: React.FC<Props> = ({
  journals,
  summaries,
  onSelectJournal,
  onNewJournal,
  onDeleteJournal,
  onOpenVaultModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedSummary, setSelectedSummary] = useState<JournalSummary | null>(null);
  const [selectedJournalTitle, setSelectedJournalTitle] = useState('');
  const [decryptedContents, setDecryptedContents] = useState<{ [id: string]: string }>({});

  const isVaultUnlocked = CryptoVault.isUnlocked();

  // Decrypt entries if vault is unlocked
  useEffect(() => {
    if (isVaultUnlocked) {
      journals.forEach(async (j) => {
        if (j.isEncrypted && j.iv && !decryptedContents[j.id]) {
          try {
            const dec = await CryptoVault.decrypt(j.content, j.iv);
            setDecryptedContents(prev => ({ ...prev, [j.id]: dec }));
          } catch {
            // Decryption failed or not unlocked with matching salt
          }
        }
      });
    } else {
      setDecryptedContents({});
    }
  }, [isVaultUnlocked, journals]);

  // Extract all unique tags
  const allTags = Array.from(new Set(journals.flatMap(j => j.tags)));

  // Filter journals
  const filteredJournals = journals.filter(j => {
    const matchesSearch = 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!j.isEncrypted && j.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (decryptedContents[j.id] && decryptedContents[j.id].toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === 'ALL' || j.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleOpenSummary = (journal: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const sum = summaries.find(s => s.journalId === journal.id || s.id === journal.summaryId);
    if (sum) {
      setSelectedSummary(sum);
      setSelectedJournalTitle(journal.title);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this journal entry from Cloud Firestore?')) {
      onDeleteJournal(id);
    }
  };

  return (
    <div className="journal-list-view">
      {/* Top Controls Bar */}
      <div className="list-controls-bar">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search entries, keywords, or decrypted thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-search"
          />
        </div>

        <div className="tag-filter-scroll">
          <button 
            className={`filter-tag-pill ${selectedTag === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedTag('ALL')}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`filter-tag-pill ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={onNewJournal}>
          <Plus size={16} />
          <span>New Journal</span>
        </button>
      </div>

      {/* Grid of Journal Entries */}
      <div className="journal-grid">
        {filteredJournals.length === 0 ? (
          <div className="empty-state-card card-glass">
            <FileText size={48} className="text-muted" />
            <h3>No Journal Entries Found</h3>
            <p>Begin a new reflection or brainstorm with your personal Gemini companion.</p>
            <button className="btn-primary-emerald" onClick={onNewJournal}>
              <Plus size={16} /> Create First Entry
            </button>
          </div>
        ) : (
          filteredJournals.map(journal => {
            const hasSummary = summaries.some(s => s.journalId === journal.id || s.id === journal.summaryId);
            const isEnc = journal.isEncrypted;
            const decryptedText = decryptedContents[journal.id];

            return (
              <div 
                key={journal.id} 
                className="journal-card card-glass"
                onClick={() => onSelectJournal(journal)}
              >
                <div className="journal-card-header">
                  <div className="flex-center gap-2">
                    <span className="mood-badge-dot" title={journal.moodLabel}></span>
                    <h3 className="journal-title">{journal.title}</h3>
                  </div>

                  <div className="card-top-actions">
                    {isEnc && (
                      <span className="badge-pill violet" title="AES-GCM-256 Encrypted">
                        <Lock size={12} /> MindVault
                      </span>
                    )}
                    <button 
                      className="icon-btn-delete"
                      onClick={(e) => handleDelete(journal.id, e)}
                      title="Delete Entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                <div className="journal-snippet">
                  {isEnc ? (
                    decryptedText ? (
                      <p className="text-decrypted">{decryptedText.substring(0, 160)}...</p>
                    ) : (
                      <div className="encrypted-shield-placeholder" onClick={(e) => { e.stopPropagation(); onOpenVaultModal(); }}>
                        <Lock size={16} className="text-violet" />
                        <span>Encrypted with AES-GCM-256. Click to enter passphrase.</span>
                      </div>
                    )
                  ) : (
                    <p>{journal.content.substring(0, 160)}...</p>
                  )}
                </div>

                {/* Tags and Meta */}
                <div className="journal-meta-row">
                  <div className="meta-item">
                    <Calendar size={13} className="text-muted" />
                    <span>{new Date(journal.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="meta-item">
                    <Smile size={13} className="text-cyan" />
                    <span>{journal.moodLabel}</span>
                  </div>
                </div>

                <div className="journal-card-footer">
                  <div className="tag-chips-row">
                    {journal.tags.map(t => (
                      <span key={t} className="tag-badge-sm">#{t}</span>
                    ))}
                  </div>

                  {hasSummary && (
                    <button 
                      className="btn-pill-synthesis"
                      onClick={(e) => handleOpenSummary(journal, e)}
                    >
                      <Sparkles size={13} className="text-emerald" />
                      <span>AI Synthesis</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Detail Modal */}
      <SummaryDetailModal
        summary={selectedSummary}
        journalTitle={selectedJournalTitle}
        isOpen={selectedSummary !== null}
        onClose={() => setSelectedSummary(null)}
      />
    </div>
  );
};
