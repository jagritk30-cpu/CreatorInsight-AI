import { motion } from 'framer-motion';
import { Video, Camera, Users, Eye, ThumbsUp, MessageSquare, Activity } from 'lucide-react';

interface VideoMetadata {
  video_id: string;
  url: string;
  platform: string;
  title?: string;
  creator?: string;
  follower_count?: number;
  views?: number;
  likes?: number;
  comments?: number;
  upload_date?: string;
  duration?: number;
  engagement_rate?: number;
}

interface VideoCardProps {
  label: 'A' | 'B';
  data: VideoMetadata;
}

export default function VideoCard({ label, data }: VideoCardProps) {
  const isYoutube = data.platform.toLowerCase().includes('youtube');
  
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-neutral-900 border ${label === 'A' ? 'border-blue-500/30 shadow-blue-900/20' : 'border-purple-500/30 shadow-purple-900/20'} rounded-2xl p-5 shadow-xl flex flex-col`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`text-xs font-bold px-3 py-1 rounded-full ${label === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
          Video {label}
        </div>
        {isYoutube ? (
          <Video className="w-6 h-6 text-red-500" />
        ) : (
          <Camera className="w-6 h-6 text-pink-500" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-white line-clamp-2 mb-2 min-h-[56px]">
        {data.title || 'Untitled Video'}
      </h3>
      
      <div className="text-neutral-400 text-sm mb-4 flex items-center">
        <span className="truncate">{data.creator || 'Unknown Creator'}</span>
        <span className="mx-2">•</span>
        <span>{formatNumber(data.follower_count)} followers</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <StatCard icon={<Eye className="w-4 h-4 text-blue-400" />} label="Views" value={formatNumber(data.views)} />
        <StatCard icon={<Activity className="w-4 h-4 text-green-400" />} label="Eng. Rate" value={`${data.engagement_rate?.toFixed(2) || '0'}%`} />
        <StatCard icon={<ThumbsUp className="w-4 h-4 text-pink-400" />} label="Likes" value={formatNumber(data.likes)} />
        <StatCard icon={<MessageSquare className="w-4 h-4 text-purple-400" />} label="Comments" value={formatNumber(data.comments)} />
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-neutral-950 rounded-xl p-3 flex flex-col items-start border border-neutral-800">
      <div className="flex items-center text-neutral-500 text-xs mb-1">
        {icon}
        <span className="ml-1.5 uppercase font-medium">{label}</span>
      </div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}
