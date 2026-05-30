"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import ChatPanel from '@/components/ChatPanel';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [metadata, setMetadata] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('video_metadata');
    if (!data) {
      // If accessed directly without processing
      router.push('/');
      return;
    }
    try {
      setMetadata(JSON.parse(data));
    } catch (e) {
      router.push('/');
    }
  }, [router]);

  if (!metadata) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col p-4 md:p-6 font-sans overflow-hidden">
      <header className="max-w-7xl w-full mx-auto flex-shrink-0 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
            <LayoutDashboard className="text-blue-400 h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Creator<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Insight</span></h1>
        </div>
        <Link href="/" className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm font-medium bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
          <ArrowLeft className="mr-2 h-4 w-4" />
          New Comparison
        </Link>
      </header>

      <main className="max-w-7xl w-full mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-4">
        {/* Left Column: Video Cards */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <VideoCard label="A" data={metadata.video_a} />
          <VideoCard label="B" data={metadata.video_b} />
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-7 flex flex-col min-h-0 h-[600px] lg:h-full">
          <ChatPanel />
        </div>
      </main>
    </div>
  );
}
