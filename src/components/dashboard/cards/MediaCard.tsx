import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Shuffle, 
  Repeat,
  Music
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MediaTrack } from '@/data/dashboard';

interface MediaCardProps {
  track: MediaTrack;
  className?: string;
}

/**
 * Media card showing current track with play/pause controls
 */
const MediaCard: React.FC<MediaCardProps> = ({
  track,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Convert time string to seconds
  const timeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Convert seconds to time string
  const secondsToTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = timeToSeconds(track.duration);
  const initialCurrentTime = timeToSeconds(track.currentTime);

  useEffect(() => {
    setCurrentTime(initialCurrentTime);
  }, [initialCurrentTime]);

  // Simulate playback progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalDuration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const progressPercentage = (currentTime / totalDuration) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Music className="h-4 w-4" />
          Now Playing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Track Information */}
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg leading-tight">
              {track.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {track.artist}
            </p>
            <p className="text-xs text-muted-foreground">
              {track.album}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={totalDuration}
              step={1}
              onValueChange={handleProgressChange}
              className="w-full"
              aria-label="Track progress"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{secondsToTime(currentTime)}</span>
              <span>{track.duration}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="lg"
              onClick={handlePlayPause}
              className="w-12 h-12 rounded-full"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsShuffled(!isShuffled)}
                className={isShuffled ? 'text-primary' : 'text-muted-foreground'}
                aria-label={isShuffled ? "Turn off shuffle" : "Turn on shuffle"}
              >
                <Shuffle className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
                  const currentIndex = modes.indexOf(repeatMode);
                  const nextMode = modes[(currentIndex + 1) % modes.length];
                  setRepeatMode(nextMode);
                }}
                className={repeatMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}
                aria-label={`Repeat: ${repeatMode}`}
              >
                <Repeat className="h-3 w-3" />
                {repeatMode === 'one' && (
                  <span className="text-xs ml-1">1</span>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-24">
              <Volume2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
                aria-label="Volume"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaCard;