import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface FrameData {
  frame_number: number;
  timestamp: number;
  video_time: number;
  analytics: {
    acl_risk: number;
    left_knee_angle: number;
    right_knee_angle: number;
    elevation_angle: number;
    forward_lean: number;
    tumbling_phase: string;
    quality_score: number;
  };
}

interface SimpleFramePlayerProps {
  cloudflareStreamUrl?: string;
  analyticsData?: FrameData[];
}

const SimpleFramePlayer: React.FC<SimpleFramePlayerProps> = ({
  cloudflareStreamUrl = "https://customer-cxebs7nmdazhytrk.cloudflarestream.com/72a4beb341d720ae9d3fc74804d98484/iframe",
  analyticsData = []
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [frameInterval, setFrameInterval] = useState<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Mock analytics data for testing (replace with real data)
  const mockFrameData: FrameData[] = [
    {
      frame_number: 1,
      timestamp: 0.662,
      video_time: 0.662,
      analytics: {
        acl_risk: 15.2,
        left_knee_angle: 165.3,
        right_knee_angle: 170.8,
        elevation_angle: 12.4,
        forward_lean: -5.2,
        tumbling_phase: "approach",
        quality_score: 78.5
      }
    },
    {
      frame_number: 2,
      timestamp: 1.357,
      video_time: 1.357,
      analytics: {
        acl_risk: 23.7,
        left_knee_angle: 158.9,
        right_knee_angle: 168.2,
        elevation_angle: 18.6,
        forward_lean: -2.1,
        tumbling_phase: "takeoff",
        quality_score: 82.1
      }
    },
    {
      frame_number: 3,
      timestamp: 2.040,
      video_time: 2.040,
      analytics: {
        acl_risk: 45.8,
        left_knee_angle: 142.3,
        right_knee_angle: 155.7,
        elevation_angle: 28.9,
        forward_lean: 8.4,
        tumbling_phase: "flight",
        quality_score: 85.7
      }
    },
    {
      frame_number: 4,
      timestamp: 2.862,
      video_time: 2.862,
      analytics: {
        acl_risk: 67.2,
        left_knee_angle: 125.6,
        right_knee_angle: 138.9,
        elevation_angle: 35.2,
        forward_lean: 12.8,
        tumbling_phase: "flight",
        quality_score: 88.3
      }
    },
    {
      frame_number: 5,
      timestamp: 3.507,
      video_time: 3.507,
      analytics: {
        acl_risk: 89.4,
        left_knee_angle: 98.7,
        right_knee_angle: 112.4,
        elevation_angle: 42.1,
        forward_lean: 18.6,
        tumbling_phase: "landing",
        quality_score: 91.2
      }
    }
  ];

  const frameData = analyticsData.length > 0 ? analyticsData : mockFrameData;
  const currentFrame = frameData[currentFrameIndex] || frameData[0];

  // Handle frame progression
  const goToNextFrame = () => {
    if (currentFrameIndex < frameData.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
      // Seek video to frame timestamp
      seekToFrameTime(frameData[currentFrameIndex + 1].video_time);
    }
  };

  const goToPreviousFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
      // Seek video to frame timestamp
      seekToFrameTime(frameData[currentFrameIndex - 1].video_time);
    }
  };

  const seekToFrameTime = (timeInSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeInSeconds;
    }
    setVideoTime(timeInSeconds);
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      // Stop frame progression
      if (frameInterval) {
        clearInterval(frameInterval);
        setFrameInterval(null);
      }
      setIsPlaying(false);
    } else {
      // Start frame progression
      setIsPlaying(true);
      const interval = setInterval(() => {
        setCurrentFrameIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= frameData.length) {
            // Reached end, stop
            clearInterval(interval);
            setFrameInterval(null);
            setIsPlaying(false);
            return prevIndex;
          }
          
          // Seek to next frame
          seekToFrameTime(frameData[nextIndex].video_time);
          return nextIndex;
        });
      }, 500); // 500ms between frames (2 FPS)
      
      setFrameInterval(interval);
    }
  };

  // Handle video click (advance frame)
  const handleVideoClick = () => {
    goToNextFrame();
  };

  // Handle video right-click (go back frame)
  const handleVideoRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goToPreviousFrame();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goToNextFrame();
          break;
        case 'ArrowLeft':
          goToPreviousFrame();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentFrameIndex, isPlaying]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (frameInterval) {
        clearInterval(frameInterval);
      }
    };
  }, [frameInterval]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Simple Frame Player</h2>
        <p className="text-gray-600">
          Click through frames or use controls to navigate. Click video to advance, right-click to go back.
        </p>
      </div>

      {/* Video Player */}
      <div className="relative mb-6">
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          {/* Cloudflare Stream iframe */}
          <iframe
            ref={iframeRef}
            src={cloudflareStreamUrl}
            width="100%"
            height="400"
            frameBorder="0"
            allowFullScreen
            className="w-full h-96"
            title="Cloudflare Stream Video"
          />
          
          {/* Click overlay for frame navigation */}
          <div
            className="absolute inset-0 cursor-pointer bg-transparent hover:bg-white hover:bg-opacity-5 transition-colors"
            onClick={handleVideoClick}
            onContextMenu={handleVideoRightClick}
            title="Click to advance frame, Right-click to go back"
          />
          
          {/* Frame number overlay */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
            Frame: {currentFrame?.frame_number || 0} / {frameData.length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousFrame}
          disabled={currentFrameIndex === 0}
          className="flex items-center space-x-2"
        >
          <SkipBack className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayPause}
          className={`flex items-center space-x-2 ${
            isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? 'Stop' : 'Play'}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextFrame}
          disabled={currentFrameIndex === frameData.length - 1}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Frame Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Frame Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Frame Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Frame Number:</span>
              <span className="font-medium">{currentFrame?.frame_number || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Video Time:</span>
              <span className="font-medium">{currentFrame?.video_time?.toFixed(3) || '0.000'}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timestamp:</span>
              <span className="font-medium">{currentFrame?.timestamp?.toFixed(3) || '0.000'}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Progress:</span>
              <span className="font-medium">
                {((currentFrameIndex / frameData.length) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Data */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Analytics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ACL Risk:</span>
              <span className="font-medium">{currentFrame?.analytics?.acl_risk?.toFixed(1) || '0.0'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Left Knee:</span>
              <span className="font-medium">{currentFrame?.analytics?.left_knee_angle?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Right Knee:</span>
              <span className="font-medium">{currentFrame?.analytics?.right_knee_angle?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Elevation:</span>
              <span className="font-medium">{currentFrame?.analytics?.elevation_angle?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forward Lean:</span>
              <span className="font-medium">{currentFrame?.analytics?.forward_lean?.toFixed(1) || '0.0'}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phase:</span>
              <span className="font-medium capitalize">{currentFrame?.analytics?.tumbling_phase || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality:</span>
              <span className="font-medium">{currentFrame?.analytics?.quality_score?.toFixed(1) || '0.0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Controls:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click video to advance to next frame</li>
          <li>• Right-click video to go back to previous frame</li>
          <li>• Use ← → arrow keys to navigate frames</li>
          <li>• Press Spacebar to play/pause frame progression</li>
          <li>• Use Previous/Next buttons for frame navigation</li>
          <li>• Play button starts automatic frame progression (2 FPS)</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleFramePlayer;


