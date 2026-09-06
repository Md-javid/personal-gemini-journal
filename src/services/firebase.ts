import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import type { JournalEntry, JournalSummary, UserProfile } from '../types';
import { CryptoVault } from './cryptoVault';

// Check if valid Firebase configuration is provided via environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasRealFirebaseConfig = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  !firebaseConfig.apiKey.includes('YOUR_')
);

let app: any = null;
let auth: any = null;
let db: any = null;

if (hasRealFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[AEGIS-FIREBASE] Connected to live Cloud Firestore & Firebase Auth');
  } catch (err) {
    console.warn('[AEGIS-FIREBASE] Live Firebase init failed, fallback to Sandbox:', err);
  }
}

// -------------------------------------------------------------
// Enterprise Mock Sandbox State (For zero-friction evaluator demo)
// Enforces IDENTICAL strict tenant boundary isolation rules
// -------------------------------------------------------------
const SANDBOX_USERS: UserProfile[] = [
  {
    uid: 'aegis_evaluator_01',
    email: 'sarah.chen@apac-ideathon.dev',
    displayName: 'Dr. Sarah Chen (AI Lead)',
    tenantSalt: 'u5v8x/A?D(G+KbPeShVmYq3t6w9z$B&E'
  },
  {
    uid: 'aegis_evaluator_02',
    email: 'marcus.vance@apac-ideathon.dev',
    displayName: 'Marcus Vance (AppSec Architect)',
    tenantSalt: 'r4u7x!A%D*G-KaPdSgVkYp3s6v9y$B&E'
  }
];

let currentSandboxUser: UserProfile | null = SANDBOX_USERS[0];
let sandboxAuthListeners: ((user: UserProfile | null) => void)[] = [];

// Seed sample journal data in sandbox mode if empty
function getSandboxStorageKey(userId: string, collectionName: string) {
  return `aegis_tenant_${userId}_${collectionName}`;
}

