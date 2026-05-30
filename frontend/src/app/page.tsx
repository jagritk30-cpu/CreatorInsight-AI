"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlA || !urlB) {
      setError("Please provide two video URLs.");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Backend handles fetching and vector insertion
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/api/process`, {
        video_a_url: urlA,
        video_b_url: urlB
      });
      
      localStorage.setItem("video_metadata", JSON.stringify(response.data));
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred while processing the videos. Make sure the backend is running and the URLs are valid.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Compare <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Creators</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Paste two video URLs (YouTube or Instagram) to get an AI-powered breakdown of engagement, hooks, and strategy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Video className="h-5 w-5 text-neutral-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="url"
                required
                value={urlA}
                onChange={(e) => setUrlA(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Video A URL (e.g. YouTube)"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Video className="h-5 w-5 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <input
                type="url"
                required
                value={urlB}
                onChange={(e) => setUrlB(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-sm"
                placeholder="Video B URL (e.g. Instagram Reel)"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-4 rounded-2xl shadow-lg shadow-blue-900/20 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Analyzing (this can take 2-3 mins the first time)
              </span>
            ) : (
              <span className="flex items-center">
                Analyze Videos
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
