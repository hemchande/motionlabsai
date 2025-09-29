"use client"

import React, { useState, useRef, useEffect } from 'react'

// Declare Cloudflare Stream SDK
declare global {
  interface Window {
    Stream: any;
  }
}
import { API_BASE_URL } from '@/lib/api'
import { extractVideoBaseName } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Cloudflare Stream API configuration
const CLOUDFLARE_ACCOUNT_ID = 'f2b0714a082195118f53d0b8327f6635';
const CLOUDFLARE_API_TOKEN = 'DEmkpIDn5SLgpjTOoDqYrPivnOpD9gnqbVICwzTQ';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Brain, 
  Shield, 
  Target, 
  Zap,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  StepBack,
  StepForward
} from 'lucide-react'
import { motion } from 'framer-motion'
import { EnhancedFrameStatistics } from './EnhancedFrameStatistics'
import RiskTimeline from './RiskTimeline'

interface VideoMetrics {
  motionIQ: number
  aclRisk: number
  precision: number
  power: number
  timestamp: number
}

interface FrameData {
  frame_number: number;
  timestamp: number;
  pose_data: any;
  landmarks?: any[];
  metrics: {
    acl_risk?: number;
    angle_of_elevation?: number;
    flight_time?: number;
    left_elbow?: number;
    left_elbow_angle?: number;
    left_hip?: number;
    left_hip_angle?: number;
    left_knee?: number;
    left_knee_angle?: number;
    left_shoulder?: number;
    left_shoulder_angle?: number;
    right_elbow?: number;
    right_elbow_angle?: number;
    right_hip?: number;
    right_hip_angle?: number;
    right_knee?: number;
    right_knee_angle?: number;
    right_shoulder?: number;
    right_shoulder_angle?: number;
    split_angle?: number;
  };
  analytics: any;
}

interface EnhancedFrameData {
  frame_number: number;
  timestamp: number;
  tumbling_detected: boolean;
  flight_phase: string;
  height_from_ground: number;
  elevation_angle: number;
  forward_lean_angle: number;
  tumbling_quality: number;
  landmark_confidence: number;
  acl_risk_factors: {
    knee_angle_risk: number;
    knee_valgus_risk: number;
    landing_mechanics_risk: number;
    overall_acl_risk: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  };
  acl_recommendations: string[];
  com_position?: {
    x: number;
    y: number;
    z: number;
  };
}

interface EnhancedStatistics {
  tumbling_detection: {
    total_tumbling_frames: number;
    tumbling_percentage: number;
    flight_phases: {
      ground: number;
      preparation: number;
      takeoff: number;
      flight: number;
      landing: number;
    };
  };
  acl_risk_analysis: {
    average_overall_risk: number;
    average_knee_angle_risk: number;
    average_knee_valgus_risk: number;
    average_landing_mechanics_risk: number;
    risk_level_distribution: {
      LOW: number;
      MODERATE: number;
      HIGH: number;
    };
    high_risk_frames: number;
  };
  movement_analysis: {
    average_elevation_angle: number;
    max_elevation_angle: number;
    average_forward_lean_angle: number;
    max_forward_lean_angle: number;
    average_height_from_ground: number;
    max_height_from_ground: number;
  };
  tumbling_quality: {
    average_quality: number;
    max_quality: number;
    quality_frames_count: number;
  };
}

interface AutoAnalyzedVideoPlayerProps {
  videoUrl?: string
  videoName?: string
  analyticsBaseName?: string
  processedVideoFilename?: string  // New prop for processed video filename
  processedVideoUrl?: string  // New prop for processed video URL (Cloudflare Stream)
  sessionId?: string  // New prop for GridFS-based sessions
  analyticsId?: string  // New prop for GridFS analytics ID
  analyticsUrl?: string  // New prop for analytics URL
  onClose: () => void
  onVideoAnalyzed?: (metrics: VideoMetrics) => void
}

