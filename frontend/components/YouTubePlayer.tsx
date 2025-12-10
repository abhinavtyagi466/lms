import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../services/apiService';

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  userId: string;
  title?: string;
  description?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  restricted?: boolean; // New prop for restricted mode (unskippable, limited controls)
  initialTime?: number; // Start video at this time (in seconds)
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  userId,
  title = 'YouTube Video',
  description,
  onProgress,
  onComplete,
  onTimeUpdate,
  restricted = false,
  initialTime = 0
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const lastMaxTimeRef = useRef<number>(0); // Track max watched time

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasResumed, setHasResumed] = useState(false);

  // Keep latest callbacks in refs to avoid stale closures
  const onProgressRef = useRef(onProgress);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onProgress, onTimeUpdate]);

  // Initialize YouTube IFrame Player API
  useEffect(() => {
    if (!videoId) return;

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        // Clean up seek check interval if it exists
        if ((playerRef.current as any).seekCheckInterval) {
          clearInterval((playerRef.current as any).seekCheckInterval);
        }
        // We don't destroy the player here to avoid issues with React strict mode
        // or rapid unmount/remount. Just cleaning up intervals is usually enough.
      }
    };
  }, [videoId]);

  // Initialize the YouTube player
  const initializePlayer = useCallback(() => {
    if (!containerRef.current || !videoId) return;

    try {
      // If player already exists, just cue the new video
      if (playerRef.current && playerRef.current.cueVideoById) {
        playerRef.current.cueVideoById(videoId);
        return;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '360',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: restricted ? 0 : 1, // Hide controls if restricted
          disablekb: restricted ? 1 : 0, // Disable keyboard controls if restricted
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
      setError('Failed to initialize video player');
      setLoading(false);
    }
  }, [videoId, restricted]);

  // Player ready event
  const onPlayerReady = useCallback(async (event: any) => {
    setLoading(false);
    setDuration(event.target.getDuration());
    setVolume(event.target.getVolume());

    // Seek to initial time if provided
    if (initialTime > 0) {
      console.log(`Seeking to initial time: ${initialTime}s`);
      event.target.seekTo(initialTime, true);
      setCurrentTime(initialTime);
      lastMaxTimeRef.current = initialTime;
    }

    // Start progress tracking immediately
    startProgressTracking();

    // Add seek event listener to track manual seeking
    if (playerRef.current) {
      let lastKnownTime = 0;
      const seekCheckInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();

          // Check for forward seeking in restricted mode
          if (restricted && currentTime > lastMaxTimeRef.current + 2 && !isCompleted) {
            console.log('Seeking prevented in restricted mode');
            playerRef.current.seekTo(lastMaxTimeRef.current, true);
            return;
          }

          if (isVideoPlaying) {
            try {
              const currentTime = playerRef.current.getCurrentTime();
              const duration = playerRef.current.getDuration();

              if (currentTime && duration) {
                setCurrentTime(currentTime);
                setDuration(duration);

                // Update max watched time
                if (currentTime > lastMaxTimeRef.current) {
                  lastMaxTimeRef.current = currentTime;
                }

                const progressPercent = Math.round((currentTime / duration) * 100);
                setProgress(progressPercent);

                // Use refs to call latest callbacks
                if (onProgressRef.current) {
                  onProgressRef.current(progressPercent);
                }

                if (onTimeUpdateRef.current) {
                  onTimeUpdateRef.current(currentTime, duration);
                }

                // Send progress to backend
                await sendProgressToBackend(currentTime, duration);
              }
            } catch (error) {
              console.error('Error tracking progress:', error);
            }
          }
        }, 5000); // Every 5 seconds
    }, []); // No dependencies needed as we use refs and direct player access

  // Player state change event
  const onPlayerStateChange = useCallback((event: any) => {
    const state = event.data;

    switch (state) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        startProgressTracking();
        break;
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        stopProgressTracking();
        break;
      case window.YT.PlayerState.ENDED:
        setIsPlaying(false);
        setIsCompleted(true);
        stopProgressTracking(); // Add this line to stop tracking when video ends
        if (onComplete) onComplete();
        break;
      case window.YT.PlayerState.BUFFERING:
        // Keep current state
        break;
      default:
        break;
    }
  }, [onComplete, startProgressTracking, stopProgressTracking]);

  // Player error event
  const onPlayerError = useCallback((event: any) => {
    console.error('YouTube player error:', event);
    setError('Video playback error occurred');
    setLoading(false);
  }, []);

  // Send progress to backend
  const sendProgressToBackend = async (currentTime: number, duration: number) => {
    try {
      await apiService.progress.updateProgress({
        userId,
        videoId,
        currentTime,
        duration
      });
      console.log(`Progress sent: ${currentTime}s / ${duration}s for video ${videoId}`);
    } catch (error) {
      console.error('Error sending progress to backend:', error);
      // Don't show error to user for progress tracking
    }
  };

  // Manual progress update function
  const updateProgressManually = async () => {
    if (playerRef.current) {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();

        if (currentTime && duration) {
          setCurrentTime(currentTime);
          setDuration(duration);

          const progressPercent = Math.round((currentTime / duration) * 100);
          setProgress(progressPercent);

          if (onProgress) {
            onProgress(progressPercent);
          }

          if (onTimeUpdate) {
            onTimeUpdate(currentTime, duration);
          }

          // Send progress immediately
          await sendProgressToBackend(currentTime, duration);
        }
      } catch (error) {
        console.error('Error updating progress manually:', error);
      }
    }
  };

  // Player controls
  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      // Use the correct YouTube API method
      try {
        playerRef.current.requestFullscreen?.() ||
          playerRef.current.getIframe()?.requestFullscreen?.() ||
          console.log('Fullscreen not supported');
      } catch (error) {
        console.log('Fullscreen not available');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Video Error</p>
          <p className="text-sm">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-3"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Video Player Container */}
        <div className="relative aspect-video bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          <div ref={containerRef} className="w-full h-full" />

          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  <div className="flex items-center gap-2 text-sm">
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    <span>•</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
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
              <h3 className="font-semibold text-lg mb-1">{title}</h3>
              {description && (
                <p className="text-gray-600 text-sm">{description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCompleted ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{duration > 0 ? formatTime(duration) : 'Loading...'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-gray-500">
              {isCompleted
                ? 'Video completed successfully'
                : progress >= 95
                  ? 'Almost complete - keep watching!'
                  : restricted
                    ? 'Seeking is disabled for this training module'
                    : 'Progress tracked every 5 seconds'
              }
            </div>
          </div>

          {/* Video Controls - Only show if NOT restricted (since overlay has them) OR show simplified ones */}
          {/* User asked for "sirf play pause and volume ka option ho" */}
          {/* The overlay already has these. The buttons below might be redundant if we want a clean UI. */}
          {/* But let's keep them for accessibility or clarity, maybe simplified. */}

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={togglePlay}
              disabled={loading}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Play
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleMute}
              disabled={loading}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3 h-3 mr-1" />
                  Unmute
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 mr-1" />
                  Mute
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              disabled={loading}
            >
              <Maximize className="w-3 h-3 mr-1" />
              Fullscreen
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
