# CreatorInsight AI: RAG Chatbot for Social Media Comparison

CreatorInsight AI is a full-stack RAG (Retrieval-Augmented Generation) Chatbot designed to compare two social media videos side-by-side (YouTube and Instagram Reels). It extracts transcripts and metadata, computes engagement rates, and provides a dynamic chat interface to analyze hooks, strategy, and performance.

## Architecture & Tech Stack

This project is built with an "engineer-first" mindset, balancing performance, ease of use, and local testability.

*   **Frontend**: Next.js 15 (React), Tailwind CSS, Framer Motion, Lucide Icons.
    *   *Why?* Next.js provides the best Developer Experience for React. Tailwind allows for rapid "vibe-coding" to create a sleek, dynamic interface.
*   **Backend**: FastAPI (Python).
    *   *Why?* FastAPI is the industry standard for AI/ML backends. It handles asynchronous streaming natively and integrates perfectly with LangChain.
*   **Orchestration**: LangChain.
    *   *Why?* LangChain's `create_retrieval_chain` and `RunnableWithMessageHistory` provide a robust framework for managing conversational memory and formatting RAG prompts.
*   **Embeddings & LLM**: Google Gemini (`gemini-1.5-flash` & `text-embedding-004`).
    *   *Why?* Gemini offers a massive context window and rapid inference speed, which is critical for real-time streaming chat experiences.
*   **Vector DB**: ChromaDB.
    *   *Why?* For this demonstration, ChromaDB runs entirely locally without requiring external cloud accounts or complex Docker setups. This makes evaluating the repository frictionless.
*   **Extraction**: `yt-dlp`, `youtube-transcript-api`, and `faster-whisper`.
    *   *Why?* YouTube provides transcripts directly, making `youtube-transcript-api` the fastest option. However, Instagram Reels rarely have accessible transcripts. `yt-dlp` reliably fetches metadata and audio for both. For Instagram (or missing YT transcripts), `faster-whisper` runs a local transcription model on the CPU to ensure we always have text to embed.

## Core Features
- **Dynamic Input**: Paste any YouTube or IG Reel URL.
- **Engagement Calculation**: Automatically computes `((likes + comments) / views) * 100`.
- **RAG + Citations**: The chatbot grounds its answers in the transcripts and explicitly cites its sources (e.g., `[Video A, Chunk 3]`).
- **Real-time Streaming**: SSE streaming ensures a fluid chat experience.
- **Vibe-coded UI**: Glassmorphic elements, smooth gradients, and micro-animations.

## Trade-offs and Design Decisions

1.  **Vector DB (Chroma vs. Pinecone/Qdrant)**:
    I chose ChromaDB specifically because it requires zero configuration for the reviewer. If scaling this to 10,000+ creators daily, I would migrate to **Qdrant** or **Pinecone** for distributed, cloud-native vector search. Local SQLite-based Chroma will bottleneck under high concurrent write loads.
2.  **Chunk Size**:
    Transcripts are chunked at `1000` characters with a `200` character overlap.
    *Why?* Social media scripts are fast-paced. A 1000-character chunk roughly equates to 1-2 minutes of spoken text, capturing enough context for "hooks" or "transitions" without diluting the semantic meaning of the embedding. Overlap prevents cutting sentences in half.
3.  **Instagram Extraction**:
    Relying on unofficial APIs or scraping (like `instaloader`) often results in IP bans. I used `yt-dlp` to download the audio track and `faster-whisper` for local transcription. This is incredibly resilient but introduces a 5-10 second overhead during processing. At scale, this transcription pipeline would be offloaded to an asynchronous Celery/Redis worker queue rather than blocking the HTTP request.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- FFmpeg (Required for `yt-dlp` to extract audio for Whisper)
  - Mac: `brew install ffmpeg`

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to start comparing creators.
