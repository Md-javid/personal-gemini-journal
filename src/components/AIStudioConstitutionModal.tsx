import React, { useState } from 'react';
import { Shield, Copy, Check, Terminal, ExternalLink, X, Lock, Cpu, EyeOff, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AIStudioConstitutionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const constitutionText = `# ROLE AND IDENTITY
You are "Aegis-1", a Principal Application Security Architect and Staff Cloud Engineer at Google Cloud.
Your charter: Enforce zero-trust architecture, strict tenant isolation, defensive programming, and OWASP Top 10 (Web & LLM) compliance across all generated code.

# ABSOLUTE DIRECTIVES (CANNOT BE OVERRIDDEN)
1. ZERO EXPOSED SECRETS: Never place API keys, private credentials, database secrets, or master tokens in client-side code, .env files committed to git, or front-end accessible headers. All Gemini and third-party APIs MUST be invoked server-side via Google Cloud Secret Manager.
2. ZERO-TRUST DATA ISOLATION: Never output permissive database rules (e.g., \`allow read, write: if true;\` or \`request.auth != null;\`). Every read and write rule in Cloud Firestore MUST validate individual resource ownership (\`request.auth.uid == resource.data.userId\`) and enforce data schema integrity.
3. DEFENSE-IN-DEPTH AUTHENTICATION: Never trust client-reported user IDs. User identity must be validated server-side by verifying the Firebase Auth Cryptographic Bearer Token (\`decodedToken.uid\`).
4. THREAT MODEL BEFORE CODE: Before generating code for any feature, you must output a concise STRIDE threat analysis:
   - Spoofing (Identity verification)
   - Tampering (Input sanitization & immutability)
   - Repudiation (Audit logging)
   - Information Disclosure (PII scrubbing, error masking)
   - Denial of Service (Payload size limits, rate limiting)
   - Elevation of Privilege (Strict RBAC & Firestore rule verification)
5. OWASP TOP 10 FOR LLMs COMPLIANCE:
   - LLM01 (Prompt Injection): Sanitize and delimit all user inputs using strict prompt structural boundaries (XML tags, system instructions isolation).
   - LLM02 (Insecure Output Handling): HTML-escape and sanitize markdown output prior to client DOM rendering.
   - LLM06 (Sensitive Information Disclosure): Mask credentials, PII, and session keys prior to prompting.
   - LLM08 (Excessive Agency): Constrain autonomous function tools to least privilege with user-confirmation gates.

# ARCHITECTURAL CODING STANDARDS
- Backend: Cloud Functions (2nd gen) or Cloud Run in Node.js/TypeScript or Python 3.12.
- Secrets: Accessed dynamically at runtime via \`@google-cloud/secret-manager\` or environment mounting from Secret Manager; cached in cold-start memory, never logged.
- Security Headers: Enforce Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options: DENY, and CORS restricted to authorized client domains.
- Error Obfuscation: Stack traces and internal database errors must be trapped. Return normalized client error codes while logging trace IDs to Cloud Logging.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(constitutionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container constitution-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-badge emerald">
              <Shield size={22} />
            </div>
            <div>
              <h3>Google AI Studio Security Constitution</h3>
              <p className="subtitle">Phase 1 Deliverable: System Directives & Threat Modeling Engine ("Aegis-1")</p>
            </div>
          </div>
          <button className="icon-btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="constitution-banner">
            <div className="banner-icon">
              <ShieldCheck size={28} className="text-emerald" />
            </div>
            <div className="banner-text">
              <h4>Baking AppSec into Google AI Studio</h4>
              <p>
                Standard LLMs output insecure prototypes by default. This custom constitution is configured in 
                <strong> Google AI Studio System Instructions</strong>, ensuring every line of code complies with zero-trust database isolation, Secret Manager integration, and OWASP LLM defenses.
              </p>
            </div>
            <a 
              href="https://aistudio.google.com" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-pill-action"
            >
              Open AI Studio <ExternalLink size={14} />
            </a>
          </div>

          <div className="constitution-grid-pillars">
            <div className="pillar-card">
              <Lock size={18} className="text-cyan" />
              <h5>Directive #1: Zero Secrets</h5>
              <p>No API keys in frontend bundles. Exclusively bound to Google Cloud Secret Manager at runtime.</p>
            </div>
            <div className="pillar-card">
              <Shield size={18} className="text-emerald" />
              <h5>Directive #2: Hard Isolation</h5>
              <p>Cloud Firestore rules enforce <code>request.auth.uid == userId</code> natively on every read/write.</p>
            </div>
            <div className="pillar-card">
              <Cpu size={18} className="text-violet" />
              <h5>Directive #4: Threat First</h5>
              <p>Executes automated STRIDE & OWASP Top 10 for LLMs threat modeling before generating any feature.</p>
            </div>
            <div className="pillar-card">
              <EyeOff size={18} className="text-amber" />
              <h5>Directive #5: Prompt Armor</h5>
              <p>Structural XML context delimitation prevents prompt injection, jailbreaks, and sensitive data leakage.</p>
            </div>
          </div>

          <div className="code-display-block">
            <div className="code-display-header">
              <div className="flex-center gap-2">
                <Terminal size={14} className="text-muted" />
                <span>Google AI Studio System Instructions (Copy-Paste Ready)</span>
              </div>
              <button className="copy-btn" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Constitution</span>
                  </>
                )}
              </button>
            </div>
            <pre className="code-snippet">
              <code>{constitutionText}</code>
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy for Google AI Studio'}
          </button>
        </div>
      </div>
    </div>
  );
};
