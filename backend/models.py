from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any

class ProcessRequest(BaseModel):
    video_a_url: HttpUrl
    video_b_url: HttpUrl

class VideoMetadata(BaseModel):
    video_id: str
    url: str
    platform: str
    title: Optional[str] = None
    creator: Optional[str] = None
    follower_count: Optional[int] = None
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    upload_date: Optional[str] = None
    duration: Optional[float] = None
    hashtags: Optional[List[str]] = []
    engagement_rate: Optional[float] = None
    
class ProcessResponse(BaseModel):
    video_a: VideoMetadata
    video_b: VideoMetadata
    message: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
