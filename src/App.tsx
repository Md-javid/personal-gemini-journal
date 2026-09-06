import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { KnowledgeMesh } from './components/KnowledgeMesh';
import { AIStudioConstitutionModal } from './components/AIStudioConstitutionModal';
import { MindVaultModal } from './components/MindVaultModal';
import { AuthModal } from './components/AuthModal';
import { FirebaseService } from './services/firebase';
import type { JournalEntry, JournalSummary, UserProfile } from './types';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [summaries, setSummaries] = useState<JournalSummary[]>([]);
  const [activeView, setActiveView] = useState<'JOURNALS' | 'EDITOR' | 'MESH'>('JOURNALS');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Modals
  const [isConstitutionOpen, setIsConstitutionOpen] = useState(false);
  const [isMindVaultOpen, setIsMindVaultOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Load Auth State
  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserData(currentUser.uid);
      } else {
        setJournals([]);
        setSummaries([]);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadUserData = async (uid: string) => {
    try {
      const [fetchedJournals, fetchedSummaries] = await Promise.all([
        FirebaseService.getJournals(uid),
        FirebaseService.getSummaries(uid)
      ]);
      setJournals(fetchedJournals);
      setSummaries(fetchedSummaries);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleSelectJournal = (journal: JournalEntry) => {
    setEditingEntry(journal);
    setActiveView('EDITOR');
  };

  const handleNewJournal = () => {
    setEditingEntry(null);
    setActiveView('EDITOR');
  };

  const handleSaveComplete = (entry: JournalEntry, newSummary?: JournalSummary) => {
    setJournals(prev => {
      const idx = prev.findIndex(j => j.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });

    if (newSummary) {
      setSummaries(prev => {
        const sIdx = prev.findIndex(s => s.id === newSummary.id);
        if (sIdx >= 0) {
          const copy = [...prev];
          copy[sIdx] = newSummary;
          return copy;
        }
        return [newSummary, ...prev];
      });
    }

    setActiveView('JOURNALS');
  };

  const handleDeleteJournal = async (journalId: string) => {
    if (!user) return;
    try {
      await FirebaseService.deleteJournal(user.uid, journalId);
      setJournals(prev => prev.filter(j => j.id !== journalId));
    } catch (err) {
      alert('Delete failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="app-container">
      {/* Background ambient lighting */}
      <div className="ambient-glow glow-emerald"></div>
      <div className="ambient-glow glow-violet"></div>
      <div className="ambient-glow glow-cyan"></div>

      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenConstitution={() => setIsConstitutionOpen(true)}
        onOpenMindVault={() => setIsMindVaultOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="main-content">
        {!user ? (
          <div className="unauthenticated-hero card-glass">
            <div className="icon-badge-large">
              <ShieldCheck size={42} className="text-emerald" />
            </div>
            <h2>Enterprise AI Journal & Cognitive Vault</h2>
            <p className="hero-subtext">
              Built with Google AI Studio under the <strong>Aegis-1 Security Constitution</strong>. 
              Enjoy zero-trust Cloud Firestore database isolation, Google Cloud Secret Manager key governance, 
              client-side MindVault encryption, and multi-turn Gemini 2.0 streaming.
            </p>
            <div className="hero-actions">
              <button className="btn-primary-emerald large" onClick={() => setIsAuthOpen(true)}>
                Sign In to Your Journal
              </button>
              <button className="btn-secondary large" onClick={() => setIsConstitutionOpen(true)}>
                Inspect AI Studio Constitution
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'JOURNALS' && (
              <JournalList
                journals={journals}
                summaries={summaries}
                user={user}
                onSelectJournal={handleSelectJournal}
                onNewJournal={handleNewJournal}
                onDeleteJournal={handleDeleteJournal}
                onOpenVaultModal={() => setIsMindVaultOpen(true)}
              />
            )}

            {activeView === 'EDITOR' && (
              <JournalEditor
                user={user}
                initialEntry={editingEntry}
                onSaveComplete={handleSaveComplete}
                onOpenVaultModal={() => setIsMindVaultOpen(true)}
              />
            )}

            {activeView === 'MESH' && (
              <KnowledgeMesh
                journals={journals}
                onSelectJournal={handleSelectJournal}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AIStudioConstitutionModal
        isOpen={isConstitutionOpen}
        onClose={() => setIsConstitutionOpen(false)}
      />

      {user && (
        <MindVaultModal
          isOpen={isMindVaultOpen}
          onClose={() => setIsMindVaultOpen(false)}
          user={user}
          onVaultUnlocked={() => {
            if (user) loadUserData(user.uid);
          }}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          const u = FirebaseService.getCurrentUser();
          setUser(u);
          if (u) loadUserData(u.uid);
        }}
      />
    </div>
  );
};

export default App;
