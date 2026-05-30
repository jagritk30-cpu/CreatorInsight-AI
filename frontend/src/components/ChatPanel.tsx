"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatPanel() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: "I've analyzed both videos and populated the vector database! Ask me anything about their engagement, hooks, creators, or content strategy." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: sessionId })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                assistantMsg += `\n\n**Error**: ${data.error}`;
              } else if (data.content) {
                assistantMsg += data.content;
              }
              
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantMsg };
                return newMsgs;
              });
            } catch (e) {
              // Ignore partial JSON chunks that might happen
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, an error occurred while processing your request." }]);
    } finally {
      setLoading(false);
    }
  };

  // Simplistic citation formatter
  const formatContent = (content: string) => {
    const citationRegex = /\[Video ([AB]), Chunk \d+\]/g;
    const parts = content.split(citationRegex);
    const matches = content.match(citationRegex) || [];
    
    if (matches.length === 0) return content;
    
    const elements = [];
    let i = 0;
    while (i < parts.length) {
      elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
      if (i < matches.length) {
        const match = matches[i];
        const isVideoA = match.includes('Video A');
        elements.push(
          <span key={`cite-${i}`} className={`inline-block mx-1 px-2 py-0.5 rounded text-xs font-semibold ${isVideoA ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {match}
          </span>
        );
      }
      i++;
    }
    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-purple-600 mr-3'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm'}`}>
                <div className="whitespace-pre-wrap">{formatContent(msg.content)}</div>
              </div>
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
             <div className="flex flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-600 mr-3 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-800 text-neutral-400 rounded-tl-sm flex items-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the hooks, engagement, or comparisons..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-4 pr-14 text-white focus:outline-none focus:border-neutral-600 transition-colors"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
