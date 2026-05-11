# SHL Assessment Recommender

AI-powered conversational assistant that helps hiring managers find the right SHL Individual Test Solutions from the official catalog of **389 assessments**.

## Architecture

```
User → Next.js Chat UI → FastAPI Backend → TF-IDF Retrieval + Gemini LLM → Structured JSON Response
```

- **Backend**: Python FastAPI with TF-IDF vector search over 389 scraped SHL assessments
- **Frontend**: Next.js 16 + shadcn/ui + Tailwind CSS + Framer Motion — premium monochromatic dark-mode chat interface
- **LLM**: Google Gemini 2.0 Flash with rule-based fallback when API is unavailable
- **Data**: 389 Individual Test Solutions scraped from shl.com product catalog

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:3000
PORT=8000
```

Start the server:
```bash
cd ..
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Evaluate

```bash
python backend/evaluate.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with catalog stats |
| `/chat` | POST | Main chat endpoint |
| `/api/catalog` | GET | Full assessment catalog |

### POST /chat

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "I need to hire a Java developer"}
  ]
}
```

**Response:**
```json
{
  "reply": "Clarification or recommendation text",
  "recommendations": [
    {
      "name": "Core Java (Advanced Level) (New)",
      "url": "https://www.shl.com/products/product-catalog/view/core-java-advanced-level-new/",
      "test_type": ["K"],
      "remote_testing": true,
      "adaptive_irt": false
    }
  ],
  "end_of_conversation": false
}
```

## Key Behaviors

- **Smart Clarification** — never recommends on turn 1 for vague queries; always clarifies first
- **No Hallucinated URLs** — every URL validated against scraped catalog whitelist
- **Honors Refinements** — mid-conversation changes update the shortlist
- **Off-Topic Rejection** — politely refuses non-assessment questions
- **Graceful Fallback** — rule-based retrieval when LLM is unavailable

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI, scikit-learn (TF-IDF), Google Gemini SDK, python-dotenv |
| **Frontend** | Next.js 16, shadcn/ui, Tailwind CSS v4, Framer Motion |
| **Data** | BeautifulSoup4 (scraping), NumPy |

## Project Structure

```
SHL-Assignment/
├── backend/
│   ├── main.py              # FastAPI app & routes
│   ├── agent.py             # LLM agent + fallback logic
│   ├── retrieval.py         # TF-IDF retrieval engine
│   ├── models.py            # Pydantic schemas
│   ├── config.py            # Environment config
│   ├── scraper.py           # SHL catalog scraper
│   ├── evaluate.py          # Evaluation script
│   ├── requirements.txt     # Python dependencies
│   ├── data/
│   │   └── catalog.json     # 389 scraped assessments
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   └── lib/             # API client & utilities
│   └── package.json
├── Dockerfile
├── .gitignore
└── README.md
```
