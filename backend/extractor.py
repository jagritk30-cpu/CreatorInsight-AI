import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from faster_whisper import WhisperModel
import os
import re
from models import VideoMetadata
import tempfile
import glob

whisper_model = None

def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        # Load whisper model lazily to save startup time
        whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
    return whisper_model

def extract_video_id(url: str) -> str:
    try:
        if "youtube.com" in url or "youtu.be" in url:
            match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
            if match:
                return match.group(1)
        if "instagram.com/reel" in url or "instagram.com/p" in url:
            return url.rstrip('/').split('/')[-1]
    except Exception:
        pass
    return "unknown"

def get_metadata(url: str) -> VideoMetadata:
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False, # we need full info
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
    views = info.get('view_count', 0)
    likes = info.get('like_count', 0)
    comments = info.get('comment_count', 0)
    
    # calc engagement
    engagement = 0
    if views and views > 0:
        engagement = ((likes or 0) + (comments or 0)) / views * 100
        
    return VideoMetadata(
        video_id=info.get('id', extract_video_id(url)),
        url=url,
        platform=info.get('extractor', 'unknown'),
        title=info.get('title'),
        creator=info.get('uploader') or info.get('channel'),
        follower_count=info.get('channel_follower_count', 0),
        views=views,
        likes=likes,
        comments=comments,
        upload_date=info.get('upload_date'),
        duration=info.get('duration'),
        hashtags=info.get('tags', []),
        engagement_rate=engagement
    )

def get_transcript_yt(video_id: str) -> str:
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([t['text'] for t in transcript])
    except Exception as e:
        print(f"YouTube transcript extraction failed: {e}")
        return ""

def download_audio_and_transcribe(url: str) -> str:
    with tempfile.TemporaryDirectory() as temp_dir:
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': f'{temp_dir}/audio.%(ext)s',
            'quiet': True,
        }
        print(f"Downloading audio for {url}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # Find the downloaded file
        downloaded_files = glob.glob(f"{temp_dir}/audio.*")
        if not downloaded_files:
            return "Could not download audio."
        
        audio_path = downloaded_files[0]
        
        print(f"Transcribing audio from {audio_path}...")
        model = get_whisper_model()
        segments, _ = model.transcribe(audio_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        return text

def extract_all(url: str):
    metadata = get_metadata(url)
    platform = metadata.platform.lower()
    
    transcript = ""
    if 'youtube' in platform:
        transcript = get_transcript_yt(metadata.video_id)
        
    if not transcript:
        # Fallback to downloading audio and using whisper
        transcript = download_audio_and_transcribe(url)
        
    return metadata, transcript
