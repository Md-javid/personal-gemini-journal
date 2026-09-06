import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, KeyRound, X, AlertCircle, Check } from 'lucide-react';
import { CryptoVault } from '../services/cryptoVault';
import type { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onVaultUnlocked: () => void;
}

export const MindVaultModal: React.FC<Props> = ({ isOpen, onClose, user, onVaultUnlocked }) => {
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnlocked = CryptoVault.isUnlocked();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 6) {
      setError('Passphrase must be at least 6 characters long.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await CryptoVault.deriveKey(passphrase, user.tenantSalt);
      setSuccessMsg('MindVault Unlocked! AES-256-GCM Session Active.');
      setTimeout(() => {
        onVaultUnlocked();
        onClose();
      }, 700);
    } catch (err) {
      setError('Failed to derive encryption key: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLock = () => {
    CryptoVault.lockVault();
    setSuccessMsg('MindVault Locked. Cryptographic key purged from memory.');
    setTimeout(() => {
      onVaultUnlocked();
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container mindvault-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-badge violet">
              <Lock size={22} />
            </div>
            <div>
              <h3>MindVault: Zero-Knowledge Client E2EE</h3>
              <p className="subtitle">AES-GCM-256 Field-Level Cryptography via WebCrypto API</p>
            </div>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="mindvault-infobox">
            <div className="infobox-icon">
              <ShieldCheck size={28} className="text-violet" />
            </div>
            <div>
              <h4>True Zero-Knowledge Privacy</h4>
              <p>
                When enabled, your deepest thoughts are encrypted directly inside your browser before saving to Cloud Firestore. 
                Even database admins or compromised servers cannot read your raw thoughts without your passphrase.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert-banner error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert-banner success">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {isUnlocked ? (
            <div className="vault-unlocked-state">
              <div className="status-badge-large unlocked">
                <Unlock size={24} className="text-emerald" />
                <div>
                  <strong>Vault Status: UNLOCKED</strong>
                  <p>In-memory cryptographic session is active. Encrypted entries can be viewed and saved.</p>
                </div>
              </div>
              <button className="btn-danger-outline" onClick={handleLock}>
                <Lock size={16} /> Lock Vault & Purge Memory
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="vault-unlock-form">
              <div className="form-group">
                <label>
                  <KeyRound size={14} /> Enter MindVault Passphrase
                </label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter secret passphrase (min 6 chars)..."
                  className="input-text"
                  autoFocus
                />
                <span className="input-hint">
                  Derived using 100,000 rounds of PBKDF2 with your unique tenant salt.
                </span>
              </div>

              <div className="form-actions-inline">
                <button 
                  type="submit" 
                  className="btn-primary-violet" 
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Deriving Keys...' : 'Unlock MindVault'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
