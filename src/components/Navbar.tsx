import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Network, 
  BookOpen, 
  FileCode, 
  LogOut, 
  LogIn, 
  Users, 
  Check, 
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import type { UserProfile } from '../types';
import { CryptoVault } from '../services/cryptoVault';
import { FirebaseService } from '../services/firebase';
import { AppSecRadar } from './AppSecRadar';

interface Props {
  user: UserProfile | null;
  activeView: 'JOURNALS' | 'EDITOR' | 'MESH';
  setActiveView: (view: 'JOURNALS' | 'EDITOR' | 'MESH') => void;
  onOpenConstitution: () => void;
  onOpenMindVault: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<Props> = ({
  user,
  activeView,
  setActiveView,
  onOpenConstitution,
  onOpenMindVault,
  onOpenAuth
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isVaultUnlocked = CryptoVault.isUnlocked();
  const isLiveFirebase = FirebaseService.isLiveFirebase();
  const sandboxUsers = FirebaseService.getAvailableSandboxUsers();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleSwitchSandbox = (uid: string) => {
    FirebaseService.switchSandboxUser(uid);
    setShowUserDropdown(false);
  };

  const handleLogout = async () => {
    await FirebaseService.logout();
    setShowUserDropdown(false);
  };

  return (
    <header className="navbar-container">
      <div className="nav-left">
        <div className="brand-badge" onClick={() => setActiveView('JOURNALS')}>
          <div className="brand-icon-wrapper">
            <Shield size={20} className="text-emerald" />
          </div>
          <div className="brand-text">
            <span className="brand-name">AEGIS</span>
            <span className="brand-sub">Gemini Journal</span>
          </div>
        </div>

        {/* View Switchers */}
        <nav className="nav-links">
          <button 
            className={`nav-tab ${activeView === 'JOURNALS' || activeView === 'EDITOR' ? 'active' : ''}`}
            onClick={() => setActiveView('JOURNALS')}
          >
            <BookOpen size={16} />
            <span>Journal Vault</span>
          </button>

          <button 
            className={`nav-tab ${activeView === 'MESH' ? 'active' : ''}`}
            onClick={() => setActiveView('MESH')}
          >
            <Network size={16} />
            <span>Cognitive Mesh</span>
          </button>
        </nav>
      </div>

      {/* Center / Security HUD */}
      <div className="nav-center">
        <AppSecRadar />
      </div>

      {/* Right Action Tools & Profile */}
      <div className="nav-right">
        {/* Phase 1 AI Studio Constitution Viewer */}
        <button 
          className="btn-pill-ghost" 
          onClick={onOpenConstitution}
          title="Inspect Google AI Studio Security Directives & Constitution"
        >
          <FileCode size={15} className="text-emerald" />
          <span>AI Constitution</span>
        </button>

        {/* MindVault E2EE Status */}
        <button 
          className={`btn-pill-ghost vault-status ${isVaultUnlocked ? 'unlocked' : ''}`}
          onClick={onOpenMindVault}
          title={isVaultUnlocked ? 'MindVault Unlocked (Session Key in Memory)' : 'MindVault Locked (Click to enter Passphrase)'}
        >
          {isVaultUnlocked ? (
            <>
              <Unlock size={14} className="text-emerald" />
              <span>Vault Unlocked</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-violet" />
              <span>MindVault E2EE</span>
            </>
          )}
        </button>

        {/* Theme Toggle Button (Light/Dark Glassmorphism) */}
        <button 
          className="btn-pill-ghost theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            <>
              <Moon size={14} className="text-violet" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={14} className="text-amber" />
              <span>Light</span>
            </>
          )}
        </button>

        {/* User Account / Evaluator Switcher */}
        {user ? (
          <div className="profile-menu-wrapper" ref={profileMenuRef}>
            <button 
              type="button"
              className={`profile-btn ${showUserDropdown ? 'active' : ''}`}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title={`${user.displayName} (${isLiveFirebase ? 'Firebase Auth' : 'Sandbox Evaluator'})`}
              aria-expanded={showUserDropdown}
            >
              <div className="avatar-circle">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="profile-label">
                <span className="user-name">{user.displayName}</span>
                <span className="user-role">
                  {isLiveFirebase ? 'Firebase Auth' : 'Sandbox Evaluator'}
                </span>
              </div>
              <ChevronDown size={14} className={`profile-chevron text-muted ${showUserDropdown ? 'rotated' : ''}`} />
            </button>

            {showUserDropdown && (
              <div className="dropdown-menu card-glass">
                <div className="dropdown-header">
                  <strong>{user.displayName}</strong>
                  <span className="user-email">{user.email}</span>
                </div>

                {!isLiveFirebase && (
                  <div className="dropdown-section">
                    <div className="section-title">
                      <Users size={12} />
                      <span>Switch Evaluator (Test Isolation)</span>
                    </div>
                    {sandboxUsers.map(u => (
                      <button
                        key={u.uid}
                        className={`dropdown-item ${user.uid === u.uid ? 'active' : ''}`}
                        onClick={() => handleSwitchSandbox(u.uid)}
                      >
                        <div className="flex-center gap-2">
                          <span className="user-dot"></span>
                          <span>{u.displayName}</span>
                        </div>
                        {user.uid === u.uid && <Check size={14} className="text-emerald" />}
                      </button>
                    ))}
                  </div>
                )}

                <div className="dropdown-divider"></div>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn-primary" onClick={onOpenAuth}>
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
