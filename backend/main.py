from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import json
import asyncio
import os

from models import ProcessRequest, ProcessResponse, ChatRequest
from extractor import extract_all
from vectorstore import chunk_and_store, clear_vectorstore
from chat import setup_rag_chain

load_dotenv()

app = FastAPI(title="RAG Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage of metadata for the demo
current_metadata_a = None
current_metadata_b = None

@app.post("/api/process", response_model=ProcessResponse)
def process_videos(request: ProcessRequest):
    global current_metadata_a, current_metadata_b
    try:
        if not os.environ.get("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not set.")
            
        print(f"Processing Video A: {request.video_a_url}")
        print(f"Processing Video B: {request.video_b_url}")
        
        # Clear old vectors for a fresh demo run
        clear_vectorstore()
        
        # Extractor and chunking
        meta_a, trans_a = extract_all(str(request.video_a_url))
        chunk_and_store(trans_a, meta_a.video_id, "A")
        
        meta_b, trans_b = extract_all(str(request.video_b_url))
        chunk_and_store(trans_b, meta_b.video_id, "B")
        
        current_metadata_a = meta_a.model_dump()
        current_metadata_b = meta_b.model_dump()
        
        return ProcessResponse(
            video_a=meta_a,
            video_b=meta_b,
            message="Successfully processed videos."
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    global current_metadata_a, current_metadata_b
    if not current_metadata_a or not current_metadata_b:
        raise HTTPException(status_code=400, detail="Please process videos first.")
        
    rag_chain = setup_rag_chain(current_metadata_a, current_metadata_b)
    
    async def generate():
        try:
            # We use astream to directly get chunks from the final chain
            async for chunk in rag_chain.astream(
                {"input": request.message},
                config={"configurable": {"session_id": request.session_id}}
            ):
                if "answer" in chunk:
                    # chunk is a dict when using RunnableWithMessageHistory with dict input/output
                    yield f"data: {json.dumps({'content': chunk['answer']})}\n\n"
                    
            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Chat error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
