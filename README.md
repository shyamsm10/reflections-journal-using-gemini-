# Reflections Journal — AI Reflection Sanctuary with Gemini 3.6 Flash & Cloud Firestore

A private, user-authenticated journaling and multi-turn reflection application built with **Google Gemini 3.6 Flash API**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore**.

---

## 🌟 Application Architecture & Features

- **Federated Google Authentication**: Secure passwordless identity outsourcing credential handling to Firebase Auth.
- **Strict User-Isolated Cloud Firestore Storage**: Every user's reflections, prompts, and summaries are strictly scoped to `/users/{userId}/...` backed by production security rules.
- **Gemini 3.6 Flash Reflection Engine**: Multi-turn dialogue, deep reflection synthesis, Socratic inquiry, and brainstorming personas.
- **Resilient Fallback Ladder**: Built-in fallback chain (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`) with error recovery.
- **Zero-Crash Payload Hygiene**: Strict undefined-stripping and defensive payload deserialization.
- **Full-Stack Express + Vite**: Secure server-side proxy preventing API key leakage to browser clients.

---

## 🛡️ Firestore Security Rules

Deploy the following owner-bound security rules to ensure user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Private User Isolation: Users can only read and write their own documents and subcollections
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

To deploy rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🔐 Google Cloud Secret Manager Setup

Store your Gemini API key securely in Google Cloud Secret Manager and grant access to the Cloud Run service account:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the secret and add your Gemini API Key
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run runtime service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment & Campaign Verification

### 1. Build and Deploy to Cloud Run

```bash
# Set your deployment variables
export SERVICE_NAME="reflections-journal"
export REGION="us-central1"

# Deploy container to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

### 2. Apply Mandatory Campaign Verification Label

Apply the required resource label to register the service for automated challenge verification:

```bash
gcloud run services update ${SERVICE_NAME} \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=${REGION}
```

---

## 🧪 Comprehensive Functional Test Walkthrough

| Test Case ID | Feature / Process | Interaction Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Landing Page Unauthenticated State | Visit root URL with no active session. | Landing page is displayed with clear value propositions, security guarantees, and Google Sign-In CTA. |
| **TC-02** | Google Sign-In Authentication | Click **"Continue with Google"** on landing page. | Firebase Google Auth popup opens; upon approval, user profile is loaded and redirected to the private dashboard. |
| **TC-03** | Initial Welcome Entry Creation | Authenticate as a first-time user. | An initial welcoming reflection entry is automatically initialized and saved under `/users/{userId}/entries`. |
| **TC-04** | Title & Journal Content Auto-Save | Edit the title and type text into the reflection textarea. | The debounced auto-save triggers, sync badge transitions to "Saving...", and turns to "Firestore Synced" upon completion. |
| **TC-05** | Reflection Mode Switching | Click between *Deep Reflection*, *Creative Brainstorming*, *Synthesis*, *Socratic*, or *Action*. | Mode tab updates, prompt placeholder adjusts, and suggested exploration chips update accordingly. |
| **TC-06** | Mood Tracking Selection | Click on any mood icon (🌿 Calm, 🤔 Thoughtful, ✨ Optimistic, etc.). | The active mood is updated on the entry and persisted to Firestore. |
| **TC-07** | Inspiration Prompt Insertion | Click **"Inspiration Prompt"** button. | A random curated self-reflection prompt is appended to the journal canvas. |
| **TC-08** | Multi-Turn Gemini Dialogue | Type a question or click a suggested prompt chip (e.g., *"What core lesson is hidden here?"*). | Message is added to the conversation stream; Gemini responds with formatted markdown insights and model attribution (`gemini-3.6-flash`). |
| **TC-09** | AI Response Copying | Click the **"Copy"** button on Gemini's message bubble. | Content is copied to clipboard, and button changes to "Copied" with green checkmark. |
| **TC-10** | Session Summary & Synthesis | Click the **"Summarize"** button in the top toolbar. | Gemini synthesizes Core Essence, Emotional Themes, Key Insights, and Micro-Actions into an expandable gold card. |
| **TC-11** | Manual Firestore Save | Click the **"Save"** button in the top toolbar. | Manual save completes with a confirmation toast: "Saved to Firestore". |
| **TC-12** | Create New Reflection | Click **"+ New Reflection"** in the navbar or sidebar. | A new blank reflection entry is created, selected, and synced immediately. |
| **TC-13** | Pin / Unpin Reflection | Click the Pin icon on an entry in the sidebar. | Entry moves to the "Pinned" section at the top of the history list. |
| **TC-14** | Search & Filter History | Type a keyword into the sidebar search bar or select a mood filter pill. | Entries are dynamically filtered in real-time by title, content, mood, and messages. |
| **TC-15** | Delete Reflection with Confirmation | Click the Trash icon on an entry in the sidebar, then confirm "Delete". | The entry document is removed from Firestore and UI seamlessly switches to the next entry. |
| **TC-16** | Journal Export (Markdown / Text / JSON) | Click **"Export"** and choose Markdown (.md). | A formatted Markdown file containing the reflection, AI synthesis, and dialogue is downloaded. |
| **TC-17** | Activity & Insights Modal | Click the **"Entries / Insights"** button in the navbar. | Modal displays word count, total Gemini turns, emotional tone breakdown, and reflection mode percentages. |
| **TC-18** | Security Architecture & Threat Modal | Click the **"Security"** button in the navbar. | Displays the 5-zone Threat Summary Table, owner-bound pathing diagram, and deployed `firestore.rules`. |
| **TC-19** | User Sign Out | Click the Sign Out icon in the user profile pill. | Session terminates, state is cleared, and user returns to the unauthenticated landing page. |

---

## 📋 Environment Variables Reference

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-Side | API key for Gemini 3.6 Flash generation and fallback models. |
| `APP_URL` | Server-Side | Service URL injected by Cloud Run / AI Studio. |
| `NODE_ENV` | Server-Side | Environment mode (`development` vs `production`). |
