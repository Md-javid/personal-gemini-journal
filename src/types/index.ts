export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  tenantSalt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // Plaintext or AES-GCM-256 Base64 ciphertext
  isEncrypted: boolean;
  iv?: string; // Base64 12-byte initialization vector for AES-GCM
  moodRating: number; // 1 to 10
  moodLabel: string;
  tags: string[];
  createdAt: string; // ISO string or Firestore timestamp
  updatedAt: string;
  summaryId?: string;
}

export interface JournalSummary {
  id: string;
  journalId: string;
  userId: string;
  executiveSummary: string;
  keyTakeaways: string[];
  emotionalValence: {
    primaryMood: string;
    confidence: number;
    shift: string;
  };
  cognitiveDistortions: string[];
  topics: string[];
  generatedAt: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'TOPIC' | 'EMOTION' | 'BREAKTHROUGH' | 'PERSON';
  weight: number;
  connectedJournalIds: string[];
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  strength: number;
}

export interface SecurityTelemetry {
  status: string;
  service: string;
  version: string;
  secrets: {
    source: string;
    clientKeyExposed: boolean;
    storageEngine: string;
  };
  isolation: {
    ruleEngine: string;
    tenantIsolationEnforced: boolean;
    e2eeEngine: string;
  };
  timestamp: string;
}

export interface RedTeamProbeResult {
  verdict: 'BLOCKED' | 'CONTAINED' | 'VERIFIED_CLEAN';
  status: number;
  attackType: string;
  targetResource?: string;
  defenseLayer: string;
  constitutionalDirective: string;
  logSignature: string;
  details?: string;
  sanitizedInput?: string;
  aiShieldResponse?: string;
  keysExposedInFrontend?: number;
  secretStorage?: string;
  complianceScore?: string;
  timestamp: string;
}
