import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';

interface Video {
  _id: string;
  title: string;
  youtubeUrl: string;
  description?: string;
  duration: number;
  order: number;
  isRequired: boolean;
}

interface YouTubeVideoPlayerProps {
  video: Video;
  onProgress: (progress: number) => void;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({
  video,
  onProgress,
  onComplete,
  isCompleted = false
}) => {
  const [progress, setProgress] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(isCompleted);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playerRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/.*[?&]v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }
    
    return '';
  };

  const videoId = getYouTubeVideoId(video.youtubeUrl);
  const embedUrl = videoId 
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1`
    : '';

  useEffect(() => {
    // Simulate progress tracking for demo purposes
    if (isPlaying && !isVideoCompleted) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 3, 100);
          onProgress(newProgress);
          
          if (newProgress >= 90 && !isVideoCompleted) {
            setIsVideoCompleted(true);
            onComplete();
          }
          
          return newProgress;
        });
      }, 3000); // Increased interval for more realistic progress
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, isVideoCompleted, onProgress, onComplete]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          {videoId ? (
            <iframe
              ref={playerRef}
              src={embedUrl}
              className="w-full h-full"
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => {
                console.log('YouTube iframe loaded successfully');
                // YouTube iframe is loaded
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <p className="text-lg mb-2">Invalid YouTube URL</p>
                <p className="text-sm text-gray-300">Please check the video URL format</p>
              </div>
            </div>
          )}
          
          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span>Progress: {Math.round(progress)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const iframe = playerRef.current;
                      if (iframe && iframe.requestFullscreen) {
                        iframe.requestFullscreen();
                      }
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
              {video.description && (
                <p className="text-gray-600 text-sm">{video.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isVideoCompleted ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{video.duration > 0 ? formatTime(video.duration) : 'Duration unknown'}</span>
                </div>
              )}
              
              {video.isRequired && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Required
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-gray-500">
              {isVideoCompleted 
                ? 'Video completed successfully'
                : progress >= 90 
                ? 'Almost complete - keep watching!'
                : 'Continue watching to complete this video'
              }
            </div>
          </div>

          {/* Demo Controls */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlay}
              disabled={isPlaying}
            >
              <Play className="w-3 h-3 mr-1" />
              Start Watching
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePause}
              disabled={!isPlaying}
            >
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setProgress(100);
                setIsVideoCompleted(true);
                onComplete();
              }}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark Complete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
