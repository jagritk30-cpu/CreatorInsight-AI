import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from chromadb.config import Settings
import chromadb

# Initialize local Chroma client
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_embeddings_model():
    # Make sure GEMINI_API_KEY is set in environment
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")

def get_vectorstore():
    return Chroma(
        client=chroma_client,
        collection_name="video_chunks",
        embedding_function=get_embeddings_model()
    )

def chunk_and_store(transcript: str, video_id: str, label: str):
    """
    label is 'A' or 'B' to distinguish the two videos.
    """
    if not transcript.strip():
        return
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    chunks = text_splitter.split_text(transcript)
    
    documents = [
        Document(
            page_content=chunk,
            metadata={"video_id": video_id, "label": label, "chunk_index": i}
        )
        for i, chunk in enumerate(chunks)
    ]
    
    vectorstore = get_vectorstore()
    if documents:
        vectorstore.add_documents(documents)
    
def clear_vectorstore():
    try:
        chroma_client.delete_collection("video_chunks")
    except Exception:
        pass
    chroma_client.get_or_create_collection("video_chunks")
