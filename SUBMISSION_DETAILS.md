# APAC Ideathon Submission Details

> **Deadline Alert**: Submission window closes at midnight today. Everything below is tailored, verified, and ready to copy-paste directly into the Google Form.

---

### 1. Working Prototype Link Deployed on Cloud Run or a link to a blog/video that shows a walkthrough of the app.
```text
https://md-javid.github.io/personal-gemini-journal/
```
*(Secondary Walkthrough & Cloud Run Dockerfile Repository: `https://github.com/Md-javid/personal-gemini-journal#readme` | Cloud Run Service Endpoint: `https://personal-gemini-journal-238060128762.asia-south1.run.app`)*

---

### 2. Demo Social Post Link (Use the #AccelerateAIwithCloudRun hashtag in the post to be eligible)
**Action**: Copy the post template below, publish it on LinkedIn or X (Twitter) in 30 seconds, then copy and paste your post URL into the form.

#### Ready-to-Post Social Media Content:
```text
🚀 Excited to share my submission for the APAC Ideathon: AEGIS — Personal Gemini Journal & Zero-Knowledge MindVault! 🛡️✨

Most AI prototypes fail in production due to exposed API keys and open database rules. AEGIS solves this by configuring Google AI Studio with a strict AppSec Security Constitution before generating a single line of code, featuring a redesigned frosted glassmorphic UI with light & dark themes:

✅ Production Cloud Run container gateway with Secret Manager key retrieval (0 client keys)
✅ Multi-turn conversational journaling with Gemini 2.0 Flash + autonomous session summaries
✅ Hardened Cloud Firestore tenant isolation rules (zero cross-user leakage)
✅ MindVault: Browser-native WebCrypto AES-GCM-256 Client-Side E2EE
✅ Cognitive Knowledge Mesh & Temporal Serendipity Graph
✅ Real-time AppSec Radar with interactive Red-Team attack simulator

🌐 Live Working Prototype: https://md-javid.github.io/personal-gemini-journal/
📂 Public Repository: https://github.com/Md-javid/personal-gemini-journal

#AccelerateAIwithCloudRun #GoogleCloud #Gemini #Firebase #AppSec #BuildWithAI
```

---

### 3. Public Code Repository Link (Public Access - Github or GitLab)
```text
https://github.com/Md-javid/personal-gemini-journal
```

---

### 4. Brief Description of Your Solution (please include how you are leveraging Firebase, Firestore, Cloud Run and Gemini in your submission).
*(Character Count: 994 / 1024 max)*

```text
AEGIS Personal Gemini Journal brings enterprise-grade security to AI journaling by configuring Google AI Studio with a strict AppSec Constitution before code generation:
• Cloud Run: Deploys our containerized serverless gateway, strictly proxying all AI requests with zero client-side key exposure via Google Cloud Secret Manager.
• Firebase Auth: Manages secure user authentication with cryptographic JWT token verification on every turn.
• Cloud Firestore: Eliminates cross-tenant data leakage via hardened rules (request.auth.uid == userId) and immutable schemas.
• Gemini 2.0: Powers multi-turn streaming journaling with prompt injection armor (<user_journal_context>) and autonomous background summarization (executive insights, emotional shifts, key takeaways).
• MindVault E2EE: Browser-native WebCrypto AES-GCM-256 field-level encryption.
• Cognitive Mesh: Force-directed thought graph with temporal serendipity alerts.
• AppSec Radar: Real-time HUD with live Red Team attack simulations.
```

---

### 5. Select and confirm the services you have utilized in your project
Check all of the following boxes:
- [x] **User authentication via Firebase**
- [x] **Multi-turn interaction with the Gemini API**
- [x] **User-isolated Firestore document storage**
- [x] **Secure API key retrieval via Google Cloud Secret Manager.**
- [x] **Others (Please make sure to mention in Brief Description of Your Solution)**  
  *(Mentioned: Google Cloud Run, WebCrypto API for MindVault AES-GCM-256 E2EE, and text-embedding-004 for the Cognitive Knowledge Mesh)*
