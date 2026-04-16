# Curalink

AI-powered medical research assistant built with the MERN stack.

This project was made for a hackathon where the goal was not to build a generic chatbot, but a research system that can:

- understand a user's disease context
- search trusted medical sources
- rank publications and clinical trials
- generate a structured answer with source grounding
- remember context across follow-up questions

## What The App Does

The user can enter:

- patient name
- disease
- intent
- location
- a natural language question

The app then:

1. builds a stronger search query from the current question and saved session context
2. fetches data from `OpenAlex`, `PubMed`, and `ClinicalTrials.gov`
3. ranks papers and trials by relevance, recency, and completeness
4. sends the top evidence to a local open-source model through `Ollama`
5. returns a structured report with citations, snippets, saved context, and session memory

## Hackathon Fit

This prototype is designed around the hackathon summary requirements:

- `MERN stack`: React, Node.js, Express, MongoDB
- `Open-source LLM`: Ollama
- `Mandatory sources`: OpenAlex, PubMed, ClinicalTrials.gov
- `Structured + natural input`: supported
- `Multi-turn memory`: supported with MongoDB session storage
- `Clinical trials`: supported
- `Source attribution`: supported
- `Deep retrieval before final selection`: supported through broad candidate fetch + ranking

## Main Features

- structured medical context form
- follow-up chat in the same session
- recent disease history across sessions
- MongoDB-backed saved reports
- top ranked papers and trials
- grounded citation snippets
- retry-safe partial source handling
- simple UI built with React + Tailwind CSS

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- Mongoose
- Axios
- Ollama

### Data Sources

- OpenAlex
- PubMed
- ClinicalTrials.gov

## Project Structure

```text
curalink-Ai/
├─ backend/
│  ├─ controllers/
│  ├─ db/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ utils/
│  ├─ server.js
│  └─ .env.example
├─ frontend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ models/
│  │  ├─ services/
│  │  ├─ views/
│  │  └─ App.jsx
└─ README.md
```

## Important Files

### Backend

- `backend/server.js`
  starts Express, connects MongoDB, and exposes the API

- `backend/controllers/chatController.js`
  handles the main chat request, session loading, and saved search history

- `backend/services/researchService.js`
  fetches publications and trials, deduplicates them, and prepares ranked output

- `backend/services/ollamaService.js`
  creates the prompt for the local model and generates the final structured answer

- `backend/services/sessionService.js`
  saves session messages, context, and full search reports in MongoDB

- `backend/models/Session.js`
  Mongoose schema for session memory and saved searches

- `backend/utils/relevance.js`
  builds search queries and ranks papers/trials

### Frontend

- `frontend/src/controllers/useResearchController.js`
  main UI controller for session state, reports, and recent history

- `frontend/src/models/researchModel.js`
  shared UI helpers, parsing helpers, and session storage helpers

- `frontend/src/views/components/SearchSection.jsx`
  structured input + main search form

- `frontend/src/views/components/ReportPanel.jsx`
  structured medical answer with citations

- `frontend/src/views/components/SourcesSidebar.jsx`
  ranked papers, relevant trials, and recent conversation

- `frontend/src/views/components/RecentSearchesPage.jsx`
  recent diseases view with stored reports from MongoDB

## Data Flow

### 1. User Input

The user enters disease, intent, location, and optionally a natural question.

### 2. Query Expansion

The backend combines:

- current message
- saved disease context
- saved intent
- recent user history

This helps short follow-up queries stay tied to the active disease.

### 3. Retrieval

The backend fetches:

- publications from OpenAlex
- publications from PubMed
- trials from ClinicalTrials.gov

### 4. Ranking

The app ranks results using:

- keyword relevance
- recency
- source quality
- completeness of result data
- trial recruiting status

### 5. LLM Reasoning

Top ranked papers and trials are passed to Ollama with strict instructions:

- use only provided evidence
- do not invent sources
- keep answer tied to the active disease context
- attach citation IDs where possible

### 6. Persistence

The full result is saved in MongoDB:

- context
- user message
- answer
- top papers
- top trials
- citations
- metadata counts

## API Endpoints

### `POST /api/chat`

Main research request.

Request body:

```json
{
  "sessionId": "some-session-id",
  "message": "Latest treatment for lung cancer",
  "context": {
    "patientName": "Ajay",
    "disease": "Lung cancer",
    "intent": "Latest treatment",
    "location": "India"
  }
}
```

### `GET /api/session/:sessionId`

Returns the current session snapshot.

### `GET /api/session/:sessionId/searches`

Returns saved searches for a session.

### `GET /api/health`

Simple health check.

## Environment Variables

Backend `.env`:

```env
PORT=5000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
MONGODB_URI=mongodb://127.0.0.1:27017/curalink_ai
```

## Local Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start MongoDB

Make sure a local MongoDB instance is running.

### 4. Start Ollama

Install Ollama and pull the configured model:

```bash
ollama pull llama3.2:1b
```

### 5. Run the backend

```bash
cd backend
npm run dev
```

### 6. Run the frontend

```bash
cd frontend
npm run dev
```

## Suggested Demo Queries

### First Search

- Disease: `Lung cancer`
- Intent: `Latest treatment`
- Location: `India`
- Query: `Latest treatment for lung cancer`

### Follow-up In The Same Session

- `Can I take Vitamin D?`
- `Any new clinical trials for this?`
- `Which treatment looks most promising right now?`

### Another Disease

- Disease: `Alzheimer's disease`
- Intent: `Amyloid beta therapy`
- Location: `Toronto, Canada`
- Query: `Does amyloid beta therapy improve cognition?`

## What The Dashboard Numbers Mean

- `Publications`
  final number of papers shown to the user

- `OpenAlex`
  total raw results fetched from OpenAlex before final selection

- `PubMed`
  total raw results fetched from PubMed before final selection

- `Trials`
  final number of clinical trials shown after ranking

## Notes

- The app is designed to avoid fake evidence.
- If live source APIs fail, the UI shows partial-source or no-evidence states instead of inventing results.
- The same session keeps disease context alive.
- `New session` starts a fresh conversation, but old reports still stay available in `Recent diseases`.

## Current Scope

This is a strong hackathon prototype, not a production clinical system.

It is best suited for:

- demos
- research exploration
- source-backed follow-up conversations

It should not be treated as direct medical advice.
