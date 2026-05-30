# CreatorInsight AI: RAG Chatbot for Social Media Comparison

**Live Demo:** [https://creator-insight-ai.vercel.app/](https://creator-insight-ai.vercel.app/)

CreatorInsight AI is a full-stack Retrieval-Augmented Generation (RAG) platform built to contextually analyze and compare short-form social media video content (YouTube Shorts & Instagram Reels). It handles automated extraction of metadata and transcripts, computes standardized engagement metrics, and provides a real-time SSE (Server-Sent Events) streaming chat interface to interrogate video hooks, pacing, and retention strategies.

## System Architecture

The project is built with a focus on decoupling the frontend presentation layer from the heavy synchronous ML processing pipeline on the backend.

*   **Frontend (Presentation Layer)**: Built with Next.js 15 (React), Tailwind CSS, and Framer Motion. 
    *   *Rationale:* Next.js App Router provides a highly optimized edge-ready architecture. The UI is designed to be highly responsive, handling SSE streams natively without blocking the main thread, resulting in a perceived zero-latency chat experience.
*   **Backend (API & AI Orchestration)**: FastAPI (Python 3.12).
    *   *Rationale:* FastAPI's ASGI foundation is crucial for handling the long-lived, I/O bound requests inherent in LLM generation and streaming. It serves as the primary orchestration layer, integrating `LangChain` to construct the RAG chain and manage conversational memory (`RunnableWithMessageHistory`).
*   **Vector Search & Embeddings**: ChromaDB & Google Gemini (`gemini-embedding-2` & `gemini-1.5-flash`).
    *   *Rationale:* Gemini 1.5 Flash was selected for its exceptional inference speed and massive context window, making it ideal for processing multi-document RAG contexts. ChromaDB is used as an embedded vector store to ensure the application remains highly portable for local development and rapid deployment.
*   **Ingestion Pipeline**: `yt-dlp`, `youtube-transcript-api`, and `faster-whisper`.
    *   *Rationale:* YouTube transcripts are fetched directly via API for near-instant retrieval. However, Instagram Reels lack native transcript access. To solve this, the pipeline falls back to `yt-dlp` to extract the raw audio track, which is then passed through `faster-whisper`—a highly optimized CTranslate2 implementation of OpenAI's Whisper model—allowing for rapid, local transcription on CPU without relying on expensive third-party APIs.

## Engineering Trade-offs & Scalability Roadmap

While the current architecture is optimized for rapid deployment and high-quality inference, scaling this to process 1,000+ creators daily requires addressing specific bottlenecks:

1.  **Synchronous Ingestion Blocking:**
    *   *Current:* The HTTP request blocks while downloading audio and running `faster-whisper`.
    *   *At Scale:* Introduce an asynchronous task queue (e.g., Celery with Redis or RabbitMQ). The API would return a `202 Accepted` with a job ID, and the frontend would poll or use WebSockets for completion status.
2.  **Vector Database Portability:**
    *   *Current:* ChromaDB runs locally (SQLite-backed).
    *   *At Scale:* Migrate the vector store to a managed, distributed solution like Pinecone or Qdrant to handle concurrent high-volume read/writes and ensure persistence across container restarts.
3.  **Transcription Compute Costs:**
    *   *Current:* `faster-whisper` runs locally.
    *   *At Scale:* To process thousands of videos rapidly, maintaining GPU-backed instances for Whisper is expensive. It would be more cost-efficient to offload the audio to a specialized provider like Deepgram or AssemblyAI, which offer high-concurrency transcription at fractions of a cent per minute.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- FFmpeg (Required for audio extraction)
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

Open `creator-insight-ai.vercel.app` to start the application locally.
