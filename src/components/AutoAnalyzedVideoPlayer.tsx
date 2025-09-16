"use client"

import React, { useState, useRef, useEffect } from 'react'
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
  Minimize
} from 'lucide-react'
import { motion } from 'framer-motion'
import { EnhancedFrameStatistics } from './EnhancedFrameStatistics'

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
  sessionId?: string  // New prop for GridFS-based sessions
  onClose: () => void
  onVideoAnalyzed?: (metrics: VideoMetrics) => void
}

export default function AutoAnalyzedVideoPlayer({ 
  videoUrl, 
  videoName, 
  analyticsBaseName,
  processedVideoFilename,
  sessionId,
  onClose, 
  onVideoAnalyzed 
}: AutoAnalyzedVideoPlayerProps) {
  // Debug logging
  console.log('AutoAnalyzedVideoPlayer props:', {
    videoUrl,
    videoName,
    analyticsBaseName,
    processedVideoFilename
  });

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Compute the actual video URL to use
  const actualVideoUrl = videoUrl;

  // Reset error state when videoUrl changes
  useEffect(() => {
    setError(null);
    setLoading(true);
    console.log('Video URL changed to:', actualVideoUrl);
    
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
  }, [videoUrl]);
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showAngles, setShowAngles] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
  const [showStatistics, setShowStatistics] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Video time update handler
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    
    setCurrentTime(video.currentTime)
    
    // Update real-time metrics based on current frame
    const currentFrame = frameData.find(frame => 
      Math.abs(frame.timestamp - video.currentTime) < 0.1
    )
    
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
      
      const aclRisk = currentFrame.overall_acl_risk || currentFrame.metrics?.acl_risk || 0
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
        
        // For per-frame statistics, use the processed video filename if available
        if (processedVideoFilename) {
          baseName = processedVideoFilename;
          console.log('Using processed video filename for per-frame stats:', baseName);
        } else if (analyticsBaseName) {
          // Fallback to analyticsBaseName (this is the analytics filename, not ideal)
          baseName = analyticsBaseName;
          console.log('Using provided analyticsBaseName (fallback):', baseName);
        } else if (videoName) {
          // Fallback to extracting from videoName
          baseName = videoName
            .replace(/\.mp4$/, '') // Remove .mp4 extension
            .replace(/^overlayed_/, '') // Remove 'overlayed_' prefix
            .replace(/^api_generated_overlayed_/, '') // Remove 'api_generated_overlayed_' prefix
            .replace(/\s*\([^)]*\)$/, ''); // Remove any text in parentheses at the end
          
          // Keep the api_generated_ prefix for analytics files that have it
          // Don't remove it as the analytics files use this prefix
        } else {
          // If no videoName is provided, use a default
          console.warn('No videoName provided, using default baseName');
          baseName = 'default_video';
        }
        
        console.log('Loading frame data for:', baseName);
        
        console.log('Analytics URL:', `http://localhost:5004/getPerFrameStatistics?video_filename=${baseName}`);
        
        // Try to find the JSON file using the gymnastics API server
        let response;
        try {
          // First, get available sessions from the API
          const sessionsResponse = await fetch('http://localhost:5004/getSessions');
          const sessionsData = await sessionsResponse.json();
          
          if (!sessionsData.success || !sessionsData.sessions || sessionsData.sessions.length === 0) {
            throw new Error('No sessions available');
          }
          
          // Find the most recent completed session with analytics
          const completedSessions = sessionsData.sessions.filter((session: any) => 
            session.status === 'completed' && 
            session.processed_video_filename && 
            session.analytics_filename
          );
          
          if (completedSessions.length === 0) {
            throw new Error('No completed sessions with analytics found');
          }
          
          // Sort by creation date (most recent first) and use the latest
          completedSessions.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          const latestSession = completedSessions[0];
          console.log('Using session:', latestSession);
          
          // Load analytics using the session's processed video filename
          response = await fetch(`http://localhost:5004/getPerFrameStatistics?video_filename=${latestSession.processed_video_filename}`);
          console.log('Analytics response status:', response.status, response.statusText);
        } catch (error) {
          console.log('API server not available, using mock data:', error);
          response = null;
        }
        
        if (response && response.ok) {
          const data = await response.json();
          console.log('Received analytics data:', data);
          console.log('Frame data length:', data.frame_data?.length || 0);
          console.log('Enhanced analytics:', data.enhanced_analytics);
          
          if (data.frame_data && Array.isArray(data.frame_data)) {
            // Use all frame data, don't filter too restrictively
            const allFrames = data.frame_data;
            console.log(`Found ${allFrames.length} frames in analytics data`);
            setFrameData(allFrames);
            
            // Convert to enhanced frame data
            const enhancedFrames = convertToEnhancedFrameData(allFrames);
            console.log('Converted enhanced frames:', enhancedFrames.length);
            console.log('First enhanced frame sample:', enhancedFrames[0]);
            setEnhancedFrameData(enhancedFrames);
            
            // Calculate enhanced statistics
            const stats = calculateEnhancedStats(enhancedFrames);
            console.log('Calculated enhanced stats:', stats);
            setEnhancedStats(stats);
            
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
          console.log('No analytics found or API server unavailable, creating mock frame data for video playback...');
          
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
        setError('Failed to load frame data. Using mock data for demonstration.');
        
        // Create mock frame data as fallback
        const mockFrameData = createMockFrameData();
        setFrameData(mockFrameData);
        setEnhancedFrameData(convertToEnhancedFrameData(mockFrameData));
        const stats = calculateEnhancedStats(convertToEnhancedFrameData(mockFrameData));
        setEnhancedStats(stats);
      } finally {
        // Analytics loading complete
      }
    };

    loadFrameData();
  }, [videoName, analyticsBaseName]);

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
    return frames.map(frame => {
      const tumblingMetrics = frame.metrics?.tumbling_metrics || {};
      const aclRiskFactors = tumblingMetrics.acl_risk_factors || {};
      
      return {
        frame_number: frame.frame_number,
        timestamp: frame.timestamp,
        tumbling_detected: tumblingMetrics.tumbling_detected || false,
        flight_phase: tumblingMetrics.flight_phase || 'ground',
        height_from_ground: tumblingMetrics.height_from_ground || 0,
        elevation_angle: tumblingMetrics.elevation_angle || 0,
        forward_lean_angle: tumblingMetrics.forward_lean_angle || 0,
        tumbling_quality: tumblingMetrics.tumbling_quality || 0,
        landmark_confidence: tumblingMetrics.landmark_confidence || 0.8,
        acl_risk_factors: {
          knee_angle_risk: aclRiskFactors.knee_angle_risk || 0,
          knee_valgus_risk: aclRiskFactors.knee_valgus_risk || 0,
          landing_mechanics_risk: aclRiskFactors.landing_mechanics_risk || 0,
          overall_acl_risk: aclRiskFactors.overall_acl_risk || 0,
          risk_level: aclRiskFactors.risk_level || 'LOW'
        },
        acl_recommendations: aclRiskFactors.coaching_cues?.map((cue: any) => cue.cue) || []
      };
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
  }, [frameData, onVideoAnalyzed])

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
          if (start < currentFrame.landmarks.length && end < currentFrame.landmarks.length) {
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
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      try {
        // Ensure video is ready to play
        if (video.readyState >= 2) {
          await video.play()
          setIsPlaying(true)
        } else {
          // Wait for video to be ready
          const handleCanPlay = async () => {
            try {
              await video.play()
              setIsPlaying(true)
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
    if (videoRef.current) {
      videoRef.current.currentTime = time
      // Immediately update current time and frame analysis
      setCurrentTime(time)
      
      // Find and update the current frame
      const currentFrame = frameData.find(frame => 
        Math.abs(frame.timestamp - time) < 0.1
      )
      
      if (currentFrame) {
        // Update real-time metrics immediately
        setRealTimeMetrics({
          motionIQ: currentFrame.metrics?.motion_iq || 0,
          aclRisk: currentFrame.overall_acl_risk || 0,
          precision: currentFrame.metrics?.precision || 0,
          power: currentFrame.metrics?.power || 0,
          timestamp: time
        })
        
        // Force a re-render of the frame analysis
        console.log('Seeked to frame:', currentFrame.frame_number, 'at time:', time)
      } else {
        console.log('No frame found for time:', time)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'bg-green-500'
    if (risk < 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskLevel = (risk: number) => {
    if (risk < 30) return 'LOW'
    if (risk < 70) return 'MODERATE'
    return 'HIGH'
  }

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
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-semibold">AI Video Analysis</h3>
          </div>
                  <div className="flex items-center space-x-2">
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

        <div className="p-4 pb-8 space-y-6">
          {/* Video Player - Full Width */}
          <div className="w-full">
            <div className="relative bg-black rounded-lg overflow-hidden h-[400px] flex items-center justify-center">
              {error ? (
                <div className="text-center text-white p-6">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-semibold mb-2">Video Load Error</h3>
                  <p className="text-sm text-gray-300 mb-4">{error}</p>
                  <p className="text-xs text-gray-400 mb-4">Video URL: {videoUrl}</p>
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
                        window.open(videoUrl, '_blank');
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
                  <video
                    ref={videoRef}
                    className="w-full h-full max-h-[400px] object-contain"
                    src={actualVideoUrl}
                    preload="auto"
                    playsInline
                    muted
                    controls
                    crossOrigin="anonymous"
                onLoadedData={() => {
                  console.log('Video loaded successfully');
                  setLoading(false);
                }}
                onError={(e) => {
                  console.error('Video load error:', e);
                  console.error('Video URL:', videoUrl);
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
                style={{ minHeight: '300px' }}
                />
                  {/* Fullscreen Button Overlay */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
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

              {/* Real-time Frame-by-Frame Metrics Overlay */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-85 rounded-lg p-4 text-white max-w-sm">
                <div className="mb-2">
                  <h4 className="text-xs font-semibold text-gray-300 mb-2">LIVE FRAME ANALYSIS</h4>
                  <div className="text-xs text-gray-400">
                    Frame: {Math.floor(currentTime * 30)} | Time: {formatTime(currentTime)}
                  </div>
                </div>
                
                {selectedFrame ? (
                  <div className="space-y-2 text-xs">
                    {/* Joint Angles */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">L Knee:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.left_knee_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R Knee:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.right_knee_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">L Hip:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.left_hip_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R Hip:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.right_hip_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">L Elbow:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.left_elbow_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R Elbow:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.right_elbow_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">L Shoulder:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.left_shoulder_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">R Shoulder:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.right_shoulder_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Split Angle:</span>
                        <span className="text-cyan-400">{selectedFrame.metrics?.split_angle?.toFixed(0) || 'N/A'}°</span>
                      </div>
                    </div>
                    
                    {/* Movement Metrics */}
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Elevation:</span>
                        <span className="text-yellow-400">{selectedFrame.metrics?.angle_of_elevation?.toFixed(1) || 'N/A'}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Flight Time:</span>
                        <span className="text-yellow-400">{selectedFrame.metrics?.flight_time?.toFixed(2) || 'N/A'}s</span>
                      </div>
                    </div>
                    
                    {/* ACL Risk */}
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">ACL Risk:</span>
                        <span className={`${selectedFrame.metrics?.acl_risk && selectedFrame.metrics.acl_risk > 50 ? 'text-red-400' : 'text-green-400'}`}>
                          {selectedFrame.metrics?.acl_risk?.toFixed(0) || 'N/A'}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    Loading frame data...
                  </div>
                )}
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 rounded-lg p-3">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <Button variant="ghost" size="sm" onClick={() => seekToTime(Math.max(0, currentTime - 5))}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => seekToTime(Math.min(duration, currentTime + 5))}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Risk Timeline */}
                <div className="relative h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {frameData.map((frame, index) => (
                    <button
                      key={index}
                      className={`absolute top-0 w-1 h-full ${getRiskColor(frame.metrics?.acl_risk || 0)} hover:opacity-80 transition-opacity`}
                      style={{ left: `${(frame.timestamp / duration) * 100}%` }}
                      onClick={() => seekToTime(frame.timestamp)}
                      title={`${formatTime(frame.timestamp)} - ${getRiskLevel(frame.metrics?.acl_risk || 0)} Risk (${(frame.metrics?.acl_risk || 0).toFixed(0)}%)`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>Low Risk</span>
                  <span>Moderate Risk</span>
                  <span>High Risk</span>
                </div>
              </div>
            </div>
          </div>


          {/* Enhanced Frame Statistics */}
          {!loading && !error && enhancedFrameData.length > 0 && enhancedStats && (
            <>
              <EnhancedFrameStatistics
                videoFilename={videoName}
                frameData={enhancedFrameData}
                enhancedStats={enhancedStats}
                totalFrames={frameData.length}
                fps={30}
              />
            </>
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
