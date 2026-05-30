from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from vectorstore import get_vectorstore

# In-memory store for chat history
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        streaming=True
    )

def setup_rag_chain(metadata_a: dict, metadata_b: dict):
    llm = get_llm()
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    
    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
    )
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )
    
    meta_a_str = f"Video A - Platform: {metadata_a.get('platform')}, Creator: {metadata_a.get('creator')} ({metadata_a.get('follower_count')} followers), Views: {metadata_a.get('views')}, Engagement Rate: {metadata_a.get('engagement_rate', 0):.2f}%"
    meta_b_str = f"Video B - Platform: {metadata_b.get('platform')}, Creator: {metadata_b.get('creator')} ({metadata_b.get('follower_count')} followers), Views: {metadata_b.get('views')}, Engagement Rate: {metadata_b.get('engagement_rate', 0):.2f}%"
    
    system_prompt = (
        "You are an expert social media analyst RAG chatbot.\n"
        "You are analyzing two videos: Video A and Video B.\n"
        f"Metadata info:\n{meta_a_str}\n{meta_b_str}\n\n"
        "Use the provided retrieved context (which contains chunks of video transcripts) to answer the user's question. "
        "If you don't know the answer, say that you don't know. "
        "IMPORTANT: When using information from the context, you MUST cite your sources immediately after using the information, "
        "using this exact format: [Video A, Chunk X] or [Video B, Chunk Y]. The chunk index and video label are provided in the context metadata.\n\n"
        "Context:\n{context}"
    )
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    # We need to format the context so it includes the video label and chunk index for citations
    def format_docs(docs):
        formatted = []
        for d in docs:
            label = d.metadata.get("label", "Unknown")
            chunk_idx = d.metadata.get("chunk_index", 0)
            formatted.append(f"--- Document: [Video {label}, Chunk {chunk_idx}] ---\n{d.page_content}")
        return "\n\n".join(formatted)
    
    # Actually create_stuff_documents_chain expects documents, so we can override document_prompt or document_variable_name
    from langchain_core.prompts import PromptTemplate
    document_prompt = PromptTemplate.from_template(
        "Source: [Video {label}, Chunk {chunk_index}]\nContent: {page_content}"
    )
    
    question_answer_chain = create_stuff_documents_chain(
        llm, 
        qa_prompt,
        document_prompt=document_prompt
    )
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    
    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )
    
    return conversational_rag_chain