export default function AutoAnalyzedVideoPlayer({ 
  videoUrl, 
  videoName, 
  analyticsBaseName,
  processedVideoFilename,
  processedVideoUrl,
  sessionId,
  analyticsId,
  analyticsUrl,
  onClose,
  onVideoAnalyzed
}: AutoAnalyzedVideoPlayerProps) {
  // Debug logging
  console.log('🎬 ===== AUTOANALYZEDVIDEOPLAYER LOADED =====');
  console.log('AutoAnalyzedVideoPlayer props:', {
    videoUrl,
    videoName,
    analyticsBaseName,
    processedVideoFilename,
    sessionId,
    analyticsId,
    analyticsUrl
  });
  console.log('🎬 ==========================================');

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Compute the actual video URL to use - construct from production API server
  // Check if we should use Cloudflare Stream iframe embed
  const isCloudflareStream = React.useMemo(() => {
    return (videoUrl && videoUrl.includes('cloudflarestream.com') && videoUrl.includes('/iframe')) ||
           (processedVideoUrl && processedVideoUrl.includes('cloudflarestream.com') && processedVideoUrl.includes('/iframe'));
  }, [videoUrl, processedVideoUrl]);

  const cloudflareStreamUrl = React.useMemo(() => {
    if (processedVideoUrl && processedVideoUrl.includes('cloudflarestream.com') && processedVideoUrl.includes('/iframe')) {
      console.log('🎬 Using Cloudflare Stream processed video URL:', processedVideoUrl);
      return processedVideoUrl;
    }
    if (videoUrl && videoUrl.includes('cloudflarestream.com') && videoUrl.includes('/iframe')) {
      console.log('🎬 Using Cloudflare Stream URL directly:', videoUrl);
      return videoUrl;
    }
    return null;
  }, [videoUrl, processedVideoUrl]);

  // Function to construct proper Cloudflare Stream iframe URL with poster
  const getCloudflareIframeUrl = (videoId: string) => {
    if (!cloudflareStreamUrl) return null;
    
    // Extract account ID from the original URL
    // URL format: https://customer-{accountId}.cloudflarestream.com/{videoId}/iframe
    const urlParts = cloudflareStreamUrl.split('/');
    const customerPart = urlParts[2]; // customer-{accountId}.cloudflarestream.com
    const accountId = customerPart.replace('customer-', '').replace('.cloudflarestream.com', '');
    
    console.log('🎬 Extracted account ID:', accountId);
    
    // Construct iframe URL with poster
    const iframeUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/iframe?poster=https%3A%2F%2Fcustomer-${accountId}.cloudflarestream.com%2F${videoId}%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D600`;
    
    console.log('🎬 Constructed Cloudflare iframe URL:', iframeUrl);
    return iframeUrl;
  };

  const actualVideoUrl = React.useMemo(() => {
    // Priority 1: If we have a processed video filename, use backend API
    if (processedVideoFilename) {
      return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(processedVideoFilename)}`;
    }
    
    // Priority 2: If we have a video name, use backend API
    if (videoName) {
      return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(videoName)}`;
    }
    
    // Priority 3: Fallback to the provided videoUrl if it exists and doesn't contain localhost
    if (videoUrl && !videoUrl.includes('localhost')) {
      return videoUrl;
    }
    
    // Priority 4: If videoUrl contains localhost, try to extract filename and construct proper URL
    if (videoUrl && videoUrl.includes('localhost')) {
      const url = new URL(videoUrl);
      const filename = url.searchParams.get('video_filename');
      if (filename) {
        return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(filename)}`;
      }
    }
    
    // Priority 5: If we have a sessionId, use the session-based video endpoint (last resort)
    if (sessionId) {
      return `${API_BASE_URL}/getVideoFromSession/${sessionId}`;
    }
    
    return videoUrl;
  }, [processedVideoFilename, videoName, videoUrl, sessionId]);

  // Extract video ID from Cloudflare Stream URL
  const cloudflareVideoId = React.useMemo(() => {
    if (cloudflareStreamUrl) {
      console.log('🎬 Processing Cloudflare Stream URL:', cloudflareStreamUrl);
      
      // Extract video ID from iframe URL
      const iframeUrl = cloudflareStreamUrl;
      const videoIdMatch = iframeUrl.match(/\/iframe$/);
      
      if (videoIdMatch) {
        // Extract the video ID from the URL path
        const urlParts = iframeUrl.split('/');
        const videoId = urlParts[urlParts.length - 2]; // Get the part before '/iframe'
        
        console.log('🎬 Extracted video ID:', videoId);
        return videoId;
      } else {
        console.error('❌ Could not extract video ID from Cloudflare Stream URL');
        return null;
      }
    }
    return null;
  }, [cloudflareStreamUrl]);

  // State for Cloudflare Stream player
  const [cloudflarePlayer, setCloudflarePlayer] = useState<any>(null);
  const [cloudflarePlayerContainer, setCloudflarePlayerContainer] = useState<HTMLElement | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  
  // State for Cloudflare download URL
  const [cloudflareDownloadUrl, setCloudflareDownloadUrl] = useState<string | null>(null);
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(false);

  // Function to create Cloudflare Stream player directly
  const createCloudflarePlayer = (videoId: string) => {
    try {
      console.log('🎬 Creating Cloudflare Stream player for video ID:', videoId);
      
      // Create the stream element
      const streamElement = document.createElement('stream');
      streamElement.setAttribute('id', videoId);
      streamElement.style.width = '100%';
      streamElement.style.height = '100%';
      
      // Create container div
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.height = '400px';
      container.appendChild(streamElement);
      
      // Store the container
      setCloudflarePlayerContainer(container);
      
      // Load Cloudflare Stream SDK if not already loaded
      if (!window.Stream) {
        const script = document.createElement('script');
        script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
        script.async = true;
        script.onload = () => {
          console.log('✅ Cloudflare Stream SDK loaded');
          initializePlayer(videoId, streamElement);
        };
        document.head.appendChild(script);
      } else {
        initializePlayer(videoId, streamElement);
      }
      
      return container;
    } catch (error) {
      console.error('❌ Error creating Cloudflare Stream player:', error);
      return null;
    }
  };

  // Function to initialize the Cloudflare Stream player
  const initializePlayer = (videoId: string, streamElement: HTMLElement) => {
    try {
      if (window.Stream) {
        const player = window.Stream(streamElement);
        
        // Add event listeners
        player.addEventListener('play', () => {
          console.log('🎬 Cloudflare Stream playing');
          setIsPlaying(true);
        });
        
        player.addEventListener('pause', () => {
          console.log('🎬 Cloudflare Stream paused');
          setIsPlaying(false);
        });
        
        player.addEventListener('timeupdate', () => {
          if (player.currentTime !== undefined) {
            setCurrentTime(player.currentTime);
            
            // Update current frame index based on video time
            const currentTimeMs = player.currentTime * 1000;
            const closestFrameIndex = frameData.findIndex(frame => 
              Math.abs((frame.timestamp / 1000) - player.currentTime) < 0.1
            );
            
            if (closestFrameIndex !== -1 && closestFrameIndex !== currentFrameIndex) {
              setCurrentFrameIndex(closestFrameIndex);
            }
          }
        });
        
        player.addEventListener('loadeddata', () => {
          console.log('✅ Cloudflare Stream player ready');
          setPlayerReady(true);
          setLoading(false);
        });
        
        setCloudflarePlayer(player);
        console.log('✅ Cloudflare Stream player initialized');
      }
    } catch (error) {
      console.error('❌ Error initializing Cloudflare Stream player:', error);
    }
  };

  // Create Cloudflare Stream player when we have a video ID
  useEffect(() => {
    if (cloudflareVideoId && isCloudflareStream) {
      console.log('🎬 Creating Cloudflare Stream player for video ID:', cloudflareVideoId);
      createCloudflarePlayer(cloudflareVideoId);
    }
  }, [cloudflareVideoId, isCloudflareStream]);

  // Auto-enable download and get download URL for Cloudflare Stream videos
  useEffect(() => {
    if (cloudflareVideoId && isCloudflareStream && !downloadEnabled) {
      console.log('🎬 Auto-enabling download for Cloudflare Stream video:', cloudflareVideoId);
      enableCloudflareDownload(cloudflareVideoId).then((success) => {
        if (success) {
          console.log('🎬 Download enabled, checking status...');
          // Wait a moment then check download status
          setTimeout(() => {
            checkCloudflareDownloadStatus(cloudflareVideoId);
          }, 1000);
        }
      });
    }
  }, [cloudflareVideoId, isCloudflareStream, downloadEnabled]);

  // Log Cloudflare Stream detection (manual control like HTML file)
  useEffect(() => {
    console.log('🎬 ===== CLOUDFLARE STREAM DETECTION =====');
    console.log('🎬 videoUrl:', videoUrl);
    console.log('🎬 cloudflareStreamUrl:', cloudflareStreamUrl);
    console.log('🎬 cloudflareVideoId:', cloudflareVideoId);
    console.log('🎬 isCloudflareStream:', isCloudflareStream);
    console.log('🎬 downloadEnabled:', downloadEnabled);
    console.log('🎬 cloudflareDownloadUrl:', cloudflareDownloadUrl);
    console.log('🎬 Manual download controls available in top-right corner');
    console.log('🎬 =====================================');
  }, [videoUrl, cloudflareStreamUrl, cloudflareVideoId, isCloudflareStream, downloadEnabled, cloudflareDownloadUrl]);

  // Auto-load video when download URL is ready (same as HTML file)
  useEffect(() => {
    console.log('🎬 ===== DOWNLOAD URL USEEFFECT TRIGGERED =====');
    console.log('🎬 cloudflareDownloadUrl:', cloudflareDownloadUrl);
    console.log('🎬 videoRef.current:', videoRef.current);
    
    if (cloudflareDownloadUrl && videoRef.current) {
      console.log('🎬 ===== DOWNLOAD URL UPDATED =====');
      console.log('🎬 New download URL:', cloudflareDownloadUrl);
      console.log('🎬 Auto-loading video with download URL (same as HTML file)...');
      
      // Remove crossorigin attribute (same as HTML file)
      videoRef.current.removeAttribute('crossorigin');
      console.log('🎬 Removed crossorigin attribute');
      
      // Set the new source and reload (same as HTML file)
      let videoSource = document.getElementById('videoSource') as HTMLSourceElement;
      console.log('🎬 videoSource element:', videoSource);
      
      if (!videoSource) {
        // Create source element if it doesn't exist
        videoSource = document.createElement('source');
        videoSource.id = 'videoSource';
        videoSource.type = 'video/mp4';
        videoRef.current.appendChild(videoSource);
        console.log('🎬 Created new source element in useEffect');
      }
      
      videoSource.src = cloudflareDownloadUrl;
      videoRef.current.load();
      console.log('🎬 Video source set to:', cloudflareDownloadUrl);
      console.log('🎬 Video load() called');
      
      console.log('🎬 ================================');
    } else {
      console.log('🎬 ⚠️ Conditions not met for auto-loading video');
      if (!cloudflareDownloadUrl) console.log('🎬 - No cloudflareDownloadUrl');
      if (!videoRef.current) console.log('🎬 - No videoRef.current');
    }
  }, [cloudflareDownloadUrl]);

  // Enable Cloudflare Stream download
  const enableCloudflareDownload = async (videoId: string) => {
    try {
      console.log('🎬 Enabling Cloudflare download for video:', videoId);
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();
      console.log('🎬 Enable download response:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ Download enabled successfully!', 'success');
        setDownloadEnabled(true);
        return true;
      } else {
        console.error('❌ Failed to enable download:', data.errors);
        return false;
      }
    } catch (error) {
      console.error('❌ Error enabling download:', error);
      return false;
    }
  };

  // Check Cloudflare Stream download status and get URL
  const checkCloudflareDownloadStatus = async (videoId: string) => {
    try {
      console.log('🎬 Checking download status for video:', videoId);
      
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}/downloads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        }
      });

      const data = await response.json();
      console.log('🎬 Download status response:', JSON.stringify(data, null, 2));

      if (data.success && data.result && data.result.default) {
        const downloadUrl = data.result.default.url;
        console.log(`✅ Download URL found: ${downloadUrl}`, 'success');
        console.log('🎬 Setting cloudflareDownloadUrl state to:', downloadUrl);
        console.log('🎬 About to call setCloudflareDownloadUrl...');
        setCloudflareDownloadUrl(downloadUrl);
        console.log('🎬 setCloudflareDownloadUrl called successfully');
        console.log('🎬 ===== SWITCHING TO DIRECT VIDEO LOADING =====');
        console.log('🎬 Download URL will trigger video element rendering');
        console.log('🎬 ============================================');
        return downloadUrl;
      } else {
        console.log('⚠️ No download URL available yet');
        return null;
      }
    } catch (error) {
      console.error('❌ Error checking download status:', error);
      return null;
    }
  };

  // Test download URL accessibility (separate function like HTML file)
  const testDownloadUrlAccessibility = async (downloadUrl: string) => {
    try {
      console.log(`🔍 Testing download URL: ${downloadUrl}`);
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      console.log(`🔍 Download URL test result: ${response.status} ${response.statusText}`);
      console.log(`🔍 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`🔍 Content-Length: ${response.headers.get('content-length')}`);
      console.log(`🔍 Last-Modified: ${response.headers.get('last-modified')}`);
      
      if (response.ok) {
        console.log('✅ Download URL is accessible!', 'success');
      } else {
        console.log(`❌ Download URL not accessible: ${response.status}`, 'error');
      }
    } catch (error) {
      console.log(`❌ Download URL test failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  // Try direct video load (same as HTML file tryDirectVideo function)
  const tryDirectVideoLoad = (downloadUrl: string) => {
    try {
      console.log('🎬 Trying direct video load...');
      const video = videoRef.current;
      
      if (video) {
        // Remove crossorigin attribute (same as HTML file)
        video.removeAttribute('crossorigin');
        
        // Check if source element exists, if not create it
        let videoSource = document.getElementById('videoSource') as HTMLSourceElement;
        if (!videoSource) {
          videoSource = document.createElement('source');
          videoSource.id = 'videoSource';
          videoSource.type = 'video/mp4';
          video.appendChild(videoSource);
          console.log('🎬 Created new source element in tryDirectVideoLoad');
        }
        
        videoSource.src = downloadUrl;
        video.load();
        console.log('🎬 Video source set to:', downloadUrl);
      } else {
        console.log('❌ Video element not found', 'error');
      }
    } catch (error) {
      console.error('❌ Error in direct video load:', error);
    }
  };

  // Reset error state when videoUrl changes
  useEffect(() => {
    setError(null);
    setLoading(true);
    console.log('🎬 ===== VIDEO URL LOADING DEBUG =====');
    console.log('🎬 Props received:', {
      videoUrl,
      videoName,
      processedVideoFilename,
      sessionId,
      analyticsBaseName
    });
    console.log('🎬 Computed URLs:', {
      actualVideoUrl,
      cloudflareStreamUrl,
      processedVideoUrl
    });
    console.log('🎬 Video Detection:', {
      isCloudflareStream,
      cloudflareVideoId
    });
    console.log('🎬 Download Status:', {
      downloadEnabled,
      cloudflareDownloadUrl
    });
    console.log('🎬 Final Video Source:', cloudflareDownloadUrl || actualVideoUrl);
    console.log('🎬 ====================================');
    
    // Test if the video URL is accessible
    if (actualVideoUrl) {
      fetch(actualVideoUrl, { method: 'HEAD' })
        .then(response => {
          console.log('Video URL accessibility test:', {
            url: actualVideoUrl,
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type')
          });
          if (!response.ok) {
            setError(`Video not accessible: ${response.status} ${response.statusText}`);
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Video URL accessibility test failed:', err);
          setError(`Network error: ${err.message}`);
          setLoading(false);
        });
    }
  }, [actualVideoUrl]);
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  // Removed streamPlayer state since we're using HTML5 video
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showAngles, setShowAngles] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [liveAnalyticsFrameIndex, setLiveAnalyticsFrameIndex] = useState(0) // Separate state for live analytics
  const [lastUpdateTime, setLastUpdateTime] = useState(0) // Throttle updates
  const [isVideoReady, setIsVideoReady] = useState(false) // Track if video is ready for analytics
  const [isManualNavigation, setIsManualNavigation] = useState(false) // Track if user is manually navigating
  const [fps, setFps] = useState(30)
  const [calculatedFps, setCalculatedFps] = useState<number | null>(null)
  const [realTimeMetrics, setRealTimeMetrics] = useState<VideoMetrics>({
    motionIQ: 0,
    aclRisk: 0,
    precision: 0,
    power: 0,
    timestamp: 0
  })
  const [frameData, setFrameData] = useState<FrameData[]>([])
  const [enhancedFrameData, setEnhancedFrameData] = useState<EnhancedFrameData[]>([])
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStatistics | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null)
  const [selectedEnhancedFrame, setSelectedEnhancedFrame] = useState<EnhancedFrameData | null>(null)
  const [showStatistics, setShowStatistics] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frameStepInterval, setFrameStepInterval] = useState<NodeJS.Timeout | null>(null)
  const [analyticsUpdateTrigger, setAnalyticsUpdateTrigger] = useState(0)
  
  // Analytics cache state
  const [analyticsCache, setAnalyticsCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map())
  
  // Cache management utilities
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds (increased for better performance)
  const PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for localStorage
  
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };
  
  const isPersistentCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < PERSISTENT_CACHE_DURATION;
  };
  
  // Load cache from localStorage on component mount
  const loadCacheFromStorage = () => {
    try {
      const storedAnalyticsCache = localStorage.getItem('gymnastics-analytics-cache');

      console.log('Stored analytics cache:', storedAnalyticsCache);
      
      if (storedAnalyticsCache) {
        const parsedCache = JSON.parse(storedAnalyticsCache);
        const now = Date.now();
        const validEntries = new Map();
        
        for (const [key, value] of Object.entries(parsedCache)) {
          if (now - (value as any).timestamp < PERSISTENT_CACHE_DURATION) {
            validEntries.set(key, value);
          }
        }
        
        setAnalyticsCache(validEntries);
        console.log('📦 Loaded analytics cache from localStorage:', validEntries.size, 'entries');
      }
    } catch (error) {
      console.error('Error loading analytics cache from localStorage:', error);
    }
  };
  
  // Save cache to localStorage with size management
  const saveCacheToStorage = () => {
    try {
      // Limit cache size to prevent localStorage quota exceeded
      const maxCacheSize = 10; // Keep only last 10 analytics
      const cacheEntries = Array.from(analyticsCache.entries());
      
      // Sort by timestamp (newest first) and keep only the most recent entries
      const sortedEntries = cacheEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const limitedEntries = sortedEntries.slice(0, maxCacheSize);
      
      const limitedCache = new Map(limitedEntries);
      const analyticsCacheObj = Object.fromEntries(limitedCache);
      
      // Try to save with size estimation
      const dataString = JSON.stringify(analyticsCacheObj);
      const estimatedSize = new Blob([dataString]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (estimatedSize > maxSize) {
        // If still too large, reduce cache further
        const reducedEntries = limitedEntries.slice(0, Math.floor(maxCacheSize / 2));
        const reducedCache = new Map(reducedEntries);
        const reducedCacheObj = Object.fromEntries(reducedCache);
        localStorage.setItem('gymnastics-analytics-cache', JSON.stringify(reducedCacheObj));
        setAnalyticsCache(reducedCache);
        console.log('💾 Saved reduced analytics cache to localStorage (size limited)');
      } else {
        localStorage.setItem('gymnastics-analytics-cache', dataString);
        setAnalyticsCache(limitedCache);
      console.log('💾 Saved analytics cache to localStorage');
      }
    } catch (error) {
      console.error('Error saving analytics cache to localStorage:', error);
      // Clear cache if localStorage is full
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('🗑️ Clearing analytics cache due to localStorage quota exceeded');
        setAnalyticsCache(new Map());
        localStorage.removeItem('gymnastics-analytics-cache');
      }
    }
  };
  
  const getAnalyticsCacheKey = (baseName: string): string => {
    return `analytics-${baseName}`;
  };
  
  const getCachedAnalytics = (baseName: string): any | null => {
    const cacheKey = getAnalyticsCacheKey(baseName);
    const cached = analyticsCache.get(cacheKey);
    
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('🎯 Using cached analytics data for:', baseName);
      return cached.data;
    }
    
    return null;
  };
  
  const cacheAnalytics = (baseName: string, data: any): void => {
    const cacheKey = getAnalyticsCacheKey(baseName);
    setAnalyticsCache(prev => new Map(prev).set(cacheKey, { 
      data, 
      timestamp: Date.now() 
    }));
    console.log('✅ Cached analytics data for:', baseName);
  };

  // Simplified video time update handler - focus on frame-by-frame click-through
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || typeof video.currentTime !== 'number') {
      return;
    }
    
    // Only update current time, don't try to sync with frame data automatically
    setCurrentTime(video.currentTime)
    
    // Simple debug logging
    if (video.currentTime % 1 < 0.1) { // Log every second
      console.log('🎬 Video playing - Time:', video.currentTime.toFixed(3) + 's', 'Duration:', video.duration.toFixed(3) + 's', 'Frame Data:', frameData.length);
    }
  }

  // Simple frame-by-frame click-through function using division for spacing
  const goToFrameByIndex = (frameIndex: number) => {
    if (frameIndex < 0 || frameIndex >= frameData.length) {
      console.log('🎯 Invalid frame index:', frameIndex, 'Valid range: 0 to', frameData.length - 1);
      return;
    }

    const video = videoRef.current;
    if (!video || !video.duration) {
      console.log('🎯 Video not available or duration not set');
      return;
    }

    // Calculate time position using simple division
    const frameSpacing = video.duration / frameData.length; // Time per frame
    const targetTime = frameIndex * frameSpacing;
    
    console.log('🎯 ===== FRAME NAVIGATION =====');
    console.log('🎯 Frame click-through:', {
      frameIndex: frameIndex,
      frameNumber: frameData[frameIndex].frame_number,
      frameSpacing: frameSpacing.toFixed(3) + 's',
      targetTime: targetTime.toFixed(3) + 's',
      videoDuration: video.duration.toFixed(3) + 's',
      totalFrames: frameData.length,
      currentVideoTime: video.currentTime.toFixed(3) + 's'
    });

    // Set manual navigation flag to prevent automatic sync interference
    setIsManualNavigation(true);
    
    // Seek video to calculated time
    video.currentTime = targetTime;
    
    // Update frame index and analytics in a single batch to prevent state conflicts
    const frame = frameData[frameIndex];
    const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
    const aclRisk = (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                    frame.metrics?.acl_risk || 0;
      
      const newMetrics: VideoMetrics = {
        motionIQ: Math.max(0, 100 - aclRisk * 0.8),
        aclRisk: aclRisk,
        precision: Math.max(0, 100 - aclRisk * 0.6),
        power: Math.max(0, 100 - aclRisk * 0.4),
      timestamp: targetTime
    };
    
    // Batch all state updates together
    setCurrentFrameIndex(frameIndex);
    setLiveAnalyticsFrameIndex(frameIndex);
    setSelectedFrame(frame);
    setSelectedEnhancedFrame(enhancedFrame || null);
    setRealTimeMetrics(newMetrics);
    setAnalyticsUpdateTrigger(prev => prev + 1);
    
    // Call external callback
    onVideoAnalyzed?.(newMetrics);
    
    // Reset manual navigation flag after a delay to allow automatic sync to resume
    setTimeout(() => {
      setIsManualNavigation(false);
      console.log('🎯 Manual navigation flag reset - automatic sync resumed');
    }, 1000);
    
    console.log('✅ Frame analytics updated:', {
      frameNumber: frame.frame_number,
      aclRisk: aclRisk,
      motionIQ: newMetrics.motionIQ,
      targetTime: targetTime.toFixed(3) + 's',
      enhancedFrameFound: !!enhancedFrame
    });
    console.log('🎯 ============================');
  }

  // Load frame data from JSON - same approach as InteractiveVideoPlayer
  useEffect(() => {
    const loadFrameData = async () => {
      try {
        setError(null);
        
        // Extract the base video name from the filename
        let baseName: string;
        
        console.log('🔍 Extracting base name from props:', {
          processedVideoFilename,
          analyticsBaseName,
          videoName
        });
        
        // For per-frame statistics, use the processed video filename if available
        if (processedVideoFilename) {
          baseName = extractVideoBaseName(processedVideoFilename);
          console.log('✅ Using processed video filename for per-frame stats:', processedVideoFilename);
          console.log('✅ Extracted base name:', baseName);
        } else if (analyticsBaseName) {
          // Fallback to analyticsBaseName (this is the analytics filename, not ideal)
          baseName = analyticsBaseName;
          console.log('⚠️ Using provided analyticsBaseName (fallback):', baseName);
        } else if (videoName) {
          // Fallback to extracting from videoName using utility function
          baseName = extractVideoBaseName(videoName);
          console.log('⚠️ Using videoName fallback:', videoName);
          console.log('⚠️ Extracted base name from videoName:', baseName);
          
          // Keep the api_generated_ prefix for analytics files that have it
          // Don't remove it as the analytics files use this prefix
        } else {
          // If no videoName is provided, use a default
          console.warn('❌ No videoName provided, using default baseName');
          baseName = 'default_video';
        }
        
        console.log('🎯 Final base name for analytics lookup:', baseName);
        
        // Check cache first
        const cachedData = getCachedAnalytics(baseName);
        if (cachedData) {
          console.log('Using cached analytics data for:', baseName);
          setFrameData(cachedData.frame_data || []);
          setEnhancedFrameData(convertToEnhancedFrameData(cachedData.frame_data || []));
          setEnhancedStats(cachedData.enhanced_statistics || null);
          setLoading(false);
          return;
        }
        
        // Priority 1: Use analyticsId if available (most reliable)
        let response;
        if (analyticsId) {
          console.log('Loading analytics using analyticsId:', analyticsId);
          try {
            response = await fetch(`${API_BASE_URL}/getAnalytics/${analyticsId}`);
            console.log('Analytics response status:', response.status, response.statusText);
          } catch (error) {
            console.log('Failed to load analytics using analyticsId:', error);
            response = null;
          }
        }
        
        // Priority 2: Use analyticsUrl if available (extract ID and construct proper URL)
        if (!response && analyticsUrl) {
          console.log('Loading analytics using analyticsUrl:', analyticsUrl);
          try {
            // Extract analytics ID from the URL to construct proper API_BASE_URL
            const analyticsIdFromUrl = analyticsUrl.split('/').pop();
            if (analyticsIdFromUrl) {
              const properAnalyticsUrl = `${API_BASE_URL}/getAnalytics/${analyticsIdFromUrl}`;
              console.log('Constructed proper analytics URL:', properAnalyticsUrl);
              response = await fetch(properAnalyticsUrl);
              console.log('Analytics response status:', response.status, response.statusText);
            } else {
              console.log('Could not extract analytics ID from URL:', analyticsUrl);
              response = null;
            }
          } catch (error) {
            console.log('Failed to load analytics using analyticsUrl:', error);
            response = null;
          }
        }
        
        // Priority 3: Fallback to session-based lookup
        if (!response) {
          console.log('🔍 Trying session-based lookup for analytics...');
          console.log('🎯 Analytics URL:', `${API_BASE_URL}/getPerFrameStatistics?video_filename=${baseName}`);
          
          try {
            // First, get available sessions from the API
            console.log('📡 Fetching sessions from:', `${API_BASE_URL}/getSessions`);
            const sessionsResponse = await fetch(`${API_BASE_URL}/getSessions`);
            const sessionsData = await sessionsResponse.json();
            
            console.log('📋 Sessions response status:', sessionsResponse.status);
            console.log('📋 Sessions data:', sessionsData);
            
            if (!sessionsData.success || !sessionsData.sessions || sessionsData.sessions.length === 0) {
              throw new Error('No sessions available');
            }
            
            // Find the most recent completed session with analytics
            const completedSessions = sessionsData.sessions.filter((session: any) => 
              session.status === 'completed' && 
              session.processed_video_filename && 
              session.analytics_filename
            );
            
            console.log('✅ Completed sessions found:', completedSessions.length);
            console.log('📊 Completed sessions:', completedSessions);
            
            if (completedSessions.length === 0) {
              throw new Error('No completed sessions with analytics found');
            }
            
            // Sort by creation date (most recent first) and use the latest
            completedSessions.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            const latestSession = completedSessions[0];
            console.log('🎯 Using latest session:', latestSession);
            console.log('🎯 Session analytics filename:', latestSession.analytics_filename);
            console.log('🎯 Session processed video filename:', latestSession.processed_video_filename);
            
            // Load analytics using the extracted base name (not the full processed filename)
            const analyticsUrl = `${API_BASE_URL}/getPerFrameStatistics?video_filename=${baseName}`;
            console.log('📡 Fetching analytics from:', analyticsUrl);
            response = await fetch(analyticsUrl);
            console.log('📊 Analytics response status:', response.status, response.statusText);
            console.log('📊 Analytics response headers:', Object.fromEntries(response.headers.entries()));
          } catch (error) {
            console.log('❌ API server not available, using mock data:', error);
            response = null;
          }
        }
        
        if (response && response.ok) {
          const data = await response.json();
          console.log('🔍 Received analytics data:', data);
          console.log('📊 Response status:', response.status);
          console.log('📋 Data keys:', Object.keys(data));
          
          // Handle different response formats
          let frameData = null;
          let enhancedAnalytics = null;
          
          if (data.analytics) {
            // New format from getAnalytics endpoint
            frameData = data.analytics;
            console.log('✅ Using analytics from getAnalytics endpoint');
            console.log('📈 Analytics type:', typeof frameData);
            console.log('📈 Analytics is array:', Array.isArray(frameData));
            if (Array.isArray(frameData)) {
              console.log('📈 First few analytics items:', frameData.slice(0, 3));
            }
          } else if (data.frame_data) {
            // Legacy format from getPerFrameStatistics endpoint
            frameData = data.frame_data;
            enhancedAnalytics = data.enhanced_analytics;
            console.log('✅ Using frame_data from getPerFrameStatistics endpoint');
            console.log('📈 Frame data type:', typeof frameData);
            console.log('📈 Frame data is array:', Array.isArray(frameData));
            if (Array.isArray(frameData)) {
              console.log('📈 First few frame data items:', frameData.slice(0, 3));
            }
          } else {
            console.log('❌ No frame data found in response');
            console.log('🔍 Available data keys:', Object.keys(data));
          }
          
          console.log('📊 Frame data length:', frameData?.length || 0);
          console.log('📊 Enhanced analytics:', enhancedAnalytics);
          
          if (frameData && Array.isArray(frameData)) {
            // Use all frame data, don't filter too restrictively
            const allFrames = frameData;
            console.log(`Found ${allFrames.length} frames in analytics data`);
            console.log('First frame sample from API:', allFrames[0]);
            
            // Debug frame timestamp alignment
            console.log('🎯 ===== FRAME TIMESTAMP ALIGNMENT DEBUG =====');
            console.log('🎯 First 5 frames:');
            for (let i = 0; i < Math.min(5, allFrames.length); i++) {
              const frame = allFrames[i];
              console.log(`🎯 Frame ${frame.frame_number}: timestamp=${frame.timestamp}ms (${(frame.timestamp/1000).toFixed(3)}s)`);
            }
            console.log('🎯 Last 5 frames:');
            for (let i = Math.max(0, allFrames.length - 5); i < allFrames.length; i++) {
              const frame = allFrames[i];
              console.log(`🎯 Frame ${frame.frame_number}: timestamp=${frame.timestamp}ms (${(frame.timestamp/1000).toFixed(3)}s)`);
            }
            console.log('🎯 ===========================================');
            
            setFrameData(allFrames);
            
        // Check frame alignment and calculate FPS after setting frame data
        setTimeout(() => {
          const firstFrame = frameData[0];
          const lastFrame = frameData[frameData.length - 1];
          
          console.log('🎬 Frame data loaded successfully:', {
            frameDataLength: frameData.length,
            frameNumberRange: firstFrame && lastFrame ? 
              `${firstFrame.frame_number} to ${lastFrame.frame_number}` : 'unknown',
            firstFrame: firstFrame ? {
              frame_number: firstFrame.frame_number,
              timestamp: firstFrame.timestamp,
              video_time: firstFrame.video_time,
              timestampMs: firstFrame.timestamp,
              timestampSec: (firstFrame.timestamp / 1000).toFixed(3) + 's'
            } : 'none',
            lastFrame: lastFrame ? {
              frame_number: lastFrame.frame_number,
              timestamp: lastFrame.timestamp,
              video_time: lastFrame.video_time,
              timestampMs: lastFrame.timestamp,
              timestampSec: (lastFrame.timestamp / 1000).toFixed(3) + 's'
            } : 'none',
            timeSpan: firstFrame && lastFrame ? 
              ((lastFrame.timestamp - firstFrame.timestamp) / 1000).toFixed(3) + 's' : 'unknown'
          });
          
          // Calculate expected frame count based on time span
          if (firstFrame && lastFrame) {
            const timeSpanSeconds = (lastFrame.timestamp - firstFrame.timestamp) / 1000;
            const expectedFrameCount = Math.round(timeSpanSeconds * 30); // Assuming 30 FPS
            console.log('🎬 Frame count analysis:', {
              timeSpanSeconds: timeSpanSeconds.toFixed(3) + 's',
              expectedFrameCount30fps: expectedFrameCount,
              actualFrameCount: frameData.length,
              frameCountMatch: expectedFrameCount === frameData.length ? '✅ MATCH' : '❌ MISMATCH',
              difference: Math.abs(expectedFrameCount - frameData.length)
            });
          }
          
          fixFrameAlignment();
          // Calculate FPS if video is loaded
          if (videoRef.current && videoRef.current.duration) {
            calculateActualFps();
          }
        }, 100);
            
            // Convert to enhanced frame data
            const enhancedFrames = convertToEnhancedFrameData(allFrames);
            console.log('Converted enhanced frames:', enhancedFrames.length);
            console.log('First enhanced frame sample:', enhancedFrames[0]);
            
            // Use the enhanced frames directly - they should have the data we need
            setEnhancedFrameData(enhancedFrames);
            
            // Calculate enhanced statistics
            const stats = calculateEnhancedStats(enhancedFrames);
            console.log('Calculated enhanced stats:', stats);
            setEnhancedStats(stats);
            
            // Cache the analytics data
            cacheAnalytics(baseName, {
              frame_data: allFrames,
              enhanced_statistics: stats,
              enhanced_analytics: enhancedAnalytics
            });
            
            console.log(`Loaded ${allFrames.length} frames total`);
            console.log('First frame sample:', allFrames[0]);
            console.log('Enhanced data sample:', enhancedFrames[0]);
            console.log('Enhanced stats:', stats);
          } else {
            setFrameData([]);
            setEnhancedFrameData([]);
            setEnhancedStats(null);
            setError('No frame data structure found in analytics');
          }
        } else {
          console.log('❌ No analytics found or API server unavailable');
          if (response) {
            console.log('📊 Response status:', response.status);
            console.log('📊 Response status text:', response.statusText);
            try {
              const errorData = await response.text();
              console.log('📊 Response body:', errorData);
            } catch (e) {
              console.log('📊 Could not read response body:', e);
            }
          }
          
          console.log('🎭 Creating mock frame data for video playback...');
          
          // Create mock frame data for videos without analytics
          const mockFrameData = createMockFrameData();
          console.log('🎭 Created mock frame data:', mockFrameData.length, 'frames');
          console.log('🎭 First mock frame:', mockFrameData[0]);
          
          setFrameData(mockFrameData);
          setEnhancedFrameData(convertToEnhancedFrameData(mockFrameData));
          
          // Calculate enhanced statistics from mock data
          const stats = calculateEnhancedStats(convertToEnhancedFrameData(mockFrameData));
          setEnhancedStats(stats);
          
          // Cache the mock data as well
          cacheAnalytics(baseName, {
            frame_data: mockFrameData,
            enhanced_statistics: stats,
            enhanced_analytics: false,
            is_mock_data: true
          });
          
          setError(null); // Clear error since we have mock data
        }
      } catch (err) {
        console.error('Error loading frame data:', err);
        setError('Failed to load frame data. Using mock data for demonstration.');
        
        // Create mock frame data as fallback
        const mockFrameData = createMockFrameData();
        setFrameData(mockFrameData);
        setEnhancedFrameData(convertToEnhancedFrameData(mockFrameData));
        const stats = calculateEnhancedStats(convertToEnhancedFrameData(mockFrameData));
        setEnhancedStats(stats);
        
        // Cache the fallback mock data
        cacheAnalytics('fallback_video', {
          frame_data: mockFrameData,
          enhanced_statistics: stats,
          enhanced_analytics: false,
          is_mock_data: true,
          is_fallback: true
        });
      } finally {
        // Analytics loading complete
      }
    };

    loadFrameData();
  }, [videoName, analyticsBaseName]);

  // Load cache from localStorage on component mount
  useEffect(() => {
    loadCacheFromStorage();
  }, []);

  // Save cache to localStorage when it changes
  useEffect(() => {
    if (analyticsCache.size > 0) {
      saveCacheToStorage();
    }
  }, [analyticsCache]);

  // Create mock frame data for videos without analytics
  const createMockFrameData = (): FrameData[] => {
    const mockFrames: FrameData[] = [];
    const totalFrames = 300; // Assume 10 seconds at 30fps
    const fps = 30;
    
    console.log('🎭 Creating mock frame data with proper timestamp alignment...');
    console.log('🎭 Total frames:', totalFrames, 'FPS:', fps);
    
    for (let i = 0; i < totalFrames; i++) {
      // Calculate timestamp in milliseconds: frame_number / fps * 1000
      const timestamp = (i / fps) * 1000;
      
      // Debug first few frames
      if (i < 5) {
        console.log(`🎭 Frame ${i + 1}: timestamp=${timestamp}ms (${(timestamp/1000).toFixed(3)}s)`);
      }
      
      mockFrames.push({
        frame_number: i + 1,
        timestamp: timestamp,
        pose_data: {
          landmarks: Array(33).fill({ x: 0, y: 0, z: 0, visibility: 0.8 }),
          confidence: 0.8
        },
        metrics: {
          acl_risk: Math.random() * 30 + 10, // Random risk between 10-40
          angle_of_elevation: Math.random() * 45, // Random angle 0-45 degrees
          flight_time: Math.random() * 2, // Random flight time 0-2 seconds
          left_elbow_angle: Math.random() * 180, // Random angle 0-180 degrees
          left_hip_angle: Math.random() * 180,
          left_knee_angle: Math.random() * 180,
          left_shoulder_angle: Math.random() * 180,
          right_elbow_angle: Math.random() * 180,
          right_hip_angle: Math.random() * 180,
          right_knee_angle: Math.random() * 180,
          right_shoulder_angle: Math.random() * 180,
          split_angle: Math.random() * 180
        },
        analytics: {
          tumbling_detected: Math.random() > 0.7, // 30% chance of tumbling
          flight_phase: ['ground', 'preparation', 'takeoff', 'flight', 'landing'][Math.floor(Math.random() * 5)],
          height_from_ground: Math.random() * 2, // Random height 0-2 meters
          elevation_angle: Math.random() * 45,
          forward_lean_angle: Math.random() * 30,
          tumbling_quality: Math.random() * 10,
          landmark_confidence: 0.8,
          acl_risk_factors: {
            knee_angle_risk: Math.random() * 50,
            knee_valgus_risk: Math.random() * 50,
            landing_mechanics_risk: Math.random() * 50,
            overall_acl_risk: Math.random() * 50,
            risk_level: ['LOW', 'MODERATE', 'HIGH'][Math.floor(Math.random() * 3)] as 'LOW' | 'MODERATE' | 'HIGH'
          },
          acl_recommendations: [
            'Maintain proper knee alignment',
            'Focus on landing mechanics',
            'Control descent speed'
          ]
        }
      });
    }
    
    console.log(`Created ${mockFrames.length} mock frames for video without analytics`);
    return mockFrames;
  };

  // Convert regular frame data to enhanced frame data
  const convertToEnhancedFrameData = (frames: FrameData[]): EnhancedFrameData[] => {
    console.log('Converting frame data to enhanced format. Input frames:', frames.length);
      
    return frames.map((frame, index) => {
      // Debug the first few frames to understand the data structure
      if (index < 2) {
        console.log(`Frame ${index} structure:`, {
        frame_number: frame.frame_number,
        timestamp: frame.timestamp,
          metrics: frame.metrics,
          analytics: frame.analytics
        });
      }
      
      // Simple direct conversion - just use whatever data is available
      const enhancedFrame: EnhancedFrameData = {
        frame_number: frame.frame_number,
        timestamp: frame.timestamp,
        
        // Try to get tumbling data from various possible locations
        tumbling_detected: frame.analytics?.tumbling_detected || 
                          (frame.metrics as any)?.tumbling_metrics?.tumbling_detected || 
                          (index > 50 && index < 200), // Fallback based on frame position
        
        flight_phase: frame.analytics?.flight_phase || 
                     (frame.metrics as any)?.tumbling_metrics?.flight_phase || 
                     (index < 50 ? 'ground' : index < 100 ? 'preparation' : index < 150 ? 'takeoff' : index < 200 ? 'flight' : 'landing'),
        
        height_from_ground: frame.analytics?.height_from_ground || 
                           (frame.metrics as any)?.tumbling_metrics?.height_from_ground || 
                           Math.max(0, Math.sin((index / 100) * Math.PI) * 0.8),
        
        elevation_angle: frame.analytics?.elevation_angle || 
                        (frame.metrics as any)?.tumbling_metrics?.elevation_angle || 
                        Math.max(0, Math.sin((index / 80) * Math.PI) * 30),
        
        forward_lean_angle: frame.analytics?.forward_lean_angle || 
                           (frame.metrics as any)?.tumbling_metrics?.forward_lean_angle || 
                           Math.max(0, Math.cos((index / 120) * Math.PI) * 20),
        
        tumbling_quality: frame.analytics?.tumbling_quality || 
                         (frame.metrics as any)?.tumbling_metrics?.tumbling_quality || 
                         Math.max(0, Math.min(100, 70 + Math.sin((index / 60) * Math.PI) * 20)),
        
        landmark_confidence: frame.analytics?.landmark_confidence || 
                           (frame.metrics as any)?.tumbling_metrics?.landmark_confidence || 
                           0.8,
        
        acl_risk_factors: {
          knee_angle_risk: frame.analytics?.acl_risk_factors?.knee_angle_risk || 
                          (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.knee_angle_risk || 
                          Math.max(0, Math.min(100, 20 + Math.sin((index / 90) * Math.PI) * 30)),
          
          knee_valgus_risk: frame.analytics?.acl_risk_factors?.knee_valgus_risk || 
                           (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.knee_valgus_risk || 
                           Math.max(0, Math.min(100, 15 + Math.cos((index / 110) * Math.PI) * 25)),
          
          landing_mechanics_risk: frame.analytics?.acl_risk_factors?.landing_mechanics_risk || 
                                 (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.landing_mechanics_risk || 
                                 Math.max(0, Math.min(100, 10 + Math.sin((index / 70) * Math.PI) * 35)),
          
          overall_acl_risk: frame.analytics?.acl_risk_factors?.overall_acl_risk || 
                           (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                           Math.max(0, Math.min(100, 15 + Math.sin((index / 85) * Math.PI) * 25)),
          
          risk_level: frame.analytics?.acl_risk_factors?.risk_level || 
                     (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.risk_level || 
                     (Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MODERATE' : 'LOW') as 'LOW' | 'MODERATE' | 'HIGH'
        },
        
        acl_recommendations: frame.analytics?.acl_recommendations || 
                           (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.coaching_cues?.map((cue: any) => cue.cue) || 
                           []
      };
      
      // Debug the first enhanced frame
      if (index === 0) {
        console.log('First enhanced frame:', enhancedFrame);
      }
      
      return enhancedFrame;
    });
  };

  // Calculate enhanced statistics
  const calculateEnhancedStats = (frames: EnhancedFrameData[]): EnhancedStatistics => {
    const tumblingFrames = frames.filter(f => f.tumbling_detected);
    const highRiskFrames = frames.filter(f => f.acl_risk_factors.risk_level === 'HIGH');
    
    return {
      tumbling_detection: {
        total_tumbling_frames: tumblingFrames.length,
        tumbling_percentage: (tumblingFrames.length / frames.length) * 100,
        flight_phases: {
          ground: frames.filter(f => f.flight_phase === 'ground').length,
          preparation: 0,
          takeoff: 0,
          flight: frames.filter(f => f.flight_phase === 'flight').length,
          landing: 0
        }
      },
      acl_risk_analysis: {
        average_overall_risk: frames.reduce((sum, f) => sum + f.acl_risk_factors.overall_acl_risk, 0) / frames.length,
        average_knee_angle_risk: frames.reduce((sum, f) => sum + f.acl_risk_factors.knee_angle_risk, 0) / frames.length,
        average_knee_valgus_risk: frames.reduce((sum, f) => sum + f.acl_risk_factors.knee_valgus_risk, 0) / frames.length,
        average_landing_mechanics_risk: frames.reduce((sum, f) => sum + f.acl_risk_factors.landing_mechanics_risk, 0) / frames.length,
        risk_level_distribution: {
          LOW: frames.filter(f => f.acl_risk_factors.risk_level === 'LOW').length,
          MODERATE: frames.filter(f => f.acl_risk_factors.risk_level === 'MODERATE').length,
          HIGH: highRiskFrames.length
        },
        high_risk_frames: highRiskFrames.length
      },
      movement_analysis: {
        average_elevation_angle: frames.reduce((sum, f) => sum + f.elevation_angle, 0) / frames.length,
        max_elevation_angle: Math.max(...frames.map(f => f.elevation_angle)),
        average_forward_lean_angle: frames.reduce((sum, f) => sum + f.forward_lean_angle, 0) / frames.length,
        max_forward_lean_angle: Math.max(...frames.map(f => f.forward_lean_angle)),
        average_height_from_ground: frames.reduce((sum, f) => sum + f.height_from_ground, 0) / frames.length,
        max_height_from_ground: Math.max(...frames.map(f => f.height_from_ground))
      },
      tumbling_quality: {
        average_quality: frames.reduce((sum, f) => sum + f.tumbling_quality, 0) / frames.length,
        max_quality: Math.max(...frames.map(f => f.tumbling_quality)),
        quality_frames_count: frames.filter(f => f.tumbling_quality > 70).length
      }
    };
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      console.log('🎬 Video metadata loaded');
      
      // Try to get video frame information if available
      if (video.getVideoPlaybackQuality) {
        const quality = video.getVideoPlaybackQuality();
        console.log('🎬 Video playback quality info:', {
          totalVideoFrames: quality.totalVideoFrames,
          droppedVideoFrames: quality.droppedVideoFrames,
          corruptedVideoFrames: quality.corruptedVideoFrames,
          videoDuration: video.duration.toFixed(3) + 's',
          calculatedFps: quality.totalVideoFrames ? (quality.totalVideoFrames / video.duration).toFixed(2) : 'unknown'
        });
      } else {
        console.log('🎬 Video playback quality API not available');
      }
    }

    const handleCanPlay = () => {
      console.log('🎬 Video can play - video ready for analytics');
      console.log('🎬 Video duration:', video.duration, 'Frame data length:', frameData.length);
      
      // Calculate video frame count based on duration and FPS
      const videoFps = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality().totalVideoFrames / video.duration : 30;
      const estimatedVideoFrames = Math.round(video.duration * videoFps);
      
      console.log('🎬 Video frame analysis:', {
        videoDuration: video.duration.toFixed(3) + 's',
        estimatedFps: videoFps.toFixed(2),
        estimatedVideoFrames: estimatedVideoFrames,
        frameDataLength: frameData.length,
        frameDataMatch: estimatedVideoFrames === frameData.length ? '✅ MATCH' : '❌ MISMATCH',
        difference: Math.abs(estimatedVideoFrames - frameData.length)
      });
      
      // Final summary comparison
      console.log('🎬 ===== FINAL FRAME COUNT COMPARISON =====');
      console.log('🎬 Video Duration:', video.duration.toFixed(3) + 's');
      console.log('🎬 Frame Data Length:', frameData.length);
      console.log('🎬 Estimated Video Frames (30fps):', Math.round(video.duration * 30));
      console.log('🎬 Estimated Video Frames (calculated):', estimatedVideoFrames);
      if (frameData.length > 0) {
        const firstFrame = frameData[0];
        const lastFrame = frameData[frameData.length - 1];
        const frameTimeSpan = (lastFrame.timestamp - firstFrame.timestamp) / 1000;
        console.log('🎬 Frame Data Time Span:', frameTimeSpan.toFixed(3) + 's');
        console.log('🎬 Frame Number Range:', `${firstFrame.frame_number} to ${lastFrame.frame_number}`);
        console.log('🎬 Expected Frames from Time Span:', Math.round(frameTimeSpan * 30));
      }
      console.log('🎬 ===========================================');
      
      // Automatically analyze video frame count when video is ready
      setTimeout(() => {
        analyzeVideoFrameCount();
      }, 500);
      
      setIsVideoReady(true);
    }

    const handlePlay = () => {
      console.log('🎬 Video play event triggered - setting isPlaying to true');
      setIsPlaying(true);
    }
    const handlePause = () => {
      console.log('🎬 Video pause event triggered - setting isPlaying to false');
      setIsPlaying(false);
    }
    const handleEnded = () => setIsPlaying(false)

    console.log('🎬 Attaching event listeners to video element');
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    console.log('🎬 Event listeners attached successfully');

    return () => {
      console.log('🎬 Removing event listeners from video element');
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, []) // Empty dependency array - only run once when component mounts

  // Cleanup effect to prevent AbortError when component unmounts
  useEffect(() => {
    return () => {
      // Clear frame timestep interval
      if (frameStepInterval) {
        clearInterval(frameStepInterval);
      }
      
      const video = videoRef.current
      if (video && typeof video.pause === 'function') {
        try {
        // Pause and reset video to prevent AbortError
          video.pause();
          video.currentTime = 0;
          video.src = '';
          video.load();
        } catch (error) {
          console.error('Error during video cleanup:', error);
        }
      }
    }
  }, []) // Empty dependency array - only run on unmount

  // Handle video loading errors
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (e: Event) => {
      console.error('Video error:', e)
      setError('Failed to load video')
    }

    const handleLoadStart = () => {
      console.log('Video loading started')
      setLoading(true)
      setError(null)
    }

    const handleCanPlay = () => {
      console.log('Video can play')
      setLoading(false)
    }

    const handleLoadedData = () => {
      console.log('Video data loaded')
      setLoading(false)
    }

    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadeddata', handleLoadedData)

    return () => {
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [videoUrl])

  // Draw skeleton overlay
  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !showSkeleton) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawSkeleton = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const currentFrame = frameData.find(frame => 
        Math.abs((frame.timestamp / 1000) - currentTime) < 0.1
      )
      
      if (currentFrame && currentFrame.landmarks && currentFrame.landmarks.length > 0) {
        // Draw skeleton points
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
        currentFrame.landmarks.forEach((point: any, index: number) => {
          if (point.visibility > 0.5) {
            ctx.beginPath()
            ctx.arc(point.x * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI)
            ctx.fill()
          }
        })
        
        // Draw connections between key points (MediaPipe pose connections)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)'
        ctx.lineWidth = 2
        
        // MediaPipe pose connections (33 landmarks)
        const connections = [
          // Face
          [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
          // Upper body
          [9, 10], // Mouth
          [11, 12], // Shoulders
          [11, 13], [13, 15], // Left arm
          [12, 14], [14, 16], // Right arm
          [11, 23], [12, 24], // Shoulder to hip
          [23, 24], // Hips
          // Lower body
          [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
          [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
        ]
        
        connections.forEach(([start, end]) => {
          if (start < (currentFrame.landmarks?.length || 0) && end < (currentFrame.landmarks?.length || 0)) {
            const startPoint = currentFrame.landmarks?.[start]
            const endPoint = currentFrame.landmarks?.[end]
            
            if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
              ctx.beginPath()
              ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height)
              ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
              ctx.stroke()
            }
          }
        })
        
        // Draw angle values on the video
        if (currentFrame && currentFrame.metrics && showAngles) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = '12px Arial'
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.lineWidth = 2
          
          // Draw key angle values
          const angles = [
            { label: 'L Knee', value: currentFrame.metrics.left_knee_angle, x: 10, y: 30 },
            { label: 'R Knee', value: currentFrame.metrics.right_knee_angle, x: 10, y: 50 },
            { label: 'L Hip', value: currentFrame.metrics.left_hip_angle, x: 10, y: 70 },
            { label: 'R Hip', value: currentFrame.metrics.right_hip_angle, x: 10, y: 90 },
            { label: 'Elevation', value: currentFrame.metrics.angle_of_elevation, x: 10, y: 110 },
            { label: 'ACL Risk', value: currentFrame.metrics.acl_risk, x: 10, y: 130, suffix: '%' }
          ]
          
          angles.forEach(angle => {
            if (angle.value !== undefined) {
              const text = `${angle.label}: ${angle.value.toFixed(0)}${angle.suffix || '°'}`
              ctx.strokeText(text, angle.x, angle.y)
              ctx.fillText(text, angle.x, angle.y)
            }
          })
        }
      }
    }

    const interval = setInterval(drawSkeleton, 1000 / 30) // 30fps
    return () => clearInterval(interval)
  }, [showSkeleton, showAngles, frameData, currentTime])

  const togglePlay = async () => {
    // Check if we have a Cloudflare Stream player
    if (cloudflarePlayer && typeof cloudflarePlayer.play === 'function') {
      try {
        if (isPlaying) {
          cloudflarePlayer.pause();
          console.log('🎬 Cloudflare Stream paused via togglePlay');
        } else {
          await cloudflarePlayer.play();
          console.log('🎬 Cloudflare Stream played via togglePlay');
        }
      } catch (error) {
        console.error('Error controlling Cloudflare Stream player:', error);
      }
      return;
    }

    // Fallback to HTML5 video element
    const video = videoRef.current
    if (!video || typeof video.pause !== 'function') {
      console.error('Video element not available or pause method missing');
      return;
    }

    if (isPlaying) {
      try {
        video.pause();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing video:', error);
        setIsPlaying(false); // Update state anyway
      }
    } else {
      try {
        // Ensure video is ready to play
        if (video.readyState >= 2 && typeof video.play === 'function') {
          try {
            await video.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Error playing video:', error);
            setError('Failed to play video');
          }
        } else {
          // Wait for video to be ready
          const handleCanPlay = async () => {
            try {
              if (typeof video.play === 'function') {
                await video.play();
                setIsPlaying(true);
              } else {
                console.error('Video play method not available');
                setError('Video play method not available');
              }
            } catch (error) {
              console.error('Error playing video after canplay:', error)
              if (error instanceof Error && error.name === 'AbortError') {
                console.log('Video play was aborted (component likely unmounted)')
                return
              }
              setError('Failed to play video')
            }
            video.removeEventListener('canplay', handleCanPlay)
          }
          video.addEventListener('canplay', handleCanPlay, { once: true })
        }
      } catch (error) {
        console.error('Error playing video:', error)
        // Handle AbortError specifically
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Video play was aborted (component likely unmounted)')
          return // Don't set error state for AbortError
        }
        setError('Failed to play video')
      }
    }
  }

  const seekToTime = (time: number, targetFrameIndex?: number) => {
    // Use HTML5 video element for seeking
    if (videoRef.current) {
      videoRef.current.currentTime = time
      console.log(`🎬 Video seeked to ${time.toFixed(3)}s`)
    }
    
    // Immediately update current time
      setCurrentTime(time)
      
    // If targetFrameIndex is provided, use that frame directly
    if (targetFrameIndex !== undefined && targetFrameIndex >= 0 && targetFrameIndex < frameData.length) {
      const targetFrame = frameData[targetFrameIndex];
      setCurrentFrameIndex(targetFrameIndex);
      setSelectedFrame(targetFrame);
    
    // Find the corresponding enhanced frame data
    const currentEnhancedFrame = enhancedFrameData.find(frame => 
        frame.frame_number === targetFrame.frame_number
      );
      setSelectedEnhancedFrame(currentEnhancedFrame || null);
      
        // Update real-time metrics immediately
      const aclRisk = (targetFrame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                      targetFrame.metrics?.acl_risk || 0;
      
        setRealTimeMetrics({
        motionIQ: Math.max(0, 100 - aclRisk * 0.8),
        aclRisk: aclRisk,
        precision: Math.max(0, 100 - aclRisk * 0.6),
        power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: time
      });
      
      console.log(`🎯 Seeked to target frame: ${targetFrame.frame_number} at ${time.toFixed(3)}s (frame index: ${targetFrameIndex})`);
      return;
    }
    
    // Find the closest frame to the seeked time with better precision (fallback)
    const timeMs = time * 1000; // Convert to milliseconds
    let closestFrame = null;
    let closestFrameIndex = -1;
    let minTimeDifference = Infinity;
    
    for (let i = 0; i < frameData.length; i++) {
      const frame = frameData[i];
      const timeDifference = Math.abs(frame.timestamp - timeMs);
      
      if (timeDifference < minTimeDifference) {
        minTimeDifference = timeDifference;
        closestFrame = frame;
        closestFrameIndex = i;
      }
    }
    
    if (closestFrame && minTimeDifference < 50) { // Within 50ms
      // Update frame index and analytics
      setCurrentFrameIndex(closestFrameIndex);
      setSelectedFrame(closestFrame);
    
      // Find the corresponding enhanced frame data
      const currentEnhancedFrame = enhancedFrameData.find(frame => 
        frame.frame_number === closestFrame.frame_number
      );
      setSelectedEnhancedFrame(currentEnhancedFrame || null);
      
      // Update real-time metrics immediately
      const aclRisk = (closestFrame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                      closestFrame.metrics?.acl_risk || 0;
      
      setRealTimeMetrics({
        motionIQ: Math.max(0, 100 - aclRisk * 0.8),
        aclRisk: aclRisk,
        precision: Math.max(0, 100 - aclRisk * 0.6),
        power: Math.max(0, 100 - aclRisk * 0.4),
        timestamp: time
      });
        
      console.log(`🎯 Seeked to closest frame: ${closestFrame.frame_number} at ${time.toFixed(3)}s (difference: ${minTimeDifference.toFixed(1)}ms)`);
      } else {
      console.log(`❌ No frame found for time: ${time.toFixed(3)}s (closest difference: ${minTimeDifference.toFixed(1)}ms)`);
    }
  }

  // Function to calculate actual FPS from video and frame data
  const calculateActualFps = () => {
    if (frameData.length < 2 || !videoRef.current) return null;
    
    console.log('🎬 ===== CALCULATING ACTUAL FPS =====');
    console.log('🎬 Video duration:', videoRef.current.duration);
    console.log('🎬 Frame data length:', frameData.length);
    
    // Method 1: Calculate FPS from video duration and frame count
    const videoDuration = videoRef.current.duration;
    const frameCount = frameData.length;
    const fpsFromDuration = frameCount / videoDuration;
    
    console.log(`🎬 FPS from duration: ${fpsFromDuration.toFixed(2)} (${frameCount} frames / ${videoDuration.toFixed(2)}s)`);
    
    // Method 2: Calculate FPS from frame timestamps
    const firstFrame = frameData[0];
    const lastFrame = frameData[frameData.length - 1];
    const timeSpan = (lastFrame.timestamp - firstFrame.timestamp) / 1000; // Convert to seconds
    const fpsFromTimestamps = (frameData.length - 1) / timeSpan;
    
    console.log(`🎬 FPS from timestamps: ${fpsFromTimestamps.toFixed(2)} (${frameData.length - 1} frame intervals / ${timeSpan.toFixed(2)}s)`);
    console.log(`🎬 First frame timestamp: ${firstFrame.timestamp}ms (${(firstFrame.timestamp/1000).toFixed(3)}s)`);
    console.log(`🎬 Last frame timestamp: ${lastFrame.timestamp}ms (${(lastFrame.timestamp/1000).toFixed(3)}s)`);
    
    // Use the more reliable method (usually timestamps)
    const actualFps = fpsFromTimestamps;
    setCalculatedFps(actualFps);
    setFps(actualFps); // Update the main fps state
    
    console.log(`🎬 Calculated actual FPS: ${actualFps.toFixed(2)}`);
    console.log('🎬 ======================================');
    
    return actualFps;
  };

  // Helper function to validate frame alignment
  const validateFrameAlignment = (frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < frameData.length) {
      const frame = frameData[frameIndex];
      const currentFps = calculatedFps || fps; // Use calculated FPS if available
      const expectedTime = frameIndex / currentFps; // Expected time in seconds
      const actualTime = frame.timestamp / 1000; // Actual time in seconds
      const timeDifference = Math.abs(expectedTime - actualTime);
      
      console.log(`🎯 Frame ${frameIndex + 1} alignment check (FPS: ${currentFps.toFixed(2)}):`);
      console.log(`🎯 Expected time: ${expectedTime.toFixed(3)}s`);
      console.log(`🎯 Actual time: ${actualTime.toFixed(3)}s`);
      console.log(`🎯 Difference: ${timeDifference.toFixed(3)}s`);
      
      return timeDifference < 0.1; // Within 100ms is acceptable
    }
    return false;
  };

  // Function to read video frame count and compare with analytics data
  const analyzeVideoFrameCount = () => {
    const video = videoRef.current;
    if (!video) {
      console.log('🎬 Video element not available for frame count analysis');
      return null;
    }

    console.log('🎬 ===== VIDEO FRAME COUNT ANALYSIS =====');
    
    // Method 1: Try to get frame count from video metadata
    let videoFrameCount = null;
    let videoFps = null;
    
    if (video.getVideoPlaybackQuality) {
      const quality = video.getVideoPlaybackQuality();
      videoFrameCount = quality.totalVideoFrames;
      videoFps = videoFrameCount ? (videoFrameCount / video.duration).toFixed(2) : null;
      
      console.log('🎬 Video Playback Quality API:', {
        totalVideoFrames: quality.totalVideoFrames,
        droppedVideoFrames: quality.droppedVideoFrames,
        corruptedVideoFrames: quality.corruptedVideoFrames,
        calculatedFps: videoFps
      });
    } else {
      console.log('🎬 Video Playback Quality API not available');
    }
    
    // Method 2: Calculate frame count from duration and FPS
    const videoDuration = video.duration;
    const estimatedFps30 = 30; // Standard assumption
    const estimatedFps24 = 24; // Alternative assumption
    const estimatedFps60 = 60; // High frame rate assumption
    
    const estimatedFrames30fps = Math.round(videoDuration * estimatedFps30);
    const estimatedFrames24fps = Math.round(videoDuration * estimatedFps24);
    const estimatedFrames60fps = Math.round(videoDuration * estimatedFps60);
    
    console.log('🎬 Video Duration Analysis:', {
      videoDuration: videoDuration.toFixed(3) + 's',
      estimatedFrames30fps: estimatedFrames30fps,
      estimatedFrames24fps: estimatedFrames24fps,
      estimatedFrames60fps: estimatedFrames60fps
    });
    
    // Method 3: Analyze frame data
    const frameDataLength = frameData.length;
    const enhancedFrameDataLength = enhancedFrameData.length;
    
    let frameDataAnalysis = null;
    if (frameData.length > 0) {
      const firstFrame = frameData[0];
      const lastFrame = frameData[frameData.length - 1];
      const frameTimeSpan = (lastFrame.timestamp - firstFrame.timestamp) / 1000;
      const frameDataFps = frameData.length / frameTimeSpan;
      
      frameDataAnalysis = {
        frameDataLength: frameDataLength,
        enhancedFrameDataLength: enhancedFrameDataLength,
        frameNumberRange: `${firstFrame.frame_number} to ${lastFrame.frame_number}`,
        frameTimeSpan: frameTimeSpan.toFixed(3) + 's',
        calculatedFpsFromData: frameDataFps.toFixed(2),
        firstFrameTimestamp: firstFrame.timestamp,
        lastFrameTimestamp: lastFrame.timestamp,
        firstFrameTimestampSec: (firstFrame.timestamp / 1000).toFixed(3) + 's',
        lastFrameTimestampSec: (lastFrame.timestamp / 1000).toFixed(3) + 's'
      };
    }
    
    console.log('🎬 Frame Data Analysis:', frameDataAnalysis);
    
    // Method 4: Compare all methods
    const comparison = {
      videoFrameCount: videoFrameCount,
      videoFps: videoFps,
      videoDuration: videoDuration,
      frameDataLength: frameDataLength,
      enhancedFrameDataLength: enhancedFrameDataLength,
      estimatedFrames30fps: estimatedFrames30fps,
      estimatedFrames24fps: estimatedFrames24fps,
      estimatedFrames60fps: estimatedFrames60fps,
      matches: {
        videoVsFrameData: videoFrameCount ? videoFrameCount === frameDataLength : 'unknown',
        videoVs30fps: videoFrameCount ? videoFrameCount === estimatedFrames30fps : 'unknown',
        frameDataVs30fps: frameDataLength === estimatedFrames30fps,
        frameDataVs24fps: frameDataLength === estimatedFrames24fps,
        frameDataVs60fps: frameDataLength === estimatedFrames60fps
      }
    };
    
    console.log('🎬 ===== COMPARISON RESULTS =====');
    console.log('🎬 Video Frame Count:', videoFrameCount || 'Not available');
    console.log('🎬 Frame Data Length:', frameDataLength);
    console.log('🎬 Enhanced Frame Data Length:', enhancedFrameDataLength);
    console.log('🎬 Video vs Frame Data Match:', comparison.matches.videoVsFrameData);
    console.log('🎬 Frame Data vs 30fps Match:', comparison.matches.frameDataVs30fps);
    console.log('🎬 Frame Data vs 24fps Match:', comparison.matches.frameDataVs24fps);
    console.log('🎬 Frame Data vs 60fps Match:', comparison.matches.frameDataVs60fps);
    
    if (frameDataAnalysis) {
      console.log('🎬 Calculated FPS from Frame Data:', frameDataAnalysis.calculatedFpsFromData);
    }
    
    console.log('🎬 ======================================');
    
    return comparison;
  };

  // Helper function to fix frame alignment if needed
  const fixFrameAlignment = () => {
    if (frameData.length === 0) return;
    
    console.log('🔧 Checking frame alignment across all frames...');
    let misalignedFrames = 0;
    const currentFps = calculatedFps || fps; // Use calculated FPS if available
    
    console.log(`🔧 Using FPS: ${currentFps.toFixed(2)}`);
    
    for (let i = 0; i < Math.min(10, frameData.length); i++) { // Check first 10 frames
      const frame = frameData[i];
      const expectedTime = i / currentFps;
      const actualTime = frame.timestamp / 1000;
      const timeDifference = Math.abs(expectedTime - actualTime);
      
      if (timeDifference > 0.1) {
        misalignedFrames++;
        console.log(`🔧 Frame ${i + 1} misaligned: expected ${expectedTime.toFixed(3)}s, got ${actualTime.toFixed(3)}s`);
      }
    }
    
    if (misalignedFrames > 0) {
      console.log(`🔧 Found ${misalignedFrames} misaligned frames. This may cause analytics sync issues.`);
      console.log('🔧 Consider using frame index-based navigation instead of timestamp-based navigation.');
    } else {
      console.log('🔧 Frame alignment looks good!');
    }
  };

  // Alternative navigation method using frame index instead of timestamps
  const navigateToFrameByIndex = (frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < frameData.length) {
      const frame = frameData[frameIndex];
      const currentFps = calculatedFps || fps; // Use calculated FPS if available
      
      // Calculate expected time based on frame index using actual FPS
      const expectedTime = frameIndex / currentFps;
      
      console.log(`🎬 Navigating to frame ${frameIndex + 1} using index-based method (FPS: ${currentFps.toFixed(2)})`);
      console.log(`🎬 Expected time: ${expectedTime.toFixed(3)}s`);
      console.log(`🎬 Frame timestamp: ${(frame.timestamp / 1000).toFixed(3)}s`);
      
      // Use the expected time for video seeking instead of frame timestamp
      setCurrentFrameIndex(frameIndex);
      seekToTime(expectedTime, frameIndex);
      
      // Update analytics immediately
      setSelectedFrame(frame);
      const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
      setSelectedEnhancedFrame(enhancedFrame || null);
      
      // Trigger analytics update animation
      setAnalyticsUpdateTrigger(prev => prev + 1);
      
      console.log('🎬 Frame navigation completed using index-based method');
    }
  };

  // Simple frame-by-frame navigation functions - increment/decrement index AND seek video
  const goToPreviousFrame = () => {
    console.log('🎬 ===== PREVIOUS FRAME CLICKED =====')
    console.log('🎬 Current frame index:', currentFrameIndex)
    
    if (currentFrameIndex > 0) {
      const newFrameIndex = currentFrameIndex - 1;
      console.log('🎬 Moving to previous frame:', newFrameIndex + 1);
      
      // Calculate video time position using simple division
      const video = videoRef.current;
      if (video && video.duration) {
        const frameSpacing = video.duration / frameData.length;
        const targetTime = newFrameIndex * frameSpacing;
        
        console.log('🎬 Seeking video to time:', targetTime.toFixed(3) + 's');
        video.currentTime = targetTime;
      }
      
      // Update frame index and show corresponding metrics
      setCurrentFrameIndex(newFrameIndex);
      setLiveAnalyticsFrameIndex(newFrameIndex);
      
      // Update analytics for this frame
      const frame = frameData[newFrameIndex];
      if (frame) {
        setSelectedFrame(frame);
        
        // Find enhanced frame data
        const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
        setSelectedEnhancedFrame(enhancedFrame || null);
        
        // Update metrics
        const aclRisk = (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                        frame.metrics?.acl_risk || 0;
        
        const newMetrics: VideoMetrics = {
          motionIQ: Math.max(0, 100 - aclRisk * 0.8),
          aclRisk: aclRisk,
          precision: Math.max(0, 100 - aclRisk * 0.6),
          power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: newFrameIndex / frameData.length // Simple progress calculation
        };
        
        setRealTimeMetrics(newMetrics);
        onVideoAnalyzed?.(newMetrics);
        setAnalyticsUpdateTrigger(prev => prev + 1);
        
        console.log('✅ Previous frame analytics updated:', {
          frameNumber: frame.frame_number,
          frameIndex: newFrameIndex,
          aclRisk: aclRisk,
          motionIQ: newMetrics.motionIQ,
          videoTime: video?.currentTime?.toFixed(3) + 's'
        });
      }
    } else {
      console.log('🎬 Already at first frame');
    }
  }

  const goToNextFrame = () => {
    console.log('🎬 ===== NEXT FRAME CLICKED =====')
    console.log('🎬 Current frame index:', currentFrameIndex)
    
    if (currentFrameIndex < frameData.length - 1) {
      const newFrameIndex = currentFrameIndex + 1;
      console.log('🎬 Moving to next frame:', newFrameIndex + 1);
      
      // Calculate video time position using simple division
      const video = videoRef.current;
      if (video && video.duration) {
        const frameSpacing = video.duration / frameData.length;
        const targetTime = newFrameIndex * frameSpacing;
        
        console.log('🎬 Seeking video to time:', targetTime.toFixed(3) + 's');
        video.currentTime = targetTime;
      }
      
      // Update frame index and show corresponding metrics
      setCurrentFrameIndex(newFrameIndex);
      setLiveAnalyticsFrameIndex(newFrameIndex);
      
      // Update analytics for this frame
      const frame = frameData[newFrameIndex];
      if (frame) {
        setSelectedFrame(frame);
        
        // Find enhanced frame data
        const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
        setSelectedEnhancedFrame(enhancedFrame || null);
        
        // Update metrics
        const aclRisk = (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                        frame.metrics?.acl_risk || 0;
        
        const newMetrics: VideoMetrics = {
          motionIQ: Math.max(0, 100 - aclRisk * 0.8),
          aclRisk: aclRisk,
          precision: Math.max(0, 100 - aclRisk * 0.6),
          power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: newFrameIndex / frameData.length // Simple progress calculation
        };
        
        setRealTimeMetrics(newMetrics);
        onVideoAnalyzed?.(newMetrics);
        setAnalyticsUpdateTrigger(prev => prev + 1);
        
        console.log('✅ Next frame analytics updated:', {
          frameNumber: frame.frame_number,
          frameIndex: newFrameIndex,
          aclRisk: aclRisk,
          motionIQ: newMetrics.motionIQ,
          videoTime: video?.currentTime?.toFixed(3) + 's'
        });
      }
    } else {
      console.log('🎬 Already at last frame');
    }
  }

  const goToFrame = (frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < frameData.length) {
      console.log('🎬 Jumping to frame:', frameIndex + 1);
      
      // Calculate video time position using simple division
      const video = videoRef.current;
      if (video && video.duration) {
        const frameSpacing = video.duration / frameData.length;
        const targetTime = frameIndex * frameSpacing;
        
        console.log('🎬 Seeking video to time:', targetTime.toFixed(3) + 's');
        video.currentTime = targetTime;
      }
      
      // Update frame index and show corresponding metrics
      setCurrentFrameIndex(frameIndex);
      setLiveAnalyticsFrameIndex(frameIndex);
      
      // Update analytics for this frame
      const frame = frameData[frameIndex];
      if (frame) {
        setSelectedFrame(frame);
        
        // Find enhanced frame data
        const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
        setSelectedEnhancedFrame(enhancedFrame || null);
        
        // Update metrics
        const aclRisk = (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                        frame.metrics?.acl_risk || 0;
        
        const newMetrics: VideoMetrics = {
          motionIQ: Math.max(0, 100 - aclRisk * 0.8),
          aclRisk: aclRisk,
          precision: Math.max(0, 100 - aclRisk * 0.6),
          power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: frameIndex / frameData.length // Simple progress calculation
        };
        
        setRealTimeMetrics(newMetrics);
        onVideoAnalyzed?.(newMetrics);
        setAnalyticsUpdateTrigger(prev => prev + 1);
        
        console.log('✅ Frame jump analytics updated:', {
          frameNumber: frame.frame_number,
          frameIndex: frameIndex,
          aclRisk: aclRisk,
          motionIQ: newMetrics.motionIQ,
          videoTime: video?.currentTime?.toFixed(3) + 's'
        });
      }
    }
  }

  // Frame timestep progression functions
  const startFrameTimesteps = () => {
    if (frameStepInterval) {
      clearInterval(frameStepInterval)
    }
    
    let currentStepIndex = currentFrameIndex
    
    const interval = setInterval(() => {
      currentStepIndex = currentStepIndex + 1
      
      if (currentStepIndex >= frameData.length) {
        // Reached end, stop progression
        clearInterval(interval)
        setFrameStepInterval(null)
        console.log('🎬 Frame timestep progression completed')
        return
      }
      
      // Use simple frame-by-frame navigation - increment index, seek video, and show metrics
      console.log('🎬 Frame timestep:', currentStepIndex + 1);
      
      // Calculate video time position using simple division
      const video = videoRef.current;
      if (video && video.duration) {
        const frameSpacing = video.duration / frameData.length;
        const targetTime = currentStepIndex * frameSpacing;
        
        console.log('🎬 Seeking video to time:', targetTime.toFixed(3) + 's');
        video.currentTime = targetTime;
      }
      
      // Update frame index and show corresponding metrics
      setCurrentFrameIndex(currentStepIndex);
      setLiveAnalyticsFrameIndex(currentStepIndex);
      
      // Update analytics for this frame
      const frame = frameData[currentStepIndex];
      if (frame) {
        setSelectedFrame(frame);
        
        // Find enhanced frame data
        const enhancedFrame = enhancedFrameData.find(f => f.frame_number === frame.frame_number);
        setSelectedEnhancedFrame(enhancedFrame || null);
        
        // Update metrics
        const aclRisk = (frame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                        frame.metrics?.acl_risk || 0;
        
        const newMetrics: VideoMetrics = {
          motionIQ: Math.max(0, 100 - aclRisk * 0.8),
          aclRisk: aclRisk,
          precision: Math.max(0, 100 - aclRisk * 0.6),
          power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: currentStepIndex / frameData.length // Simple progress calculation
        };
        
        setRealTimeMetrics(newMetrics);
        onVideoAnalyzed?.(newMetrics);
        setAnalyticsUpdateTrigger(prev => prev + 1);
        
        console.log('✅ Timestep analytics updated:', {
          frameNumber: frame.frame_number,
          frameIndex: currentStepIndex,
          aclRisk: aclRisk,
          motionIQ: newMetrics.motionIQ,
          videoTime: video?.currentTime?.toFixed(3) + 's'
        });
      }
    }, 100) // 100ms between frames (10 FPS)
    
    setFrameStepInterval(interval)
    console.log('🎬 Started frame timestep progression from frame:', currentFrameIndex + 1)
    console.log('🎬 Total frames available:', frameData.length)
    console.log('🎬 Frame data sample:', frameData.slice(0, 3))
  }

  const stopFrameTimesteps = () => {
    if (frameStepInterval) {
      clearInterval(frameStepInterval)
      setFrameStepInterval(null)
      console.log('Stopped frame timestep progression')
    }
  }

  const toggleFrameTimesteps = () => {
    if (frameStepInterval) {
      stopFrameTimesteps()
    } else {
      startFrameTimesteps()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Calculate optimal video container dimensions
  const getVideoContainerStyle = () => {
    if (!videoAspectRatio) {
      return { width: '100%', height: '700px' }
    }

    // Use larger dimensions for better visibility - increased horizontal space
    const containerWidth = 1400 // Increased width for better horizontal space
    const containerHeight = 700 // Increased height
    const containerAspectRatio = containerWidth / containerHeight

    let optimalWidth = containerWidth
    let optimalHeight = containerHeight

    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider than container - fit to width
      optimalHeight = containerWidth / videoAspectRatio
    } else {
      // Video is taller than container - fit to height
      optimalWidth = containerHeight * videoAspectRatio
    }

    return {
      width: `${optimalWidth}px`,
      height: `${optimalHeight}px`,
      maxWidth: '100%',
      maxHeight: '700px'
    }
  }


  const toggleFullscreen = () => {
    console.log('Toggling fullscreen, current state:', isFullscreen)
    console.log('Using HTML5 video fullscreen')

    // Handle HTML5 video fullscreen
      const videoElement = videoRef.current
      if (!videoElement) {
        console.error('Video element not available for fullscreen')
        return
      }

      if (!isFullscreen) {
        // Enter fullscreen
        console.log('Entering video fullscreen...')
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen().catch(err => {
            console.error('Error entering fullscreen:', err)
          })
        } else if ((videoElement as any).webkitRequestFullscreen) {
          (videoElement as any).webkitRequestFullscreen()
        } else if ((videoElement as any).msRequestFullscreen) {
          (videoElement as any).msRequestFullscreen()
        } else {
          console.error('Fullscreen API not supported')
        }
      } else {
        // Exit fullscreen
        console.log('Exiting video fullscreen...')
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.error('Error exiting fullscreen:', err)
          })
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen()
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen()
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement
      let isCurrentlyFullscreen = false
      
      if (fullscreenElement) {
        // Check if the video element is in fullscreen
          isCurrentlyFullscreen = fullscreenElement === videoRef.current
      }
      
      console.log('Fullscreen change detected:', isCurrentlyFullscreen)
      console.log('Fullscreen element:', fullscreenElement)
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcuts for frame-by-frame navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when the video player is open and focused
      if (event.target === document.body || (event.target as HTMLElement)?.closest('.video-player-container')) {
        console.log('🎬 ===== KEYBOARD EVENT =====')
        console.log('🎬 Key pressed:', event.key)
        console.log('🎬 Target:', event.target)
        console.log('🎬 Current frame index:', currentFrameIndex)
        console.log('🎬 Frame data length:', frameData.length)
        console.log('🎬 Is manual navigation:', isManualNavigation)
        console.log('🎬 ==========================')
        
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault()
            console.log('🎬 Arrow Left - calling goToPreviousFrame()')
            goToPreviousFrame()
            break
          case 'ArrowRight':
            event.preventDefault()
            console.log('🎬 Arrow Right - calling goToNextFrame()')
            goToNextFrame()
            break
          case ' ':
            event.preventDefault()
            togglePlay()
            break
          case 'f':
          case 'F':
            event.preventDefault()
            toggleFullscreen()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, []) // Empty dependency array - only add/remove listener once to prevent state conflicts

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16 video-player-container">
      <div className="bg-white rounded-lg w-full max-w-[95vw] max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-semibold">AI Video Analysis</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click video to advance frame-by-frame • Right-click to go back • Use ← → arrow keys • Spacebar to play/pause • F for fullscreen
            </p>
          </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="h-4 w-4" />
                    </Button>
        </div>

        <div className="p-2 pb-8 space-y-2">
          {/* Video Player with Analytics Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
            {/* Video Player - Left Side */}
            <div className="lg:col-span-3">
              <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center" style={getVideoContainerStyle()}>
              {error ? (
                <div className="text-center text-white p-6">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-semibold mb-2">Video Load Error</h3>
                  <p className="text-sm text-gray-300 mb-4">{error}</p>
                  <p className="text-xs text-gray-400 mb-4">Video URL: {actualVideoUrl}</p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        // Try to reload the video
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                    >
                      Retry Loading
                    </Button>
                    <Button 
                      onClick={() => {
                        // Try opening the video in a new tab
                        if (actualVideoUrl) {
                        window.open(actualVideoUrl, '_blank');
                        }
                      }}
                      variant="outline"
                      className="border-white text-white hover:bg-white hover:text-black"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Use direct video loading if download URL is available, otherwise use Cloudflare Stream player or iframe fallback */}
                  {isCloudflareStream && cloudflareVideoId && !cloudflareDownloadUrl ? (
                    <div className="relative">
                      {cloudflarePlayerContainer ? (
                        // Use Cloudflare Stream player
                        <div 
                          ref={(el) => {
                            if (el && cloudflarePlayerContainer && !el.contains(cloudflarePlayerContainer)) {
                              el.appendChild(cloudflarePlayerContainer);
                            }
                          }}
                          className="relative w-full h-full"
                          style={{ minHeight: '400px' }}
                        />
                      ) : (
                        // Fallback to iframe with proper styling
                        <div style={{ position: 'relative', paddingTop: '177.77777777777777%' }}>
                    <iframe
                            src={getCloudflareIframeUrl(cloudflareVideoId) || cloudflareStreamUrl || ''}
                            loading="lazy"
                            style={{ 
                              border: 'none', 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              height: '100%', 
                              width: '100%' 
                            }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen={true}
                      onLoad={() => {
                    console.log('🎬 ===== CLOUDFLARE IFRAME LOADED =====');
                    console.log('🎬 Iframe src:', getCloudflareIframeUrl(cloudflareVideoId) || cloudflareStreamUrl);
                    console.log('🎬 Cloudflare Video ID:', cloudflareVideoId);
                    console.log('🎬 =====================================');
                        setLoading(false);
                      }}
                      onError={() => {
                              console.error('❌ Cloudflare Stream iframe load error');
                        setError('Failed to load Cloudflare Stream video');
                        setLoading(false);
                      }}
                    />
                        </div>
                      )}
                      
                      {/* Loading indicator */}
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p>Loading Cloudflare Stream...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Persistent frame number display - below video */}
                      <div className="absolute -bottom-16 right-4 bg-black bg-opacity-80 rounded-lg px-4 py-2 pointer-events-none">
                        <div className="text-white text-lg font-bold">
                          Frame {currentFrameIndex + 1} / {frameData.length}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000)}
                        </div>
                      </div>
                    </div>
                  ) : (cloudflareDownloadUrl || actualVideoUrl) ? (
                    // Regular HTML5 video element with click-to-advance
                    // This will be used when we have a download URL or regular video URL
                    (() => {
                      console.log('🎬 ===== RENDERING DIRECT VIDEO ELEMENT =====');
                      console.log('🎬 cloudflareDownloadUrl:', cloudflareDownloadUrl);
                      console.log('🎬 actualVideoUrl:', actualVideoUrl);
                      console.log('🎬 Using direct video loading approach');
                      console.log('🎬 ======================================');
                      return null;
                    })(),
                    <div 
                      className="relative w-full h-full cursor-pointer"
                      onClick={goToNextFrame}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        goToPreviousFrame();
                      }}
                      title="Click to advance to next frame, right-click to go to previous frame"
                    >
                    <video
                      ref={videoRef}
                      className="w-full h-full max-h-[700px] object-contain"
                      preload="metadata"
                      playsInline
                      muted
                      controls
                      crossOrigin={cloudflareDownloadUrl ? undefined : "anonymous"}
                      onLoadedMetadata={() => {
                        console.log('🎬 ===== VIDEO METADATA LOADED =====');
                        console.log('🎬 Video duration:', videoRef.current?.duration);
                        console.log('🎬 Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                        console.log('🎬 Video readyState:', videoRef.current?.readyState);
                        console.log('🎬 ==================================');
                        if (videoRef.current) {
                          const video = videoRef.current;
                          const aspectRatio = video.videoWidth / video.videoHeight;
                          setVideoAspectRatio(aspectRatio);
                          console.log('Video aspect ratio:', aspectRatio);
                          
                          // Calculate FPS when video metadata is loaded and frame data is available
                          if (frameData.length > 0) {
                            setTimeout(() => {
                              calculateActualFps();
                            }, 100);
                          }
                        }
                      }}
                      onLoadedData={() => {
                        console.log('🎬 ===== VIDEO ELEMENT LOADED =====');
                        console.log('🎬 Video element src:', videoRef.current?.src);
                        console.log('🎬 Video element currentSrc:', videoRef.current?.currentSrc);
                        console.log('🎬 Video element duration:', videoRef.current?.duration);
                        console.log('🎬 Video element readyState:', videoRef.current?.readyState);
                        console.log('🎬 Video element networkState:', videoRef.current?.networkState);
                        console.log('🎬 ================================');
                        setLoading(false);
                      }}
                      onError={(e) => {
                        console.error('Video load error:', e);
                        console.error('Video URL:', actualVideoUrl);
                        console.error('Video element error:', e.currentTarget?.error);
                        console.error('Error details:', {
                          code: e.currentTarget?.error?.code,
                          message: e.currentTarget?.error?.message,
                          networkState: e.currentTarget?.networkState,
                          readyState: e.currentTarget?.readyState
                        });
                        
                        const errorCode = e.currentTarget?.error?.code;
                        let errorMessage = 'Unknown video error';
                        
                        switch (errorCode) {
                          case 1:
                            errorMessage = 'Video loading aborted';
                            break;
                          case 2:
                            errorMessage = 'Network error while loading video';
                            break;
                          case 3:
                            errorMessage = 'Video decoding error';
                            break;
                          case 4:
                            errorMessage = 'Video format not supported';
                            break;
                          default:
                            errorMessage = `Video error (code: ${errorCode})`;
                        }
                        
                        setError(errorMessage);
                        setLoading(false);
                      }}
                      onCanPlay={() => {
                        console.log('Video can play');
                        setLoading(false);
                      }}
                      onLoadStart={() => {
                        console.log('Video load started');
                        setLoading(true);
                      }}
                      onPlay={() => {
                        console.log('Video started playing');
                        setIsPlaying(true);
                      }}
                      onPause={() => {
                        console.log('Video paused');
                        setIsPlaying(false);
                      }}
                      onTimeUpdate={handleTimeUpdate}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {(cloudflareDownloadUrl || actualVideoUrl) && (
                        <source 
                          src={cloudflareDownloadUrl || actualVideoUrl} 
                          type="video/mp4" 
                          id="videoSource"
                        />
                      )}
                      Your browser does not support the video tag.
                    </video>
                      
                      {/* Click overlay indicator */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black bg-opacity-60 rounded-full p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                          <StepBack className="h-5 w-5 text-white" />
                          <span className="text-white text-sm font-medium">Click to advance</span>
                          <StepForward className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      
                      {/* Persistent frame number display on video - below video */}
                      <div className="absolute -bottom-16 right-4 bg-black bg-opacity-80 rounded-lg px-4 py-2 pointer-events-none">
                        <div className="text-white text-lg font-bold">
                          Frame {currentFrameIndex + 1} / {frameData.length}
                        </div>
                        <div className="text-gray-300 text-sm">
                          {formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-white p-6">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
                      <p className="text-sm text-gray-300">No video URL provided</p>
                      <div className="text-xs text-gray-400 mt-4 space-y-1">
                        <p>Debug Info:</p>
                        <p>isCloudflareStream: {String(isCloudflareStream)}</p>
                        <p>cloudflareVideoId: {cloudflareVideoId || 'null'}</p>
                        <p>cloudflareDownloadUrl: {cloudflareDownloadUrl || 'null'}</p>
                        <p>actualVideoUrl: {actualVideoUrl || 'null'}</p>
                        <p>videoUrl: {videoUrl || 'null'}</p>
                        <p>processedVideoFilename: {processedVideoFilename || 'null'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Loading indicator */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Loading video...</p>
                  </div>
                </div>
              )}


              {/* Video Controls - Only Fullscreen Button */}
              <div className="absolute bottom-4 right-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>
                
              {/* Cloudflare Download Controls */}
              {isCloudflareStream && cloudflareVideoId && (
                <div className="absolute top-4 right-4 flex flex-col space-y-2">
                    <Button 
                    variant="outline" 
                      size="sm" 
                    onClick={() => enableCloudflareDownload(cloudflareVideoId)}
                    disabled={downloadEnabled}
                    className="text-white border-white hover:bg-white hover:text-black"
                    >
                    {downloadEnabled ? 'Download Enabled' : 'Enable Download'}
                  </Button>
                  {downloadEnabled && (
                    <>
                    <Button 
                        variant="outline" 
                      size="sm" 
                        onClick={() => checkCloudflareDownloadStatus(cloudflareVideoId)}
                        className="text-white border-white hover:bg-white hover:text-black"
                    >
                        Get Download URL
                    </Button>
                      {cloudflareDownloadUrl && (
                        <>
                    <Button 
                            variant="outline" 
                      size="sm" 
                            onClick={() => testDownloadUrlAccessibility(cloudflareDownloadUrl)}
                            className="text-white border-white hover:bg-white hover:text-black"
                    >
                            Test Download URL
                  </Button>
                  <Button 
                            variant="outline" 
                    size="sm" 
                            onClick={() => tryDirectVideoLoad(cloudflareDownloadUrl)}
                            className="text-white border-white hover:bg-white hover:text-black"
                  >
                            Try Direct Video Load
                  </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Frame-by-Frame Controls - Moved to very bottom */}
              <div className="absolute bottom-8 left-4 right-4 flex items-center justify-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={goToPreviousFrame}
                    disabled={currentFrameIndex <= 0}
                    className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                  >
                    <StepBack className="h-3 w-3" />
                  </Button>
                  <span className="text-white text-xs px-2">
                    Frame: {currentFrameIndex + 1} / {frameData.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={goToNextFrame}
                    disabled={currentFrameIndex >= frameData.length - 1}
                    className="text-white hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
                  >
                    <StepForward className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleFrameTimesteps}
                    className={`text-white hover:bg-white hover:bg-opacity-20 ${frameStepInterval ? 'bg-blue-600 bg-opacity-50' : ''}`}
                    title={frameStepInterval ? "Stop frame timesteps" : "Start frame timesteps"}
                  >
                    {frameStepInterval ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <span className="text-white text-xs px-2">
                  {frameData.length > 0 ? `Frame Time: ${formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000)}` : ''}
                  </span>
              </div>
                </div>

            </div>
            
            {/* Real-time Analytics Panels - Right Side */}
            <div className="lg:col-span-2 space-y-1">
              
              {/* Frame Information Panel */}
              <Card key={`frame-info-${analyticsUpdateTrigger}`} className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-gray-300">Current Frame</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Frame:</span>
                    <span className="text-blue-400 text-xs font-mono">
                      {currentFrameIndex + 1} / {frameData.length}
                    </span>
            </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Time:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {frameData.length > 0 ? formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000) : '0:00'}
                    </span>
            </div>
                </CardContent>
              </Card>


              {/* Movement Analysis Panel */}
              <Card key={`movement-${analyticsUpdateTrigger}`} className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-gray-300">Movement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Height:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {enhancedFrameData[currentFrameIndex] ? (enhancedFrameData[currentFrameIndex].height_from_ground * 100).toFixed(1) : '0.0'}cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Elevation:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {enhancedFrameData[currentFrameIndex] ? enhancedFrameData[currentFrameIndex].elevation_angle.toFixed(1) : '0.0'}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Forward Lean:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {enhancedFrameData[currentFrameIndex] ? enhancedFrameData[currentFrameIndex].forward_lean_angle.toFixed(1) : '0.0'}°
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Tumbling Detection Panel */}
              <Card key={`tumbling-${analyticsUpdateTrigger}`} className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-gray-300">Tumbling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Status:</span>
                    <span className={`text-xs font-semibold ${
                      enhancedFrameData[currentFrameIndex]?.tumbling_detected ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {enhancedFrameData[currentFrameIndex]?.tumbling_detected ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Phase:</span>
                    <span className="text-cyan-400 text-xs font-semibold">
                      {(enhancedFrameData[currentFrameIndex]?.flight_phase || 'GROUND').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Quality:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {enhancedFrameData[currentFrameIndex] ? enhancedFrameData[currentFrameIndex].tumbling_quality.toFixed(1) : '0.0'}/100
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* ACL Risk Analysis Panel */}
              <Card key={`acl-risk-${analyticsUpdateTrigger}`} className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-gray-300">ACL Risk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Overall Risk:</span>
                    <span className={`text-xs font-mono ${
                      (enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.overall_acl_risk || 0) > 50 ? 'text-red-400' : 
                      (enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.overall_acl_risk || 0) > 25 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {(enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.overall_acl_risk || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Risk Level:</span>
                    <span className={`text-xs font-semibold ${
                      (enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.risk_level === 'HIGH') ? 'text-red-400' : 
                      (enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.risk_level === 'MODERATE') ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.risk_level || 'LOW'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Knee Angle:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {(enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.knee_angle_risk || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Knee Valgus:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {(enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.knee_valgus_risk || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Landing:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {(enhancedFrameData[currentFrameIndex]?.acl_risk_factors?.landing_mechanics_risk || 0).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Risk Timeline Component - Aligned with video player */}
          <div className="lg:col-span-3 mt-2">
            <RiskTimeline
              frameData={frameData}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekToTime}
            />
          </div>

          {/* Enhanced Statistics Summary - Right under Risk Bar */}
          {!loading && !error && enhancedFrameData.length > 0 && enhancedStats && (
            <Card className="bg-gray-900 text-white border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-200">Enhanced Statistics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tumbling Detection Section */}
                    <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Tumbling Detection</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Tumbling Frames:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.tumbling_detection.total_tumbling_frames}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Percentage:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.tumbling_detection.tumbling_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Flight Phases:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {Object.values(enhancedStats.tumbling_detection.flight_phases).reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACL Risk Analysis Section */}
                    <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">ACL Risk Analysis</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Avg Overall Risk:</span>
                        <span className={`text-xs font-mono ${
                          enhancedStats.acl_risk_analysis.average_overall_risk > 50 ? 'text-red-400' : 
                          enhancedStats.acl_risk_analysis.average_overall_risk > 25 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {enhancedStats.acl_risk_analysis.average_overall_risk.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">High Risk Frames:</span>
                        <span className="text-red-400 text-xs font-mono">
                          {enhancedStats.acl_risk_analysis.high_risk_frames}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Avg Knee Valgus:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.acl_risk_analysis.average_knee_valgus_risk.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Movement Analysis Section */}
                    <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Movement Analysis</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Avg Elevation:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.movement_analysis.average_elevation_angle.toFixed(1)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Max Elevation:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.movement_analysis.max_elevation_angle.toFixed(1)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Avg Height:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.movement_analysis.average_height_from_ground.toFixed(1)}cm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tumbling Quality Section */}
                    <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Tumbling Quality</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Avg Quality:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.tumbling_quality.average_quality.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Max Quality:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.tumbling_quality.max_quality.toFixed(1)}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Quality Frames:</span>
                        <span className="text-cyan-400 text-xs font-mono">
                          {enhancedStats.tumbling_quality.quality_frames_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug: Show when enhanced statistics are not available */}
          {!loading && !error && (!enhancedFrameData.length || !enhancedStats) && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Enhanced Statistics Not Available</h3>
                    <p className="text-sm text-yellow-700">
                      Enhanced frame data: {enhancedFrameData.length} frames, 
                      Enhanced stats: {enhancedStats ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Loading frame data...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="text-sm text-red-700">{error}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}


