'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize } from 'lucide-react';

interface AutoAnalyzedVideoPlayerProps {
  videoUrl: string;
  videoName: string;
  analyticsBaseName: string;
  processedVideoFilename: string;
  sessionId?: string;
  analyticsId: string;
  analyticsUrl: string;
}

export default function AutoAnalyzedVideoPlayer({ 
  videoUrl, 
  videoName, 
  analyticsBaseName,
  processedVideoFilename,
  sessionId,
  analyticsId,
  analyticsUrl
}: AutoAnalyzedVideoPlayerProps) {
  console.log('🎬 ===== AutoAnalyzedVideoPlayer Component Loading =====');
  console.log('AutoAnalyzedVideoPlayer props:', {
    videoUrl,
    videoName,
    analyticsBaseName,
    processedVideoFilename,
    sessionId,
    analyticsId,
    analyticsUrl
  });
  console.log('🎬 ===================================================');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [frameData, setFrameData] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exact copy of HTML file functions
  let downloadUrl = null;

  const enableDownload = async () => {
    console.log('Enabling download for video 0dcb9daa132905082aa699d4e984c214...');
    
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/accounts/f2b0714a082195118f53d0b8327f6635/stream/0dcb9daa132905082aa699d4e984c214/downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer DEmkpIDn5SLgpjTOoDqYrPivnOpD9gnqbVICwzTQ'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Download enabled successfully!');
        setTimeout(() => {
          checkDownloadStatus();
        }, 1000);
      }
    } catch (error: any) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  };

  const checkDownloadStatus = async () => {
    console.log('Checking download status for video 0dcb9daa132905082aa699d4e984c214...');
    
    try {
      const response = await fetch('https://api.cloudflare.com/client/v4/accounts/f2b0714a082195118f53d0b8327f6635/stream/0dcb9daa132905082aa699d4e984c214/downloads', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer DEmkpIDn5SLgpjTOoDqYrPivnOpD9gnqbVICwzTQ'
        }
      });

      const data = await response.json();
      console.log('Download Status Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.result && data.result.default) {
        downloadUrl = data.result.default.url;
        console.log(`✅ Download URL found: ${downloadUrl}`);
      }
    } catch (error: any) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  };

  const tryDirectVideo = () => {
    if (!downloadUrl) {
      console.log('❌ No download URL available', 'error');
      return;
    }
    
    console.log('🎬 Trying direct video load...');
    const video = document.getElementById('video') as HTMLVideoElement;
    const videoSource = document.getElementById('videoSource') as HTMLSourceElement;
    
    // Remove crossorigin attribute
    video.removeAttribute('crossorigin');
    videoSource.src = downloadUrl;
    video.load();
  };

  const tryProxyVideo = () => {
    if (!downloadUrl) {
      console.log('❌ No download URL available', 'error');
      return;
    }
    
    console.log('🎬 Trying proxy video load through backend...');
    const video = document.getElementById('video') as HTMLVideoElement;
    const videoSource = document.getElementById('videoSource') as HTMLSourceElement;
    
    // Try to proxy through the backend
    const proxyUrl = `http://localhost:5004/proxyVideo?url=${encodeURIComponent(downloadUrl)}`;
    console.log(`🎬 Proxy URL: ${proxyUrl}`);
    
    videoSource.src = proxyUrl;
    video.load();
  };

  const openInNewTab = () => {
    if (!downloadUrl) {
      console.log('❌ No download URL available', 'error');
      return;
    }
    
    console.log('🎬 Opening video in new tab...');
    window.open(downloadUrl, '_blank');
  };

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        console.log('Loading analytics from:', analyticsUrl);
        const response = await fetch(analyticsUrl);
        const data = await response.json();
        console.log('Analytics data loaded:', data);
        setFrameData(data);
          } catch (error) {
        console.error('Failed to load analytics:', error);
        setError('Failed to load analytics data');
      }
    };

    if (analyticsUrl) {
      loadAnalytics();
    }
  }, [analyticsUrl]);

  const goToNextFrame = () => {
    if (currentFrameIndex < frameData.length - 1) {
      setCurrentFrameIndex(currentFrameIndex + 1);
    }
  };

  const goToPreviousFrame = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  const togglePlayPause = () => {
    const video = document.getElementById('video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
        } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
          } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Simple video element (copied from enable_download_test.html) */}
      <div className="video-container w-full h-full">
        <video 
          id="video" 
          controls 
          width="100%" 
          height="100%" 
          style={{ background: 'black' }} 
          crossOrigin="anonymous" 
          preload="metadata"
        >
          <source src="" type="video/mp4" id="videoSource" />
          Your browser does not support the video tag.
        </video>
        </div>

      {/* Simple HTML-style controls (copied from enable_download_test.html) */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button 
          onClick={() => enableDownload()}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Enable Download
        </button>
        <button 
          onClick={() => checkDownloadStatus()}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Check Download Status
        </button>
        <button 
          onClick={() => tryDirectVideo()}
          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
        >
          Try Direct Video Load
        </button>
        <button 
          onClick={() => tryProxyVideo()}
          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          Try Proxy Video Load
        </button>
        <button 
          onClick={() => openInNewTab()}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Open in New Tab
        </button>
                  </div>

      {/* Frame-by-Frame Controls */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center justify-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={goToPreviousFrame}
          disabled={currentFrameIndex === 0}
          className="text-white hover:bg-white hover:text-black"
                    >
          <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
          onClick={togglePlayPause}
          className="text-white hover:bg-white hover:text-black"
                    >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
          onClick={goToNextFrame}
          disabled={currentFrameIndex >= frameData.length - 1}
          className="text-white hover:bg-white hover:text-black"
                    >
          <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleFullscreen}
          className="text-white hover:bg-white hover:text-black"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>

      {/* Frame Info Display */}
      <div className="absolute -bottom-16 right-4 bg-black bg-opacity-80 rounded-lg px-4 py-2 pointer-events-none">
        <div className="text-white text-lg font-bold">
          Frame {currentFrameIndex + 1} / {frameData.length}
                </div>
        <div className="text-gray-300 text-sm">
          {formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000)}
              </div>
            </div>
            
      {/* Analytics Display */}
      {frameData[currentFrameIndex] && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 rounded-lg p-4 text-white max-w-sm">
          <h3 className="font-bold mb-2">Frame Analytics</h3>
          <div className="space-y-1 text-sm">
            <div>ACL Risk: {frameData[currentFrameIndex].aclRisk?.toFixed(2) || 'N/A'}</div>
            <div>Knee Angle: {frameData[currentFrameIndex].kneeAngle?.toFixed(1) || 'N/A'}°</div>
            <div>Elevation: {frameData[currentFrameIndex].elevation?.toFixed(1) || 'N/A'}m</div>
            <div>Forward Lean: {frameData[currentFrameIndex].forwardLean?.toFixed(1) || 'N/A'}°</div>
            <div>Phase: {frameData[currentFrameIndex].tumblingPhase || 'N/A'}</div>
            <div>Quality: {frameData[currentFrameIndex].qualityScore?.toFixed(2) || 'N/A'}</div>
            </div>
            </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading...</p>
                  </div>
                </div>
      )}

      {/* Error display */}
          {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-red-400 text-center">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
        </div>
      </div>
      )}
    </div>
  );
}