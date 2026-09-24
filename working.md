# How Dhwani AI Works Under the Hood

Dhwani AI is designed to provide real-time scam and voice-cloning protection during phone calls. This document explains the exact technical flow from the moment a user starts a call to the final generated police report.

## The Architecture
Dhwani AI uses a client-server architecture with continuous real-time communication via WebSockets.

1. **Client (Frontend)**: Built with React, Vite, and Zustand. It handles user interactions, records audio from the microphone, and displays real-time warnings (Coaching Cards).
2. **Server (Backend)**: Built with Node.js and Express. It acts as the orchestrator, bridging the Client with external AI services (Deepgram and Groq) and the database (MongoDB).

---

## The Step-by-Step Flow

### 1. Starting a Session
- The user inputs the caller's number and starts the session.
- The **Client** requests microphone access and begins capturing audio.
- The **Client** emits a `session:start` event via Socket.IO to the **Server**.
- The **Server** initializes a new session state, resetting risk scores and transcripts, and establishes a secure connection with **Deepgram** (Speech-to-Text).

### 2. Real-Time Audio Streaming
- The **Client** fetches a temporary, short-lived Deepgram access token from the **Server** (`/api/deepgram/token`).
- As the user and the caller speak, the **Client** captures the audio in small chunks and streams them directly to **Deepgram's** edge servers via a native WebSocket connection.
- *This zero-hop architecture bypasses the Node.js backend for raw audio entirely, drastically slashing latency and server bandwidth.*

### 3. Speech-to-Text (STT) Processing
- **Deepgram** processes the audio instantly and streams text directly back to the **Client**.
- The **Client** maintains a `rollingTranscript` (keeping a window of the last 400 words to maintain context without overloading the AI) and updates the UI instantly.
- The **Client** emits a `transcript:update` event to the **Server**, passing the latest text for AI analysis.

### 4. AI Risk Analysis (The Core Loop)
- Instead of relying on an arbitrary 10-second timer, the **Server** uses a completely **event-driven** architecture.
- The moment the **Server** receives a `transcript:update` from the Client, it immediately sends the text to the **Groq API** (powered by the Llama 3 model).
- To prevent spamming the Groq API when a user speaks rapidly, the server uses a 2.5-second debounce lock.
- **Groq** analyzes the text for manipulation tactics (fake urgency, asking for money, threats) and returns:
  - **Risk Score**: A number from 0 to 100.
  - **Signal**: The threat level (e.g., Safe, Suspicious, Dangerous).
  - **Coaching**: Exact phrases the user should say to counter the scammer.
- The **Server** sends this data back to the **Client** via a `risk:update` event.
- If the risk score is high, the **Client** uses Framer Motion to instantly slide the Coaching Card onto the screen.

### 5. Post-Call Processing & Reporting
- When the user hangs up, the **Client** emits a `session:end` event.
- The **Server** halts the risk analysis interval and closes the Deepgram connection.
- If the **Peak Risk Score** throughout the call was **less than 40**:
  - The call is deemed safe. The transcript is discarded, and the session is logged without details.
- If the **Peak Risk Score** was **40 or higher**:
  - The **Server** sends the full transcript to Groq for **PII Scrubbing** (Personally Identifiable Information). Names, account numbers, and sensitive details are replaced with placeholders (e.g., `[AADHAAR]`).
  - The scrubbed transcript is then passed to Groq again to **Generate a Formal Report** (FIR format).
  - The report is saved to **MongoDB**.
  - The **Server** emits a `report:ready` event, and the **Client** displays the formal report to the user, who can then export it as a PDF.

## Security and Privacy Highlights
- **No Raw Audio Storage**: Audio bytes are only streamed and never written to a disk on the server.
- **Data Minimization**: The `rollingTranscript` is only kept in memory during the call.
- **AI-Powered Redaction**: PII scrubbing ensures that even if the transcript is saved for a police report, the user's sensitive data is fully protected.

