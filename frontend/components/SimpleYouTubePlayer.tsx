import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card } from './ui/card';
import { toast } from 'sonner';

interface SimpleYouTubePlayerProps {
  videoId: string;
  title: string;
  description?: string;
}

export const SimpleYouTubePlayer: React.FC<SimpleYouTubePlayerProps> = ({
  videoId,
  title,
  description
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Get YouTube embed URL
  const getEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&autoplay=0&controls=1&showinfo=1&iv_load_policy=3&fs=1`;
  };

  // Update video progress
  const updateProgress = (progress: number) => {
    setVideoProgress(progress);
    
    if (progress >= 100) {
      toast.success('Video completed! 🎉');
    }
  };

  // Start video session
  const startVideo = () => {
    setIsPlaying(true);
    toast.info('Video started - progress tracking active');
  };

  // Pause video session
  const pauseVideo = () => {
    setIsPlaying(false);
    toast.info('Video paused');
  };

  // Handle video load
  const handleVideoLoad = () => {
    console.log('YouTube video loaded successfully');
    startVideo();
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-black aspect-video">
        <iframe
          ref={playerRef}
          src={getEmbedUrl(videoId)}
          className="w-full h-full"
          allowFullScreen
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          onLoad={handleVideoLoad}
        />
        
        {/* Video Overlay Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 text-white hover:bg-black/90"
            onClick={() => {
              const newProgress = Math.min(videoProgress + 10, 100);
              updateProgress(newProgress);
            }}
          >
            +10% Progress
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/70 text-white hover:bg-black/90"
            onClick={() => {
              if (playerRef.current) {
                if (playerRef.current.requestFullscreen) {
                  playerRef.current.requestFullscreen();
                }
              }
            }}
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4 text-white">
            <div className="flex-1">
              <Progress value={videoProgress} className="h-2 bg-white/20" />
            </div>
            <span className="text-sm font-medium">{Math.round(videoProgress)}% Complete</span>
          </div>
        </div>
      </div>
        
      {/* Video Controls */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isPlaying) {
                  startVideo();
                } else {
                  pauseVideo();
                }
              }}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? ' Pause' : ' Play'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newProgress = Math.min(videoProgress + 10, 100);
                updateProgress(newProgress);
              }}
            >
              +10% Progress
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Progress: {Math.round(videoProgress)}%
            </div>
            <Progress value={videoProgress} className="w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
};
