# SHL Assessment Recommender

> **AI-powered conversational assistant** that helps hiring managers find the right SHL Individual Test Solutions from the official product catalog of **389 assessments**.

Built as a full-stack application with a **FastAPI** backend (TF-IDF retrieval + Gemini LLM) and a **Next.js 16** frontend featuring a premium monochromatic dark-mode chat interface.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Architecture Overview](#architecture-overview)
- [System Flow](#system-flow)
- [How It Works — Step by Step](#how-it-works--step-by-step)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Evaluation](#evaluation)
- [Key Behaviors](#key-behaviors)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend — Next.js 16"]
        UI["Chat Interface<br/><i>Framer Motion + shadcn/ui</i>"]
        API_CLIENT["API Client<br/><i>fetch → /chat</i>"]
    end

    subgraph Backend["⚙️ Backend — FastAPI"]
        ROUTER["API Router<br/><i>/chat · /health · /api/catalog</i>"]
        AGENT["LLM Agent<br/><i>agent.py</i>"]
        RETRIEVER["TF-IDF Retriever<br/><i>retrieval.py</i>"]
        SANITIZER["Response Sanitizer<br/><i>URL Whitelist Validator</i>"]
    end

    subgraph External["☁️ External Services"]
        GEMINI["Google Gemini 2.0 Flash"]
    end

    subgraph Data["💾 Data Layer"]
        CATALOG["catalog.json<br/><i>389 Assessments</i>"]
        TFIDF["TF-IDF Matrix<br/><i>scikit-learn</i>"]
    end

    UI -->|User Message| API_CLIENT
    API_CLIENT -->|POST /chat| ROUTER
    ROUTER --> AGENT
    AGENT -->|1. Extract Query| RETRIEVER
    RETRIEVER --> TFIDF
    TFIDF --> CATALOG
    RETRIEVER -->|Top-10 Assessments| AGENT
    AGENT -->|2. Prompt + Context| GEMINI
    GEMINI -->|JSON Response| AGENT
    AGENT -->|3. Validate| SANITIZER
    SANITIZER -->|Clean Response| ROUTER
    ROUTER -->|JSON| API_CLIENT
    API_CLIENT -->|Render| UI

    style Frontend fill:#1a1a2e,stroke:#ffffff20,color:#fff
    style Backend fill:#16213e,stroke:#ffffff20,color:#fff
    style External fill:#0f3460,stroke:#ffffff20,color:#fff
    style Data fill:#1a1a2e,stroke:#ffffff20,color:#fff
```

---

## System Flow

### End-to-End Request Lifecycle

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js Frontend
    participant API as FastAPI Backend
    participant Ret as TF-IDF Retriever
    participant LLM as Gemini 2.0 Flash
    participant Val as URL Validator

    User->>UI: Types hiring requirement
    UI->>API: POST /chat {messages}

    Note over API: Step 1 — Query Extraction
    API->>API: Extract keywords from last 4 user messages

    Note over API,Ret: Step 2 — Retrieval
    API->>Ret: retrieve(query, top_k=10)
    Ret->>Ret: TF-IDF vectorize query
    Ret->>Ret: Cosine similarity against 389 assessments
    Ret-->>API: Top-10 relevant assessments

    Note over API,LLM: Step 3 — LLM Generation
    API->>LLM: System prompt + retrieved context + conversation
    LLM-->>API: Structured JSON response

    Note over API,Val: Step 4 — Sanitization
    API->>Val: Validate all recommended URLs
    Val-->>API: Clean recommendations (hallucinated URLs removed)

    API-->>UI: {reply, recommendations[], end_of_conversation}
    UI-->>User: Renders reply + assessment cards
```

### Conversation Decision Logic

```mermaid
flowchart TD
    A["📩 User Message Received"] --> B{"Is this the<br/>first turn?"}

    B -->|Yes| C{"Is the query<br/>vague?"}
    B -->|No| D{"Enough context<br/>to recommend?"}

    C -->|"Yes<br/>(< 2 of: role, level, skills)"| E["🔄 Ask Clarifying Questions<br/><i>Return empty recommendations</i>"]
    C -->|"No<br/>(detailed JD or specific test)"| F["🔍 Retrieve & Recommend"]

    D -->|Yes| F
    D -->|No| E

    F --> G["TF-IDF Retrieval<br/><i>Top-10 from 389 assessments</i>"]
    G --> H{"Gemini API<br/>available?"}

    H -->|Yes| I["LLM generates contextual reply<br/>+ curated recommendations"]
    H -->|No| J["Rule-based fallback<br/><i>Return top retrieved results</i>"]

    I --> K["Sanitize Response<br/><i>Validate URLs against whitelist</i>"]
    J --> K

    K --> L{"Any valid<br/>recommendations?"}
    L -->|Yes| M["✅ Return reply + assessment cards"]
    L -->|No| N["⚠️ Fallback to retrieved results"]
    N --> M

    style A fill:#1a1a2e,stroke:#fff3,color:#fff
    style E fill:#2d1b69,stroke:#fff2,color:#fff
    style F fill:#1b3a4b,stroke:#fff2,color:#fff
    style M fill:#1b4332,stroke:#fff2,color:#fff
```

---

## How It Works — Step by Step

### 1. Data Collection — Web Scraper

```mermaid
flowchart LR
    A["🌐 SHL Product Catalog<br/><i>shl.com/products/product-catalog</i>"] -->|"32 pages × 12 items"| B["🕷️ scraper.py<br/><i>BeautifulSoup4</i>"]
    B -->|"Parse HTML tables"| C["Extract per assessment:<br/>• Name & URL<br/>• Remote testing ✓/✗<br/>• Adaptive IRT ✓/✗<br/>• Test type codes"]
    C -->|"JSON"| D["📄 catalog.json<br/><i>389 assessments</i>"]

    style A fill:#1a1a2e,stroke:#fff3,color:#fff
    style D fill:#1b4332,stroke:#fff2,color:#fff
```

Each assessment record contains:

```json
{
  "name": "Account Manager Solution",
  "url": "https://www.shl.com/products/product-catalog/view/account-manager-solution/",
  "remote_testing": true,
  "adaptive_irt": true,
  "test_type": ["C", "P", "A", "B"],
  "test_type_labels": ["Competency", "Personality & Behavior", "Ability & Aptitude", "Biodata & SJT"],
  "description": ""
}
```

### 2. Indexing — TF-IDF Vector Space

```mermaid
flowchart LR
    A["📄 catalog.json"] --> B["Build Searchable Text<br/><i>name + description + type labels<br/>+ remote/adaptive flags</i>"]
    B --> C["TfidfVectorizer<br/><i>ngram_range=(1,2)<br/>max_features=5000<br/>sublinear_tf=True</i>"]
    C --> D["TF-IDF Matrix<br/><i>389 × 5000 sparse matrix</i>"]

    style D fill:#1b3a4b,stroke:#fff2,color:#fff
```

**Why TF-IDF over embeddings?**
- Zero external API calls at retrieval time
- Sub-millisecond query latency
- No GPU or heavy model dependencies
- Excellent for structured catalog data with distinctive keywords

### 3. Retrieval — Cosine Similarity Search

When a user query arrives:

1. **Query extraction** — Last 4 user messages are concatenated
2. **Vectorization** — Query is transformed using the fitted TF-IDF vectorizer
3. **Similarity** — Cosine similarity computed against all 389 assessment vectors
4. **Ranking** — Top-10 results returned (threshold: score > 0.01)

### 4. LLM Agent — Gemini 2.0 Flash

The agent receives:
- **System prompt** with behavioral rules + retrieved assessment context
- **Conversation history** (last 8 messages / 4 turns)
- **Output format** enforced via `response_mime_type="application/json"`

```mermaid
flowchart TD
    A["System Prompt"] --> D["Gemini API Call"]
    B["Retrieved Assessments<br/><i>formatted as numbered list</i>"] --> A
    C["Conversation History<br/><i>last 4 turns</i>"] --> D
    D --> E["Structured JSON"]
    E --> F["Sanitize & Validate URLs"]
    F --> G["Final Response"]

    style D fill:#0f3460,stroke:#fff2,color:#fff
    style G fill:#1b4332,stroke:#fff2,color:#fff
```

### 5. Response Sanitization

Every LLM response passes through a sanitizer that:
- ✅ Validates all URLs against the catalog whitelist (389 known URLs)
- ✅ Removes hallucinated URLs that don't exist in the catalog
- ✅ Falls back to raw retrieval results if LLM hallucinated all URLs
- ✅ Caps recommendations at 10 items max
- ✅ Enforces the response schema (reply, recommendations, end_of_conversation)

### 6. Graceful Fallback

```mermaid
flowchart TD
    A["Gemini API Call"] -->|Success| B["Parse JSON Response"]
    A -->|"429 Rate Limit<br/>or Network Error"| C["Rule-Based Fallback"]

    C --> D{"Query Type?"}
    D -->|"Off-topic<br/>(weather, jokes, etc.)"| E["Polite refusal<br/><i>'I can only help with SHL assessments'</i>"]
    D -->|"Vague query<br/>(first turn)"| F["Ask 3 clarifying questions<br/><i>role, level, key skills</i>"]
    D -->|"Detailed query"| G["Return top-6 TF-IDF results<br/><i>with generic reply</i>"]

    style C fill:#2d1b69,stroke:#fff2,color:#fff
    style B fill:#1b4332,stroke:#fff2,color:#fff
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 | React framework with App Router |
| | Tailwind CSS v4 | Utility-first styling |
| | shadcn/ui | Accessible UI primitives |
| | Framer Motion | Smooth animations & transitions |
| | Lucide React | Icon system |
| **Backend** | FastAPI | Async Python web framework |
| | scikit-learn | TF-IDF vectorization & cosine similarity |
| | Google GenAI SDK | Gemini 2.0 Flash integration |
| | Pydantic | Request/response validation |
| | python-dotenv | Environment variable management |
| **Data** | BeautifulSoup4 | HTML parsing for catalog scraping |
| | NumPy | Numerical operations |
| **Infra** | Docker | Containerized backend deployment |
| | Uvicorn | ASGI server |

---

## Project Structure

```
SHL-Assignment/
│
├── backend/                    # Python FastAPI backend
│   ├── main.py                 # App entrypoint, routes, CORS
│   ├── agent.py                # LLM agent logic + fallback
│   ├── retrieval.py            # TF-IDF retrieval engine
│   ├── models.py               # Pydantic request/response schemas
│   ├── config.py               # Environment configuration
│   ├── scraper.py              # SHL catalog web scraper
│   ├── evaluate.py             # Recall@10 evaluation script
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   └── data/
│       └── catalog.json        # 389 scraped SHL assessments
│
├── frontend/                   # Next.js 16 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with Geist fonts
│   │   │   ├── page.tsx        # Main page with ambient effects
│   │   │   └── globals.css     # Design system & custom animations
│   │   ├── components/
│   │   │   ├── chat-interface.tsx       # Core chat component
│   │   │   ├── welcome-screen.tsx      # Landing screen with suggestions
│   │   │   ├── recommendation-card.tsx # Assessment result cards
│   │   │   ├── typing-indicator.tsx    # Animated loading indicator
│   │   │   └── ui/                     # shadcn/ui primitives
│   │   └── lib/
│   │       ├── api.ts          # Backend API client
│   │       └── utils.ts        # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
├── Dockerfile                  # Backend containerization
├── .gitignore
├── test_gemini.py              # Standalone Gemini API test
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/berserk3142-max/SHL-Assignment.git
cd SHL-Assignment
```

### 2. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:3000
PORT=8000
```

Start the backend server (from the project root):

```bash
cd ..
python -m uvicorn backend.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to **[http://localhost:3000](http://localhost:3000)** — the chat interface will be ready.

```mermaid
flowchart LR
    A["Backend<br/>localhost:8000"] <-->|"REST API"| B["Frontend<br/>localhost:3000"]
    B <-->|"Chat UI"| C["👤 User"]

    style A fill:#1b3a4b,stroke:#fff2,color:#fff
    style B fill:#1a1a2e,stroke:#fff2,color:#fff
```

---

## API Reference

### `GET /health`

Health check with catalog statistics.

**Response:**
```json
{
  "status": "ok",
  "catalog_size": 389,
  "indexed": true
}
```

### `POST /chat`

Main conversational endpoint.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I need to hire a Java developer" },
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "Mid-level, needs OOP and testing skills" }
  ]
}
```

**Response:**
```json
{
  "reply": "Based on your requirements for a mid-level Java developer...",
  "recommendations": [
    {
      "name": "Core Java (Advanced Level) (New)",
      "url": "https://www.shl.com/products/product-catalog/view/core-java-advanced-level-new/",
      "test_type": ["K"],
      "duration": null,
      "remote_testing": true,
      "adaptive_irt": false,
      "description": ""
    }
  ],
  "end_of_conversation": false
}
```

### `GET /api/catalog`

Returns the full assessment catalog.

**Response:**
```json
{
  "assessments": [...],
  "total": 389
}
```

---

## Evaluation

The project includes an evaluation script that tests recommendation quality using **Recall@10**.

```bash
python backend/evaluate.py
```

### Test Traces

| # | Scenario | Input | Expected Behavior |
|---|----------|-------|-------------------|
| 1 | Java Developer – Mid Level | Multi-turn: "hire Java dev" → "mid-level, OOP" | Recommend Java assessments |
| 2 | Sales Manager | "Senior sales manager, negotiation & leadership" | Recommend sales-specific tests |
| 3 | Data Analyst – Python | "Data analyst, Python and SQL, entry level" | Recommend Python & SQL tests |
| 4 | Personality for Leadership | "Personality assessments for leadership roles" | Recommend OPQ / leadership personality |
| 5 | Vague Query | "I need an assessment" | Should **clarify**, not recommend |

### Metrics

- **Recall@10**: Fraction of expected assessments found in top-10 predictions
- **Mean Score**: Average recall across all test traces

---

## Key Behaviors

| Behavior | Description |
|----------|-------------|
| 🔄 **Smart Clarification** | Never recommends on turn 1 for vague queries — asks about role, level, and key skills first |
| 🔗 **No Hallucinated URLs** | Every recommended URL is validated against the 389-URL catalog whitelist |
| 🔧 **Mid-Conversation Refinement** | Honors constraint changes (e.g., "actually, make it remote-only") |
| 🚫 **Off-Topic Rejection** | Politely refuses weather, jokes, recipes — stays on SHL assessments |
| 🛡️ **Graceful Fallback** | When Gemini API is unavailable (rate limit, network), falls back to rule-based TF-IDF retrieval |
| 📊 **Capped Context** | Conversation window limited to last 8 messages (4 turns) for efficiency |
| 🎯 **Max 10 Recommendations** | Responses are capped at 10 assessment cards |

---

## Assessment Type Codes

| Code | Full Name | Description |
|------|-----------|-------------|
| **A** | Ability & Aptitude | Cognitive ability, verbal/numerical reasoning |
| **B** | Biodata & SJT | Situational judgment, biographical data |
| **C** | Competency | Competency-based evaluations |
| **D** | Development & 360 | Development reports, 360° feedback |
| **E** | Assessment Exercises | Practical exercises and simulations |
| **K** | Knowledge & Skills | Domain-specific knowledge tests |
| **P** | Personality & Behavior | Personality profiling (e.g., OPQ) |
| **S** | Simulations | Interactive work simulations |

---

## Deployment

### Docker (Backend)

```bash
docker build -t shl-backend .
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key shl-backend
```

### Render / Railway

- **Backend**: Deploy as Web Service using the `Dockerfile`
- **Frontend**: Deploy as a Static Site or Node.js service
  ```bash
  cd frontend && npm run build
  ```
- Set `GEMINI_API_KEY` as an environment variable in the deployment dashboard

---

## Design Philosophy

The frontend follows an **AETHER-inspired** monochromatic design system:

- ⬛ Pure black (`#0a0a0a`) background with subtle white radial glows
- 🔲 Glassmorphic cards with `backdrop-blur` and `border: white/6%`
- ✨ Sparkles icon for AI identity — replacing traditional colored avatars
- ⬜ White send button & user message bubbles for high contrast
- 🔤 Geist font family with tight tracking (`-0.02em` to `-0.04em`)
- 🎬 Framer Motion entrance animations with spring easing

---

## License

This project was built as part of an SHL assignment submission.
