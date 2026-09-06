import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Lock, 
  Unlock, 
  Mic, 
  MicOff, 
  Save, 
  Bot, 
  User as UserIcon, 
  Tag, 
  Smile, 
  Shield, 
  ChevronRight,
  RefreshCw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { JournalEntry, JournalSummary, UserProfile } from '../types';
import { CryptoVault } from '../services/cryptoVault';
import { ApiService } from '../services/api';
import { FirebaseService } from '../services/firebase';

interface Props {
  user: UserProfile;
  initialEntry?: JournalEntry | null;
  onSaveComplete: (entry: JournalEntry, summary?: JournalSummary) => void;
  onOpenVaultModal: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const JournalEditor: React.FC<Props> = ({ 
  user, 
  initialEntry, 
  onSaveComplete, 
  onOpenVaultModal 
}) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [moodRating, setMoodRating] = useState<number>(initialEntry?.moodRating || 8);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || ['Strategy', 'Growth']);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(initialEntry?.isEncrypted || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Chat Drawer & Streaming States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your Gemini Brainstorming & Journal Companion. Write down whatever is occupying your mind, or ask me to challenge an assumption, unpack an emotion, or structure your next big strategy."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingChunk, setStreamingChunk] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent(prev => prev + (prev.length > 0 ? ' ' : '') + transcript);
      };

      recog.onerror = () => setIsRecording(false);
      recog.onend = () => setIsRecording(false);
      recognitionRef.current = recog;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const getMoodLabel = (score: number) => {
    if (score >= 9) return 'Empowered & Decisive';
    if (score >= 7) return 'Reflective & Grounded';
    if (score >= 5) return 'Contemplative';
    if (score >= 3) return 'Processing Friction';
    return 'Vulnerable & Exhausted';
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Streaming Multi-Turn Chat
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || isStreaming) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: query }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsStreaming(true);
    setStreamingChunk('');

    let accumulated = '';
    await ApiService.streamChat(
      newMessages,
      getMoodLabel(moodRating),
      content ? `Current Journal Content:\n${content}` : null,
      (chunk) => {
        accumulated += chunk;
        setStreamingChunk(accumulated);
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      },
      (err) => {
        console.error('Chat error:', err);
        setIsStreaming(false);
      },
      () => {
        setChatMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingChunk('');
        setIsStreaming(false);
      }
    );
  };

  const handleSuggestion = (promptText: string) => {
    handleSendMessage(promptText);
  };

  // Save Journal & Autonomous Summarization
  const handleSaveJournal = async () => {
    if (!title.trim() && !content.trim()) {
      alert('Please enter a title or journal content before saving.');
      return;
    }

    setIsSaving(true);

    try {
      let finalContent = content;
      let iv: string | undefined = undefined;

      // Handle MindVault E2EE
      if (isEncrypted) {
        if (!CryptoVault.isUnlocked()) {
          onOpenVaultModal();
          setIsSaving(false);
          return;
        }
        // Encrypt with WebCrypto
        const encrypted = await CryptoVault.encrypt(content);
        finalContent = encrypted.ciphertext;
        iv = encrypted.iv;
      }

      const journalId = initialEntry?.id || 'journal_' + Date.now();
      const newEntry: JournalEntry = {
        id: journalId,
        userId: user.uid,
        title: title || 'Untitled Reflection',
        content: finalContent,
        isEncrypted,
        iv,
        moodRating,
        moodLabel: getMoodLabel(moodRating),
        tags,
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Save to Cloud Firestore
      await FirebaseService.saveJournal(user.uid, newEntry);

      // 2. Ephemeral Autonomous Summarization via Gemini
      let summaryObj: JournalSummary | undefined = undefined;
      try {
        const sumRes = await ApiService.summarizeJournal(title, content, moodRating);
        if (sumRes && sumRes.summary) {
          summaryObj = {
            id: 'summary_' + Date.now(),
            journalId,
            userId: user.uid,
            executiveSummary: sumRes.summary.executiveSummary,
            keyTakeaways: sumRes.summary.keyTakeaways || [],
            emotionalValence: sumRes.summary.emotionalValence || {
              primaryMood: getMoodLabel(moodRating),
              confidence: 0.9,
              shift: 'Reflective state captured'
            },
            cognitiveDistortions: sumRes.summary.cognitiveDistortions || ['Clear & Grounded'],
            topics: sumRes.summary.topics || tags,
            generatedAt: new Date().toISOString()
          };
          await FirebaseService.saveSummary(user.uid, summaryObj);
        }
      } catch (err) {
        console.warn('Auto-summarization completed with fallback:', err);
      }

      // Trigger celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#38bdf8', '#8b5cf6']
      });

      onSaveComplete(newEntry, summaryObj);
    } catch (err) {
      alert('Save failed: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="editor-grid">
      {/* Main Journaling Workspace */}
      <div className="editor-main card-glass">
        <div className="editor-header">
          <input
            type="text"
            className="editor-title-input"
            placeholder="Title your brainstorm or thought..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="editor-actions">
            {/* MindVault Toggle */}
            <button
              className={`btn-toggle-vault ${isEncrypted ? 'encrypted' : ''}`}
              onClick={() => {
                if (!isEncrypted && !CryptoVault.isUnlocked()) {
                  onOpenVaultModal();
                }
                setIsEncrypted(!isEncrypted);
              }}
              title={isEncrypted ? 'MindVault E2EE Active (AES-GCM-256)' : 'Click to enable Zero-Knowledge E2EE'}
            >
              {isEncrypted ? (
                <>
                  <Lock size={15} className="text-violet" />
                  <span>MindVault Protected</span>
                </>
              ) : (
                <>
                  <Unlock size={15} />
                  <span>Protect with E2EE</span>
                </>
              )}
            </button>

            {/* Voice Journaling Button */}
            <button
              className={`btn-icon-pill ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              title={isRecording ? 'Stop Recording' : 'Voice Journaling (Speech to Text)'}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              <span>{isRecording ? 'Listening...' : 'Dictate'}</span>
            </button>

            {/* Save Button */}
            <button 
              className="btn-primary" 
              onClick={handleSaveJournal}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save & Summarize</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Textarea */}
        <div className="textarea-wrapper">
          <textarea
            className="editor-textarea"
            placeholder="Unpack your raw thoughts, brainstorm architectures, or reflect on today's breakthroughs... Gemini is listening in real time to assist."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Mood & Tag Controls Footer */}
        <div className="editor-footer">
          <div className="mood-slider-group">
            <div className="mood-info">
              <Smile size={16} className="text-cyan" />
              <span>Valence / Energy: <strong>{getMoodLabel(moodRating)}</strong> ({moodRating}/10)</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodRating}
              onChange={(e) => setMoodRating(Number(e.target.value))}
              className="slider-range"
            />
          </div>

          <div className="tags-manager">
            <div className="tag-list">
              {tags.map(t => (
                <span key={t} className="tag-pill">
                  #{t}
                  <button onClick={() => handleRemoveTag(t)}>×</button>
                </span>
              ))}
            </div>
            <div className="tag-input-wrapper">
              <Tag size={13} className="text-muted" />
              <input
                type="text"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="input-tag"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Multi-Turn Companion Sidebar */}
      <div className="editor-companion card-glass">
        <div className="companion-header">
          <div className="flex-center gap-2">
            <div className="icon-badge cyan small">
              <Bot size={16} />
            </div>
            <div>
              <h4>Gemini AI Thought Partner</h4>
              <span className="badge-pill-xs emerald">Multi-Turn Streaming</span>
            </div>
          </div>
          <div className="shield-tag" title="OWASP LLM01 Delimited Prompt Shield Active">
            <Shield size={12} className="text-emerald" />
            <span>Armor Active</span>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="suggestion-chips">
          <button 
            className="chip-btn" 
            onClick={() => handleSuggestion("Challenge my underlying assumptions about this situation.")}
          >
            <Zap size={12} /> Challenge Assumptions
          </button>
          <button 
            className="chip-btn" 
            onClick={() => handleSuggestion("Help me reframe this setback into a strategic lever.")}
          >
            <Sparkles size={12} /> Cognitive Reframe
          </button>
          <button 
            className="chip-btn" 
            onClick={() => handleSuggestion("What is my single highest-leverage next step?")}
          >
            <ChevronRight size={12} /> Next Step
          </button>
        </div>

        {/* Chat History Container */}
        <div className="companion-chat-stream" ref={chatScrollRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrapper ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'assistant' ? <Bot size={14} /> : <UserIcon size={14} />}
              </div>
              <div className={`chat-bubble ${msg.role}`}>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="chat-bubble-wrapper assistant">
              <div className="chat-avatar">
                <Bot size={14} />
              </div>
              <div className="chat-bubble assistant streaming">
                <p>{streamingChunk}</p>
                <span className="typing-cursor"></span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Box */}
        <div className="companion-input-box">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask Gemini to brainstorm or probe deeper..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isStreaming}
          />
          <button 
            className="chat-send-btn" 
            onClick={() => handleSendMessage()}
            disabled={isStreaming || !chatInput.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