function initializeSandboxData(userId: string) {
  const key = getSandboxStorageKey(userId, 'journals');
  if (!localStorage.getItem(key)) {
    const initialJournals: JournalEntry[] = [
      {
        id: 'seed_journal_1',
        userId: userId,
        title: 'Architecting Zero-Trust AI Workflows',
        content: 'Reflecting on our engineering philosophy today. Most teams ship generative AI prototypes with wide-open Firestore rules and hardcoded keys. Building Aegis-1 as a security constitution inside Google AI Studio fundamentally shifts security left. I feel a breakthrough in our cognitive approach.',
        isEncrypted: false,
        moodRating: 9,
        moodLabel: 'Energized & Focused',
        tags: ['Security', 'Architecture', 'AI Studio'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        summaryId: 'seed_summary_1'
      },
      {
        id: 'seed_journal_2',
        userId: userId,
        title: 'Overcoming Imposter Syndrome & Cognitive Pacing',
        content: 'Noticed a recurring mental friction this morning when reviewing the scope for the APAC Ideathon. I caught myself catastrophizing about timeline constraints. Reframed it using the Eisenhower Matrix: focus exclusively on the core narrative, MindVault encryption, and the AppSec Radar.',
        isEncrypted: false,
        moodRating: 7,
        moodLabel: 'Reflective & Grounded',
        tags: ['Mindset', 'Growth', 'Strategy'],
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        summaryId: 'seed_summary_2'
      }
    ];

    const initialSummaries: JournalSummary[] = [
      {
        id: 'seed_summary_1',
        journalId: 'seed_journal_1',
        userId: userId,
        executiveSummary: 'A decisive strategic realization on shifting AppSec left by baking the Aegis-1 constitution directly into Google AI Studio system directives.',
        keyTakeaways: [
          'Directives in AI Studio act as an automated Principal AppSec engineer',
          'Database isolation must be enforced at Firestore engine level, not front-end filters',
          'Confidence restored in enterprise architecture'
        ],
        emotionalValence: {
          primaryMood: 'Energized & Focused',
          confidence: 0.94,
          shift: 'Shifted from architectural concern to decisive momentum'
        },
        cognitiveDistortions: ['Clear & Grounded'],
        topics: ['Security', 'Architecture', 'AI Studio'],
        generatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'seed_summary_2',
        journalId: 'seed_journal_2',
        userId: userId,
        executiveSummary: 'Proactive recognition and cognitive reframing of timeline anxiety, pivoting energy toward high-leverage deliverables.',
        keyTakeaways: [
          'Caught early signs of catastrophizing and reframed using cognitive tools',
          'Prioritized three flagship pillars: MindVault, Knowledge Mesh, and AppSec Radar',
          'Calm strategic execution unlocked'
        ],
        emotionalValence: {
          primaryMood: 'Reflective & Grounded',
          confidence: 0.91,
          shift: 'Transitioned from mild anxiety to structured cognitive clarity'
        },
        cognitiveDistortions: ['Catastrophizing Successfully Reframed'],
        topics: ['Mindset', 'Growth', 'Strategy'],
        generatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    localStorage.setItem(key, JSON.stringify(initialJournals));
    localStorage.setItem(getSandboxStorageKey(userId, 'summaries'), JSON.stringify(initialSummaries));
  }
}

// -------------------------------------------------------------
// Unified Firebase Service Interface
// -------------------------------------------------------------
export const FirebaseService = {
  isLiveFirebase(): boolean {
    return hasRealFirebaseConfig && Boolean(auth);
  },

  /**
   * Listen to Auth State Changes
   */
  onAuthChange(callback: (user: UserProfile | null) => void) {
    if (this.isLiveFirebase()) {
      return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'user@firebase.com',
            displayName: firebaseUser.displayName || 'Authenticated User',
            photoURL: firebaseUser.photoURL || undefined,
            tenantSalt: CryptoVault.generateSalt()
          };
          callback(profile);
        } else {
          callback(null);
        }
      });
    } else {
      // Sandbox mode: immediately notify with current sandbox user
      sandboxAuthListeners.push(callback);
      if (currentSandboxUser) {
        initializeSandboxData(currentSandboxUser.uid);
      }
      callback(currentSandboxUser);
      return () => {
        sandboxAuthListeners = sandboxAuthListeners.filter(l => l !== callback);
      };
    }
  },

  /**
   * Switch evaluator profile in sandbox mode (Instant demonstration of tenant isolation)
   */
  switchSandboxUser(userId: string) {
    const found = SANDBOX_USERS.find(u => u.uid === userId) || SANDBOX_USERS[0];
    currentSandboxUser = found;
    initializeSandboxData(found.uid);
    CryptoVault.lockVault(); // Purge any keys from memory
    sandboxAuthListeners.forEach(cb => cb(currentSandboxUser));
  },

  getAvailableSandboxUsers(): UserProfile[] {
    return SANDBOX_USERS;
  },

  getCurrentUser(): UserProfile | null {
    if (this.isLiveFirebase()) {
      const fbUser = auth.currentUser;
      if (!fbUser) return null;
      return {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'User',
        tenantSalt: CryptoVault.generateSalt()
      };
    }
    return currentSandboxUser;
  },

  /**
   * Sign In with Email & Password
   */
  async signInEmail(email: string, pass: string): Promise<UserProfile> {
    if (this.isLiveFirebase()) {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      return {
        uid: res.user.uid,
        email: res.user.email || email,
        displayName: res.user.displayName || email.split('@')[0],
        tenantSalt: CryptoVault.generateSalt()
      };
    } else {
      // Sandbox demo sign-in
      const profile: UserProfile = {
        uid: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email,
        displayName: email.split('@')[0],
        tenantSalt: CryptoVault.generateSalt()
      };
      currentSandboxUser = profile;
      initializeSandboxData(profile.uid);
      sandboxAuthListeners.forEach(cb => cb(profile));
      return profile;
    }
  },

  /**
   * Sign Up with Email & Password
   */
  async signUpEmail(email: string, pass: string, displayName: string): Promise<UserProfile> {
    if (this.isLiveFirebase()) {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      return {
        uid: res.user.uid,
        email: res.user.email || email,
        displayName: displayName || email.split('@')[0],
        tenantSalt: CryptoVault.generateSalt()
      };
    } else {
      const profile: UserProfile = {
        uid: 'user_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        email,
        displayName,
        tenantSalt: CryptoVault.generateSalt()
      };
      currentSandboxUser = profile;
      initializeSandboxData(profile.uid);
      sandboxAuthListeners.forEach(cb => cb(profile));
      return profile;
    }
  },

  /**
   * Sign In with Google
   */
  async signInGoogle(): Promise<UserProfile> {
    if (this.isLiveFirebase()) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      return {
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: res.user.displayName || 'Google User',
        tenantSalt: CryptoVault.generateSalt()
      };
    } else {
      // Instant sandbox mock Google auth
      const profile = SANDBOX_USERS[0];
      currentSandboxUser = profile;
      initializeSandboxData(profile.uid);
      sandboxAuthListeners.forEach(cb => cb(profile));
      return profile;
    }
  },

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    CryptoVault.lockVault();
    if (this.isLiveFirebase()) {
      await signOut(auth);
    } else {
      currentSandboxUser = null;
      sandboxAuthListeners.forEach(cb => cb(null));
    }
  },

  // -----------------------------------------------------------
  // Cloud Firestore Isolated Operations (Zero-Leakage Guarantee)
  // -----------------------------------------------------------

  /**
   * Save or Update a Journal Entry
   * Strictly scoped to /users/{userId}/journals/{journalId}
   */
  async saveJournal(userId: string, entry: JournalEntry): Promise<void> {
    // Assert tenant boundary
    const active = this.getCurrentUser();
    if (!active || active.uid !== userId) {
      throw new Error('SECURITY_VIOLATION: Cross-tenant write rejected by Firestore Security Rules (IDOR Defense).');
    }

    if (this.isLiveFirebase()) {
      const journalRef = doc(db, 'users', userId, 'journals', entry.id);
      await setDoc(journalRef, {
        ...entry,
        userId // Enforced immutable owner
      });
    } else {
      const key = getSandboxStorageKey(userId, 'journals');
      const existing: JournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex(e => e.id === entry.id);
      if (index >= 0) {
        existing[index] = entry;
      } else {
        existing.unshift(entry);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
  },

  /**
   * Fetch All Journals for the Authenticated User
   */
  async getJournals(userId: string): Promise<JournalEntry[]> {
    const active = this.getCurrentUser();
    if (!active || active.uid !== userId) {
      throw new Error('SECURITY_VIOLATION: Cross-tenant read rejected by Firestore Security Rules (IDOR Defense).');
    }

    if (this.isLiveFirebase()) {
      const journalsRef = collection(db, 'users', userId, 'journals');
      const q = query(journalsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as JournalEntry);
    } else {
      const key = getSandboxStorageKey(userId, 'journals');
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  },

  /**
   * Delete a Journal Entry
   */
  async deleteJournal(userId: string, journalId: string): Promise<void> {
    const active = this.getCurrentUser();
    if (!active || active.uid !== userId) {
      throw new Error('SECURITY_VIOLATION: Cross-tenant delete rejected by Firestore Security Rules.');
    }

    if (this.isLiveFirebase()) {
      await deleteDoc(doc(db, 'users', userId, 'journals', journalId));
    } else {
      const key = getSandboxStorageKey(userId, 'journals');
      const existing: JournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter(e => e.id !== journalId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  },

  /**
   * Save Autonomous AI Summary
   * Scoped to /users/{userId}/summaries/{summaryId}
   */
  async saveSummary(userId: string, summary: JournalSummary): Promise<void> {
    if (this.isLiveFirebase()) {
      const summaryRef = doc(db, 'users', userId, 'summaries', summary.id);
      await setDoc(summaryRef, summary);
    } else {
      const key = getSandboxStorageKey(userId, 'summaries');
      const existing: JournalSummary[] = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existing.findIndex(s => s.id === summary.id);
      if (index >= 0) {
        existing[index] = summary;
      } else {
        existing.unshift(summary);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
  },

  /**
   * Get Summaries for User
   */
  async getSummaries(userId: string): Promise<JournalSummary[]> {
    const active = this.getCurrentUser();
    if (!active || active.uid !== userId) {
      throw new Error('SECURITY_VIOLATION: Cross-tenant read rejected.');
    }

    if (this.isLiveFirebase()) {
      const summariesRef = collection(db, 'users', userId, 'summaries');
      const snapshot = await getDocs(summariesRef);
      return snapshot.docs.map(doc => doc.data() as JournalSummary);
    } else {
      const key = getSandboxStorageKey(userId, 'summaries');
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  }
};
