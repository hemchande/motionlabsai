"use client"

import React, { useState, useRef, useEffect } from 'react'

// Cloudflare Stream SDK declaration removed - using direct video URLs now
import { API_BASE_URL } from '@/lib/api'
import { extractVideoBaseName } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  video_time?: number; // Add video_time property for direct time access
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
  console.log('AutoAnalyzedVideoPlayer props:', {
    videoUrl,
    videoName,
    analyticsBaseName,
    processedVideoFilename,
    sessionId,
    analyticsId,
    analyticsUrl
  });

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
    console.log('🔍 Debug Cloudflare URL conversion:', { processedVideoUrl, videoUrl });
    
    // Since direct MP4 download doesn't work due to CORS/codec issues, use iframe embed
    // Extract video ID and create iframe URL instead
    const extractVideoIdFromUrl = (url: string) => {
      console.log('🔍 Processing URL:', url);
      
      // Use regex to extract 32-character hex string (Cloudflare Stream ID format)
      const regex = /cloudflarestream\.com\/([a-f0-9]{32})/i;
      const match = url.match(regex);
      
      if (match && match[1]) {
        const videoId = match[1];
        console.log('✅ Extracted video ID:', videoId);
        return videoId;
      }
      
      console.log('❌ Could not extract video ID from URL:', url);
      return null;
    };
    
    const createIframeUrl = (videoId: string) => {
      // Use iframe embed URL instead of direct download
      return `https://customer-cxebs7nmdazhytrk.cloudflarestream.com/${videoId}/iframe`;
    };
    
    // Check processedVideoUrl first
    if (processedVideoUrl && processedVideoUrl.includes('cloudflarestream.com')) {
      const videoId = extractVideoIdFromUrl(processedVideoUrl);
      if (videoId) {
        const iframeUrl = createIframeUrl(videoId);
        console.log('🎬 Converted processed video URL to iframe URL:', iframeUrl);
        return iframeUrl;
      }
      console.log('🎬 Using Cloudflare Stream processed video URL as-is:', processedVideoUrl);
      return processedVideoUrl;
    }
    
    // Check videoUrl
    if (videoUrl && videoUrl.includes('cloudflarestream.com')) {
      const videoId = extractVideoIdFromUrl(videoUrl);
      if (videoId) {
        const iframeUrl = createIframeUrl(videoId);
        console.log('🎬 Converted video URL to iframe URL:', iframeUrl);
        return iframeUrl;
      }
      console.log('🎬 Using Cloudflare Stream video URL as-is:', videoUrl);
      return videoUrl;
    }
    
    return null;
  }, [videoUrl, processedVideoUrl]);

  const actualVideoUrl = React.useMemo(() => {
    // Priority 1: If we have a Cloudflare Stream URL (converted to direct video), use it
    if (cloudflareStreamUrl) {
      console.log('🎬 Using Cloudflare Stream direct video URL:', cloudflareStreamUrl);
      return cloudflareStreamUrl;
    }
    
    // Priority 2: If we have a processed video filename, use backend API
    if (processedVideoFilename) {
      return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(processedVideoFilename)}`;
    }
    
    // Priority 3: If we have a video name, use backend API
    if (videoName) {
      return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(videoName)}`;
    }
    
    // Priority 4: Fallback to the provided videoUrl if it exists and doesn't contain localhost
    if (videoUrl && !videoUrl.includes('localhost')) {
      return videoUrl;
    }
    
    // Priority 5: If videoUrl contains localhost, try to extract filename and construct proper URL
    if (videoUrl && videoUrl.includes('localhost')) {
      const url = new URL(videoUrl);
      const filename = url.searchParams.get('video_filename');
      if (filename) {
        return `${API_BASE_URL}/getVideo?video_filename=${encodeURIComponent(filename)}`;
      }
    }
    
    // Priority 6: If we have a sessionId, use the session-based video endpoint (last resort)
    if (sessionId) {
      return `${API_BASE_URL}/getVideoFromSession/${sessionId}`;
    }
    
    return videoUrl;
  }, [processedVideoFilename, videoName, videoUrl, sessionId, cloudflareStreamUrl]);

  // Store original Cloudflare Stream URLs for fallback
  const originalCloudflareUrls = React.useMemo(() => {
    const urls = [];
    if (processedVideoUrl && processedVideoUrl.includes('cloudflarestream.com')) {
      urls.push(processedVideoUrl);
    }
    if (videoUrl && videoUrl.includes('cloudflarestream.com')) {
      urls.push(videoUrl);
    }
    return urls;
  }, [processedVideoUrl, videoUrl]);

  // Note: Cloudflare Stream SDK loading removed since we're using direct video URLs

  // Reset error state when videoUrl changes
  useEffect(() => {
    setError(null);
    setLoading(true);
    console.log('Video URL changed to:', actualVideoUrl);
    console.log('Is Cloudflare Stream:', isCloudflareStream);
    console.log('Cloudflare Stream URL:', cloudflareStreamUrl);
    
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
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showAngles, setShowAngles] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [fps, setFps] = useState(30)
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

  // Video time update handler
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || typeof video.currentTime !== 'number') {
      console.warn('Video element not ready or currentTime not available');
      return;
    }
    
    setCurrentTime(video.currentTime)
    
    // Debug frame data availability
    if (video.currentTime % 2 < 0.1) { 
      console.log(frameData)// Log every 2 seconds
      console.log('🎬 Video time update:', {
        currentTime: video.currentTime,
        frameDataLength: frameData.length,
        enhancedFrameDataLength: enhancedFrameData.length,
        selectedFrame: selectedFrame?.frame_number,
        selectedEnhancedFrame: selectedEnhancedFrame?.frame_number
      });
    }
    
    // Update real-time metrics based on current frame
    const currentFrame = frameData.find(frame => 
      Math.abs(frame.timestamp - video.currentTime) < 0.1
    )
    
    // Update current frame index for frame-by-frame navigation
    if (currentFrame) {
      const frameIndex = frameData.findIndex(frame => frame.frame_number === currentFrame.frame_number)
      if (frameIndex !== -1) {
        setCurrentFrameIndex(frameIndex)
      }
      
      if (video.currentTime % 2 < 0.1) { // Log every 2 seconds
        console.log('🎯 Found current frame:', {
          frameNumber: currentFrame.frame_number,
          timestamp: currentFrame.timestamp,
          frameIndex: frameIndex,
          metrics: currentFrame.metrics
        });
      }
    } else {
      if (video.currentTime % 2 < 0.1) { // Log every 2 seconds
        console.log('❌ No current frame found for time:', video.currentTime);
        if (frameData.length > 0) {
          console.log('📊 Frame data range:', {
            firstFrameTime: frameData[0].timestamp,
            lastFrameTime: frameData[frameData.length - 1].timestamp,
            firstFrameNumber: frameData[0].frame_number,
            lastFrameNumber: frameData[frameData.length - 1].frame_number
          });
        }
      }
    }
    
    // Debug logging
    if (video.currentTime % 1 < 0.1) { // Log every second
      console.log('Video time:', video.currentTime, 'Frame data length:', frameData.length)
      if (frameData.length > 0) {
        console.log('First frame timestamp:', frameData[0].timestamp, 'Last frame timestamp:', frameData[frameData.length - 1].timestamp)
      }
      if (currentFrame) {
        console.log('Found current frame:', currentFrame.frame_number, 'at time:', currentFrame.timestamp)
      } else {
        console.log('No current frame found for time:', video.currentTime)
      }
    }
    
    if (currentFrame) {
      // Update current frame metrics for top-left display
      setSelectedFrame(currentFrame)
      
      // Find the corresponding enhanced frame data
      const currentEnhancedFrame = enhancedFrameData.find(frame => 
        Math.abs(frame.timestamp - video.currentTime) < 0.1
      )
      
      // Debug logging
      if (video.currentTime % 1 < 0.1) { // Log every second
        console.log('Enhanced frame data length:', enhancedFrameData.length)
        if (enhancedFrameData.length > 0) {
          console.log('First enhanced frame sample:', enhancedFrameData[0])
        }
        if (currentEnhancedFrame) {
          console.log('Found enhanced frame for time:', video.currentTime, currentEnhancedFrame)
        } else {
          console.log('No enhanced frame found for time:', video.currentTime)
        }
      }
      
      setSelectedEnhancedFrame(currentEnhancedFrame || null)
      
      // Extract ACL risk from the correct data structure
      const aclRisk = (currentFrame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                      currentFrame.metrics?.acl_risk || 0
      
      const newMetrics: VideoMetrics = {
        motionIQ: Math.max(0, 100 - aclRisk * 0.8),
        aclRisk: aclRisk,
        precision: Math.max(0, 100 - aclRisk * 0.6),
        power: Math.max(0, 100 - aclRisk * 0.4),
        timestamp: video.currentTime
      }
      setRealTimeMetrics(newMetrics)
      onVideoAnalyzed?.(newMetrics)
    }
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
            setFrameData(allFrames);
            
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
    
    for (let i = 0; i < totalFrames; i++) {
      const timestamp = (i / 30) * 1000; // Convert frame to milliseconds
      
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
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [frameData, enhancedFrameData, onVideoAnalyzed])

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
  }, [frameStepInterval])

  // Handle video loading errors
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleError = (e: Event) => {
      console.error('🎬 Video error:', e)
      console.error('🎬 Video element:', video)
      console.error('🎬 Video src:', video.src)
      console.error('🎬 Video error details:', video.error)
      console.error('🎬 Video network state:', video.networkState)
      console.error('🎬 Video ready state:', video.readyState)
      
      let errorMessage = 'Failed to load video';
      if (video.error) {
        switch (video.error.code) {
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
            errorMessage = `Video error (code: ${video.error.code})`;
        }
      }
      
      setError(errorMessage)
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
        Math.abs(frame.timestamp - currentTime) < 0.1
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
    const video = videoRef.current
    if (!video || typeof video.pause !== 'function') {
      console.error('Video element not available or pause method missing');
      return;
    }

    if (isPlaying) {
      try {
        video.pause();
        setIsPlaying(false);
        console.log('🎬 Video paused');
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
            console.log('🎬 Video playing');
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
                console.log('🎬 Video playing after canplay event');
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

  const seekToTime = (time: number) => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not available for seeking');
      return;
    }
    
    try {
      video.currentTime = time;
      console.log(`🎬 Video seeked to ${time}s`);
    
      // Immediately update current time and frame analysis
      setCurrentTime(time);
      
      // Find and update the current frame
      const currentFrame = frameData.find(frame => 
        Math.abs(frame.timestamp - time * 1000) < 50 // Convert to milliseconds with 50ms tolerance
      );
    
    // Find the corresponding enhanced frame data
    const currentEnhancedFrame = enhancedFrameData.find(frame => 
        Math.abs(frame.timestamp - time * 1000) < 50 // Convert to milliseconds with 50ms tolerance
      );
      setSelectedEnhancedFrame(currentEnhancedFrame || null);
      
      if (currentFrame) {
        // Update real-time metrics immediately
      const aclRisk = (currentFrame.metrics as any)?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 
                        currentFrame.metrics?.acl_risk || 0;
      
        setRealTimeMetrics({
        motionIQ: Math.max(0, 100 - aclRisk * 0.8),
        aclRisk: aclRisk,
        precision: Math.max(0, 100 - aclRisk * 0.6),
        power: Math.max(0, 100 - aclRisk * 0.4),
          timestamp: time
        });
        
        // Force a re-render of the frame analysis
        console.log('🎯 Seeked to frame:', currentFrame.frame_number, 'at time:', time);
      } else {
        console.log('❌ No frame found for time:', time);
      }
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  }

  // Frame-by-frame navigation functions - based on working HTML implementation
  const goToPreviousFrame = () => {
    console.log(`🎬 goToPreviousFrame called. Current index: ${currentFrameIndex}, Total frames: ${frameData.length}`);
    if (currentFrameIndex > 0) {
      const newFrameIndex = currentFrameIndex - 1;
      setCurrentFrameIndex(newFrameIndex);
      console.log(`🎬 Moving to previous frame: ${newFrameIndex}`);
      seekToFrameTime();
    } else {
      console.log('🎬 Already at first frame');
    }
  }

  const goToNextFrame = () => {
    console.log(`🎬 goToNextFrame called. Current index: ${currentFrameIndex}, Total frames: ${frameData.length}`);
    if (currentFrameIndex < frameData.length - 1) {
      const newFrameIndex = currentFrameIndex + 1;
      setCurrentFrameIndex(newFrameIndex);
      console.log(`🎬 Moving to next frame: ${newFrameIndex}`);
      seekToFrameTime();
    } else {
      console.log('🎬 Already at last frame');
    }
  }

  // Seek to frame time - based on working HTML implementation
  const seekToFrameTime = () => {
    const video = videoRef.current;
    const frame = frameData[currentFrameIndex];
    
    // Check if we're using iframe (Cloudflare Stream)
    if (cloudflareStreamUrl && cloudflareStreamUrl.includes('/iframe')) {
      console.log(`🎬 Iframe mode: Frame ${frame?.frame_number || currentFrameIndex + 1} - cannot directly seek iframe`);
      // For iframe videos, we can't directly control playback
      // The frame navigation will update the frame display but won't seek the video
      return;
    }
    
    if (video && frame) {
      // Use video_time if available, otherwise convert timestamp to seconds
      const frameTime = frame.video_time || (frame.timestamp / 1000);
      console.log(`🎬 Seeking to frame ${frame.frame_number} at time ${frameTime}s`);
      video.currentTime = frameTime;
    } else {
      console.log(`🎬 Cannot seek: video=${!!video}, frame=${!!frame}`);
    }
  }

  const goToFrame = (frameIndex: number) => {
    if (frameIndex >= 0 && frameIndex < frameData.length) {
      setCurrentFrameIndex(frameIndex);
      console.log('🎬 Going to frame:', frameIndex + 1);
      seekToFrameTime();
    }
  }

  // Frame timestep progression functions - based on working HTML implementation
  const startFrameTimesteps = () => {
    if (frameStepInterval) {
      clearInterval(frameStepInterval)
    }
    
    const interval = setInterval(() => {
      setCurrentFrameIndex(prevIndex => {
        const nextIndex = prevIndex + 1
        if (nextIndex >= frameData.length) {
          // Reached end, stop progression
          clearInterval(interval)
          setFrameStepInterval(null)
          console.log('🎬 Frame timestep progression reached end')
          return prevIndex
        }
        
        // Seek to next frame using the working method
        seekToFrameTime()
        
        return nextIndex
      })
    }, 500) // 500ms between frames (2 FPS) - same as working HTML
    
    setFrameStepInterval(interval)
    console.log('🎬 Started frame timestep progression')
  }

  const stopFrameTimesteps = () => {
    if (frameStepInterval) {
      clearInterval(frameStepInterval)
      setFrameStepInterval(null)
      console.log('🎬 Stopped frame timestep progression')
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
      return { width: '100%', height: '500px' }
    }

    const containerWidth = 800 // Approximate width of the video container
    const containerHeight = 500 // Fixed height
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
      maxHeight: '500px'
    }
  }


  const toggleFullscreen = () => {
    console.log('Toggling fullscreen, current state:', isFullscreen)
    
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
      const isCurrentlyFullscreen = fullscreenElement === videoRef.current
      
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
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault()
            goToPreviousFrame()
            break
          case 'ArrowRight':
            event.preventDefault()
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
  }, [currentFrameIndex, frameData.length])

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-16 video-player-container">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-semibold">AI Video Analysis</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click video to advance frame-by-frame • Right-click to go back • Use ← → arrow keys • Click play button for frame timesteps • Spacebar to play/pause • F for fullscreen
            </p>
          </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
        </div>

        <div className="p-4 pb-8 space-y-6">
          {/* Video Player with Analytics Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  {cloudflareStreamUrl && cloudflareStreamUrl.includes('/iframe') ? (
                    // Use iframe for Cloudflare Stream videos
                    <div className="relative">
                    <iframe
                      src={cloudflareStreamUrl}
                      style={{ border: 'none', width: '100%', height: '500px' }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen={true}
                      id="stream-player"
                      onLoad={() => {
                          console.log('🎬 Cloudflare Stream iframe loaded successfully');
                        setLoading(false);
                      }}
                      onError={() => {
                          console.error('🎬 Cloudflare Stream iframe load error');
                        setError('Failed to load Cloudflare Stream video');
                        setLoading(false);
                      }}
                    />
                      
                      {/* Frame controls overlay for iframe */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div 
                          className="absolute inset-0 cursor-pointer pointer-events-auto"
                          onClick={goToNextFrame}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            goToPreviousFrame();
                          }}
                          title="Click to advance to next frame, right-click to go to previous frame"
                        >
                          {/* Click overlay indicator */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black bg-opacity-60 rounded-full p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                              <StepBack className="h-5 w-5 text-white" />
                              <span className="text-white text-sm font-medium">Click to advance</span>
                              <StepForward className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Persistent frame number display - below iframe */}
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
                    // Use HTML5 video element for other videos
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
                      className="w-full h-full max-h-[500px] object-contain"
                      src={actualVideoUrl || undefined}
                      preload="auto"
                      playsInline
                      muted
                      crossOrigin="anonymous"
                        controls
                        style={{ background: 'black' }}
                      onLoadedData={() => {
                        console.log('Video loaded successfully');
                          console.log('Video URL:', actualVideoUrl);
                        setLoading(false);
                        // Calculate and set video aspect ratio
                        if (videoRef.current) {
                          const video = videoRef.current;
                          const aspectRatio = video.videoWidth / video.videoHeight;
                          setVideoAspectRatio(aspectRatio);
                          console.log('Video aspect ratio:', aspectRatio, 'Dimensions:', video.videoWidth, 'x', video.videoHeight);
                        }
                      }}
                      onError={(e) => {
                          console.error('🎬 Video element onError triggered:', e);
                          console.error('🎬 Video URL:', actualVideoUrl);
                          // The main error handling is in the useEffect above
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
                      />
                      
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
            
            {/* Risk Timeline Component - Moved further down */}
            <div className="flex justify-center mt-8">
              <RiskTimeline
                frameData={frameData}
                currentTime={currentTime}
                duration={duration}
                onSeek={seekToTime}
              />
            </div>
            </div>

            {/* Real-time Analytics Panels - Right Side */}
            <div className="lg:col-span-1 space-y-4">
              {/* Frame Information Panel */}
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-300">Frame Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Frame:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {currentFrameIndex + 1} / {frameData.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Time:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Frame Time:</span>
                    <span className="text-cyan-400 text-xs font-mono">
                      {frameData.length > 0 ? formatTime((frameData[currentFrameIndex]?.timestamp || 0) / 1000) : '0:00'}
                    </span>
                  </div>
                </CardContent>
              </Card>


              {/* Movement Analysis Panel */}
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-300">Movement Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-300">Tumbling Detection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Confidence:</span>
                    <span className="text-green-400 text-xs font-semibold">High</span>
                  </div>
                </CardContent>
              </Card>

              {/* ACL Risk Analysis Panel */}
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-300">ACL Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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


          {/* Enhanced Statistics Summary - Bottom Panel */}
          {!loading && !error && enhancedFrameData.length > 0 && enhancedStats && (
            <Card className="bg-gray-900 text-white border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-200">Enhanced Statistics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Tumbling Detection Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Tumbling Detection</h4>
                    <div className="space-y-2">
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
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">ACL Risk Analysis</h4>
                    <div className="space-y-2">
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
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Movement Analysis</h4>
                    <div className="space-y-2">
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
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Tumbling Quality</h4>
                    <div className="space-y-2">
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

