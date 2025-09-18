import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Play, Pause, SkipBack, SkipForward, Clock, BarChart3, Activity, TrendingUp, Maximize, Minimize } from 'lucide-react';
import { EnhancedFrameStatistics } from './EnhancedFrameStatistics';
import { API_BASE_URL } from '@/lib/api';
import { extractVideoBaseName } from '@/lib/utils';

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

interface InteractiveVideoPlayerProps {
  videoUrl?: string;
  videoName?: string;
  analyticsBaseName?: string;
  sessionId?: string;  // New prop for GridFS-based sessions
  onClose: () => void;
}

export default function InteractiveVideoPlayer({ videoUrl, videoName, analyticsBaseName, sessionId, onClose }: InteractiveVideoPlayerProps) {
  console.log('InteractiveVideoPlayer props:', { videoUrl, videoName, analyticsBaseName, sessionId });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Compute the actual video URL to use
  const actualVideoUrl = sessionId 
    ? `${API_BASE_URL}/getVideoFromSession/${sessionId}`
    : videoUrl;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frameData, setFrameData] = useState<FrameData[]>([]);
  const [enhancedFrameData, setEnhancedFrameData] = useState<EnhancedFrameData[]>([]);
  const [enhancedStats, setEnhancedStats] = useState<EnhancedStatistics | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [showStatistics, setShowStatistics] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [useEnhancedStats, setUseEnhancedStats] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Cleanup effect to prevent AbortError when component unmounts
  useEffect(() => {
    return () => {
      const video = videoRef.current
      if (video) {
        // Pause and reset video to prevent AbortError
        video.pause()
        video.currentTime = 0
        video.src = ''
        video.load()
      }
    }
  }, [])

  // Monitor videoUrl changes and set on video element
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      console.log('Setting video URL on element:', videoUrl);
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [videoUrl]);

  // Load frame data from JSON
  useEffect(() => {
    const loadFrameData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Extract the base video name from the filename
        let baseName: string;
        
        // If analyticsBaseName is provided, use it directly (this is the correct base name for analytics)
        if (analyticsBaseName) {
          baseName = analyticsBaseName;
          console.log('Using provided analyticsBaseName:', baseName);
        } else {
          // Fallback to extracting from videoName using utility function
          baseName = extractVideoBaseName(videoName);
          
          // For per-frame analysis videos, we need to remove the api_generated_ prefix
          // because the backend expects just the base name
          if (baseName.startsWith('api_generated_')) {
            baseName = baseName.replace(/^api_generated_/, '');
          }
        }
        
        console.log('Loading frame data for:', baseName);
        console.log('Original videoName:', videoName);
        console.log('Provided analyticsBaseName:', analyticsBaseName);
        console.log('Final baseName:', baseName);
        
        // Determine the analytics URL to use
        const analyticsUrl = sessionId 
          ? `${API_BASE_URL}/getAnalyticsFromSession/${sessionId}`
          : `${API_BASE_URL}/getPerFrameStatistics?video_filename=${baseName}`;
        
        console.log('Analytics URL:', analyticsUrl);
        
        // Try to find the JSON file using the gymnastics API server
        let response = await fetch(analyticsUrl);
        
        // If the first attempt fails, try alternative base name extraction methods
        if (!response.ok) {
          console.log('First attempt failed, trying alternative base names...');
          
          // Try removing more prefixes
          const altBaseName1 = baseName.replace(/^api_generated_/, '');
          if (altBaseName1 !== baseName) {
            console.log('Trying alternative base name 1:', altBaseName1);
            response = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${altBaseName1}`);
          }
          
          // If still fails, try the original videoName without any processing
          if (!response.ok) {
            const originalBaseName = videoName.replace(/\.mp4$/, '').replace(/\s*\([^)]*\)$/, '');
            console.log('Trying original base name:', originalBaseName);
            response = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${originalBaseName}`);
          }
          
          // If still fails, try with the full analytics filename (for per-frame analysis)
          if (!response.ok) {
            console.log('Trying with full analytics filename...');
            // The videoName should contain the full analytics filename without .json
            const fullAnalyticsName = videoName.replace(/\s*\([^)]*\)$/, '');
            console.log('Full analytics name:', fullAnalyticsName);
            response = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${fullAnalyticsName}`);
          }
          
          // If still fails, try with the api_generated prefix (for MayaFX and similar videos)
          if (!response.ok) {
            console.log('Trying with api_generated prefix...');
            const apiGeneratedName = `api_generated_${baseName}`;
            console.log('API generated name:', apiGeneratedName);
            response = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${apiGeneratedName}`);
          }
          
          // If still fails, try with the video filename directly (for cases where analytics filename matches video filename)
          if (!response.ok) {
            console.log('Trying with video filename directly...');
            console.log('Video filename:', videoName);
            response = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${videoName}`);
          }
        }
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON:', contentType);
            setError('Analytics API returned non-JSON response. Please check server configuration.');
            setFrameData([]);
            return;
          }
          
          const data = await response.json();
          console.log('Received data:', data);
          
          if (data.frame_data && Array.isArray(data.frame_data)) {
            // Filter for frames that have actual metrics data
            const framesWithData = data.frame_data.filter((frame: any) => 
              frame.metrics && Object.keys(frame.metrics).length > 0
            );
            setFrameData(framesWithData);
            
            // Convert to enhanced frame data
            const enhancedFrames = convertToEnhancedFrameData(framesWithData);
            setEnhancedFrameData(enhancedFrames);
            
            // Calculate enhanced statistics
            const stats = calculateEnhancedStats(enhancedFrames);
            setEnhancedStats(stats);
            
            console.log(`Loaded ${framesWithData.length} frames with metrics data out of ${data.frame_data.length} total frames`);
            
            if (framesWithData.length === 0) {
              setError('No frame metrics data available for this video');
            }
          } else {
            setFrameData([]);
            setEnhancedFrameData([]);
            setEnhancedStats(null);
            setError('No frame data structure found in analytics');
          }
        } else {
          const errorData = await response.json();
          console.log('API Error:', errorData);
          console.log('No analytics found, creating mock frame data for video playback...');
          
          // Create mock frame data for videos without analytics
          const mockFrameData = createMockFrameData();
          setFrameData(mockFrameData);
          setEnhancedFrameData(convertToEnhancedFrameData(mockFrameData));
          
          // Calculate enhanced statistics from mock data
          const stats = calculateEnhancedStats(convertToEnhancedFrameData(mockFrameData));
          setEnhancedStats(stats);
          
          setError(null); // Clear error since we have mock data
        }
      } catch (err) {
        console.error('Error loading frame data:', err);
        setError('Failed to load frame data. Please check if the API server is running.');
        setFrameData([]);
      } finally {
        setLoading(false);
      }
    };

    loadFrameData();
  }, [videoName]);

  // Log video URL when component mounts
  useEffect(() => {
    console.log('InteractiveVideoPlayer mounted with:', {
      videoUrl,
      videoName,
      videoRef: videoRef.current ? 'exists' : 'null'
    });
    
    // Check if video element exists and has correct source
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('Video element found:', {
        src: video.src,
        currentSrc: video.currentSrc,
        sources: Array.from(video.querySelectorAll('source')).map(s => s.src)
      });
    }
  }, [videoUrl, videoName]);

  // Monitor videoUrl changes
  useEffect(() => {
    console.log('Video URL changed:', videoUrl);
    console.log('Video name:', videoName);
    
    // Reset error state when URL changes
    setVideoError(null);
    setIsVideoLoaded(false);
  }, [videoUrl, videoName]);

  // Check video element after render
  useEffect(() => {
    const checkVideoElement = () => {
      if (videoRef.current) {
        const video = videoRef.current;
        console.log('Video element check:', {
          videoElement: video,
          src: video.src,
          currentSrc: video.currentSrc,
          sources: Array.from(video.querySelectorAll('source')).map(s => ({
            src: s.src,
            type: s.type
          })),
          videoUrl,
          videoName
        });
        
        // Test if the video can load
        console.log('Testing video load...');
        video.load();
      } else {
        console.log('Video ref is null');
      }
    };
    
    // Check immediately
    checkVideoElement();
    
    // Check again after a short delay to ensure DOM is ready
    setTimeout(checkVideoElement, 100);
  }, [videoUrl, videoName]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoError = (e: Event) => {
      console.error('Video error event:', e);
      const video = e.target as HTMLVideoElement;
      
      console.error('Video error details:', {
        error: video?.error,
        errorCode: video?.error?.code,
        errorMessage: video?.error?.message,
        currentSrc: video?.currentSrc,
        networkState: video?.networkState,
        readyState: video?.readyState,
        videoUrl,
        videoName
      });
      
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setVideoError(`Retrying video load... (${retryCount + 1}/3)`);
        // Retry after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load();
          }
        }, 1000);
      } else {
        setVideoError('Failed to load video after 3 attempts');
        setIsVideoLoaded(false);
      }
    };

    const handleVideoEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleVideoPlay = () => {
      setIsPlaying(true);
    };

    const handleVideoPause = () => {
      setIsPlaying(false);
    };

    // Add event listeners
    video.addEventListener('error', handleVideoError);
    video.addEventListener('ended', handleVideoEnded);
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);

    // Cleanup
    return () => {
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('ended', handleVideoEnded);
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
    };
  }, [retryCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (error) {
          console.error('Error pausing video on unmount:', error);
        }
      }
    };
  }, []);

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
        Math.abs(frame.timestamp - video.currentTime) < 0.1
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
          if (currentFrame.landmarks && start < currentFrame.landmarks.length && end < currentFrame.landmarks.length) {
            const startPoint = currentFrame.landmarks[start]
            const endPoint = currentFrame.landmarks[end]
            
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
          
          // Draw ACL risk
          const aclRisk = currentFrame.metrics.acl_risk || 0
          ctx.fillText(`ACL Risk: ${(aclRisk * 100).toFixed(1)}%`, 10, 30)
          
          // Draw knee angles if available
          if (currentFrame.metrics.left_knee_angle) {
            ctx.fillText(`L Knee: ${currentFrame.metrics.left_knee_angle.toFixed(1)}°`, 10, 50)
          }
          if (currentFrame.metrics.right_knee_angle) {
            ctx.fillText(`R Knee: ${currentFrame.metrics.right_knee_angle.toFixed(1)}°`, 10, 70)
          }
        }
      }
    }

    const interval = setInterval(drawSkeleton, 1000 / 30) // 30fps
    return () => clearInterval(interval)
  }, [showSkeleton, showAngles, frameData, currentTime])

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Find the closest frame data with more precise matching
      const currentTime = videoRef.current.currentTime;
      let closestFrame = null;
      let minDifference = Infinity;
      
      for (const frame of frameData) {
        const difference = Math.abs(frame.timestamp - currentTime);
        if (difference < minDifference) {
          minDifference = difference;
          closestFrame = frame;
        }
      }
      
      // Only update if we found a frame within 0.2 seconds
      if (closestFrame && minDifference < 0.2) {
        setSelectedFrame(closestFrame);
      }
    }
  };

  const handleLoadedMetadata = () => {
    console.log('Video metadata loaded');
    if (videoRef.current) {
      console.log('Video duration:', videoRef.current.duration);
      setDuration(videoRef.current.duration);
      setIsVideoLoaded(true);
      setVideoError(null);
    }
  };

  const togglePlay = async () => {
    console.log('Toggle play called, isPlaying:', isPlaying);
    if (!videoRef.current) {
      console.log('No video ref');
      return;
    }
    
    console.log('Video readyState:', videoRef.current.readyState);
    console.log('Video currentSrc:', videoRef.current.currentSrc);
    
    try {
      if (isPlaying) {
        console.log('Pausing video');
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Check if video is ready to play
        if (videoRef.current.readyState >= 2) {
          console.log('Video ready, playing');
          try {
            await videoRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Error playing video:', error);
            // Handle AbortError specifically
            if (error instanceof Error && error.name === 'AbortError') {
              console.log('Video play was aborted (component likely unmounted)');
              return; // Don't set error state for AbortError
            }
            setVideoError('Failed to play video');
          }
        } else {
          console.log('Video not ready, waiting for canplay');
          // Wait for video to be ready
          videoRef.current.addEventListener('canplay', async () => {
            try {
              console.log('Video can play now');
              await videoRef.current!.play();
              setIsPlaying(true);
            } catch (error) {
              console.error('Error playing video:', error);
              // Handle AbortError specifically
              if (error instanceof Error && error.name === 'AbortError') {
                console.log('Video play was aborted (component likely unmounted)');
                return; // Don't set error state for AbortError
              }
              setVideoError('Failed to play video');
            }
          }, { once: true });
        }
      }
    } catch (error) {
      console.error('Error handling play/pause:', error);
      setVideoError('Failed to control video playback');
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRiskLevel = (risk: number) => {
    if (risk < 0.3) return { level: 'LOW', color: 'text-green-600' };
    if (risk < 0.7) return { level: 'MODERATE', color: 'text-yellow-600' };
    return { level: 'HIGH', color: 'text-red-600' };
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen()
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen()
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
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

  // Convert regular frame data to enhanced frame data
  const convertToEnhancedFrameData = (frames: FrameData[]): EnhancedFrameData[] => {
    return frames.map(frame => ({
      frame_number: frame.frame_number,
      timestamp: frame.timestamp,
      tumbling_detected: (frame.metrics?.flight_time || 0) > 0,
      flight_phase: (frame.metrics?.flight_time || 0) > 0 ? 'flight' : 'ground',
      height_from_ground: frame.metrics?.angle_of_elevation ? frame.metrics.angle_of_elevation / 180 : 0,
      elevation_angle: frame.metrics?.angle_of_elevation || 0,
      forward_lean_angle: 0, // Not available in current data
      tumbling_quality: frame.metrics?.acl_risk ? (1 - frame.metrics.acl_risk) * 100 : 50,
      landmark_confidence: 0.8, // Default confidence
      acl_risk_factors: {
        knee_angle_risk: frame.metrics?.acl_risk ? frame.metrics.acl_risk * 100 : 0,
        knee_valgus_risk: frame.metrics?.acl_risk ? frame.metrics.acl_risk * 100 : 0,
        landing_mechanics_risk: frame.metrics?.acl_risk ? frame.metrics.acl_risk * 100 : 0,
        overall_acl_risk: frame.metrics?.acl_risk ? frame.metrics.acl_risk * 100 : 0,
        risk_level: frame.metrics?.acl_risk ? 
          (frame.metrics.acl_risk < 0.3 ? 'LOW' : 
           frame.metrics.acl_risk < 0.7 ? 'MODERATE' : 'HIGH') : 'LOW'
      },
      acl_recommendations: frame.metrics?.acl_risk && frame.metrics.acl_risk > 0.5 ? 
        ['Focus on landing mechanics', 'Reduce knee valgus'] : []
    }));
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-5xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Interactive Video Analysis</h3>
          <div className="flex items-center space-x-2">
            {enhancedFrameData.length > 0 && enhancedStats && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowStatistics(!showStatistics)}
                className="text-xs"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                {showStatistics ? 'Hide Stats' : 'Show Stats'}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Video Player */}
          <div className={showStatistics ? "lg:col-span-3" : "lg:col-span-5"}>
            <div className="relative">
              {/* Debug Info */}
              <div className="mb-2 p-1 bg-gray-100 rounded text-xs">
                <div className="grid grid-cols-2 gap-1">
                  <div>Error: {videoError ? 'Yes' : 'No'}</div>
                  <div>Loaded: {isVideoLoaded ? 'Yes' : 'No'}</div>
                  <div>Ready: {videoRef.current?.readyState || 'N/A'}</div>
                  <div>Network: {videoRef.current?.networkState || 'N/A'}</div>
                </div>
              </div>
              
              {videoError && (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-red-500 text-lg mb-2">⚠️ Video Error</div>
                    <div className="text-gray-600 text-sm mb-4">{videoError}</div>
                    {retryCount >= 3 && (
                      <button
                        onClick={() => {
                          setRetryCount(0);
                          setVideoError(null);
                          if (videoRef.current) {
                            videoRef.current.load();
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {!isVideoLoaded && !videoError && (
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <div className="text-gray-600">Loading video...</div>
                  </div>
                </div>
              )}
              
              <div className="mb-4 p-2 bg-yellow-100 rounded text-sm">
                <div><strong>Video URL:</strong> {videoUrl}</div>
                <div><strong>Video Name:</strong> {videoName}</div>
                <div><strong>Analytics Base:</strong> {analyticsBaseName || 'None'}</div>
                <div><strong>Video Status:</strong> {videoError ? `Error: ${videoError}` : (isVideoLoaded ? 'Loaded' : 'Loading...')}</div>
                <div className="mt-2 space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = videoUrl;
                      link.download = videoName;
                      link.click();
                    }}
                  >
                    Download Video First
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.load();
                        console.log('Video reloaded');
                      }
                    }}
                  >
                    Reload Video
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const newUrl = videoUrl.replace('&t=', '');
                      console.log('Trying URL without timestamp:', newUrl);
                      if (videoRef.current) {
                        videoRef.current.src = newUrl;
                        videoRef.current.load();
                      }
                    }}
                  >
                    Try Without Timestamp
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // Try direct file path loading
                      const videoFilename = videoName;
                      const directPath = `/Users/eishahemchand/meshTest/gymnasticsapp/output_videos/${videoFilename}`;
                      console.log('Trying direct file path:', directPath);
                      
                      if (videoRef.current) {
                        videoRef.current.src = directPath;
                        videoRef.current.load();
                        console.log('Video loaded with direct path');
                      }
                    }}
                  >
                    Try Direct Path
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // Try relative path loading (might work if files are served statically)
                      const relativePath = `../gymnasticsapp/output_videos/${videoName}`;
                      console.log('Trying relative path:', relativePath);
                      
                      if (videoRef.current) {
                        videoRef.current.src = relativePath;
                        videoRef.current.load();
                        console.log('Video loaded with relative path');
                      }
                    }}
                  >
                    Try Relative Path
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      // Test with the exact URL that works in test-direct-video.html
                      const testUrl = gymnasticsAPI.getVideo('api_generated_UgWHozR_LLA.mp4');
                      console.log('Testing with known working URL:', testUrl);
                      
                      if (videoRef.current) {
                        videoRef.current.src = testUrl;
                        videoRef.current.load();
                        console.log('Video loaded with known working URL');
                      }
                    }}
                  >
                    Test Working URL
                  </Button>
                </div>
              </div>
              
              <video
                ref={videoRef}
                className="w-full h-auto rounded-lg"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadStart={() => setIsVideoLoaded(false)}
                onCanPlay={() => setIsVideoLoaded(true)}
                onError={(e) => {
                  console.error('Video error event triggered:', e);
                  console.error('Event target:', e.target);
                  console.error('Event type:', e.type);
                  
                  // Use the ref to get the video element directly
                  const video = videoRef.current;
                  console.error('Video element from ref:', video);
                  console.error('Video error property:', video?.error);
                  console.error('Video currentSrc:', video?.currentSrc);
                  console.error('Video networkState:', video?.networkState);
                  console.error('Video readyState:', video?.readyState);
                  
                  let errorMessage = 'Failed to load video';
                  
                  if (video && video.error) {
                    console.error('Video error object found:', video.error);
                    console.error('Error code:', video.error.code);
                    console.error('Error message:', video.error.message);
                    
                    switch (video.error.code) {
                      case 1:
                        errorMessage = 'Video loading aborted';
                        break;
                      case 2:
                        errorMessage = 'Network error - check CORS';
                        break;
                      case 3:
                        errorMessage = 'Video decoding error';
                        break;
                      case 4:
                        errorMessage = 'Video format not supported';
                        break;
                      default:
                        errorMessage = `Video error code: ${video.error.code}`;
                    }
                  } else {
                    console.error('No video error object found');
                  }
                  
                  console.error('Final error message:', errorMessage);
                  setVideoError(errorMessage);
                }}
                preload="metadata"
                playsInline
                controls
                muted
                crossOrigin="anonymous"
              >
                <source src={actualVideoUrl} type="video/mp4" />
                <source src={actualVideoUrl?.replace('&t=', '')} type="video/mp4" />
                <source src={actualVideoUrl?.split('?')[0] + '?video_filename=' + videoName} type="video/mp4" />
                Your browser does not support the video tag.
                
                {/* Debug: Log the actual source being used */}
                {(() => { console.log('Rendering video with source:', actualVideoUrl); return null; })()}
              </video>

              {/* Skeleton Overlay Canvas */}
              {showSkeleton && (
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  width={640}
                  height={480}
                />
              )}

              {/* Video Controls */}
              <div className="mt-4 flex items-center justify-center space-x-4">
                <Button variant="outline" size="sm" onClick={() => seekToTime(Math.max(0, currentTime - 5))}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => seekToTime(Math.min(duration, currentTime + 5))}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={showSkeleton ? 'bg-green-100 text-green-700' : ''}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  {showSkeleton ? 'Hide Skeleton' : 'Show Skeleton'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAngles(!showAngles)}
                  className={showAngles ? 'bg-blue-100 text-blue-700' : ''}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {showAngles ? 'Hide Angles' : 'Show Angles'}
                </Button>
                <span className="text-sm text-gray-600">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Frame Navigation Controls */}
              {frameData.length > 0 && selectedFrame && (
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const currentIndex = frameData.findIndex(f => f.frame_number === selectedFrame.frame_number);
                      if (currentIndex > 0) {
                        const prevFrame = frameData[currentIndex - 1];
                        seekToTime(prevFrame.timestamp);
                        setSelectedFrame(prevFrame);
                      }
                    }}
                    disabled={frameData.findIndex(f => f.frame_number === selectedFrame.frame_number) <= 0}
                  >
                    ← Prev Frame
                  </Button>
                  <span className="text-xs text-gray-600">
                    Frame {selectedFrame.frame_number + 1} of {frameData.length}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const currentIndex = frameData.findIndex(f => f.frame_number === selectedFrame.frame_number);
                      if (currentIndex < frameData.length - 1) {
                        const nextFrame = frameData[currentIndex + 1];
                        seekToTime(nextFrame.timestamp);
                        setSelectedFrame(nextFrame);
                      }
                    }}
                    disabled={frameData.findIndex(f => f.frame_number === selectedFrame.frame_number) >= frameData.length - 1}
                  >
                    Next Frame →
                  </Button>
                </div>
              )}

              {/* Timeline with Markers */}
              {frameData.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Frame Analysis Timeline
                  </h4>
                  <div className="relative bg-gray-200 rounded-lg h-8">
                    <div 
                      className="absolute top-0 left-0 bg-blue-500 h-full rounded-lg transition-all duration-100"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    {frameData.map((frame, index) => {
                      const aclRisk = frame.metrics?.acl_risk || 0;
                      const riskLevel = getRiskLevel(aclRisk);
                      const markerColor = riskLevel.level === 'LOW' ? 'bg-green-500 hover:bg-green-600' : 
                                         riskLevel.level === 'MODERATE' ? 'bg-yellow-500 hover:bg-yellow-600' : 
                                         'bg-red-500 hover:bg-red-600';
                      
                      return (
                        <button
                          key={index}
                          className={`absolute top-0 w-2 h-full ${markerColor} transition-colors`}
                          style={{ left: `${(frame.timestamp / duration) * 100}%` }}
                          onClick={() => seekToTime(frame.timestamp)}
                          title={`Frame ${frame.frame_number} - ${formatTime(frame.timestamp)} - ACL Risk: ${(aclRisk * 100).toFixed(1)}% (${riskLevel.level})`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click markers to jump to specific frames. <span className="text-green-600 font-medium">Green</span> = Low risk, <span className="text-yellow-600 font-medium">Yellow</span> = Moderate risk, <span className="text-red-600 font-medium">Red</span> = High risk
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Frame Statistics Panel */}
          {showStatistics && (
            <div className="lg:col-span-2">
              {loading ? (
                <Card className="h-[60vh] flex flex-col">
                  <CardContent className="p-3 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-1">Loading...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="h-[60vh] flex flex-col">
                  <CardContent className="p-3 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-red-500">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : enhancedFrameData.length > 0 && enhancedStats ? (
                <div className="h-[60vh] overflow-y-auto">
                  <EnhancedFrameStatistics
                    videoFilename={videoName}
                    frameData={enhancedFrameData}
                    enhancedStats={enhancedStats}
                    totalFrames={enhancedFrameData.length}
                    fps={29.89}
                  />
                </div>
              ) : (
                <Card className="h-[60vh] flex flex-col">
                  <CardContent className="p-3 flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">No enhanced frame data available</p>
                      <p className="text-xs text-gray-400 mt-1">This video has no per-frame analysis data</p>
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-yellow-700">
                          💡 <strong>Tip:</strong> To enable interactive analysis, analyze this video using the "Analyze Per Frame" option in the main dashboard.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
