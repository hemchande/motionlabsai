'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Clock,
  User,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Download,
  Eye,
  FileVideo,
  Activity,
  Shield,
  Target,
  Award,
  CalendarDays,
  Users,
  Video,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  X,
  Lock,
  Upload,
  MoreHorizontal
} from 'lucide-react';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import AutoAnalyzedVideoPlayer from './AutoAnalyzedVideoPlayer';
import { gymnasticsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  id: string;
  videoName: string;
  athlete: string;
  event: string;
  sessionType: string;
  date: string;
  duration: string;
  fileSize: number;
  analysisStatus: 'completed' | 'processing' | 'failed' | 'pending';
  perFrameStatus: 'completed' | 'processing' | 'failed' | 'pending';
  motionIQ?: number;
  aclRisk?: number;
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH';
  metrics?: {
    averageElevationAngle: number;
    averageFlightTime: number;
    averageLandingQuality: number;
    totalFrames: number;
    framesProcessed: number;
  };
  notes?: string;
  // New fields for processed videos
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  analyticsFile?: string;
}

interface SessionStats {
  totalSessions: number;
  completedAnalyses: number;
  averageMotionIQ: number;
  averageACLRisk: number;
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
  eventBreakdown: Record<string, number>;
  athleteBreakdown: Record<string, number>;
  recentActivity: SessionData[];
}

interface SessionDashboardProps {
  onNavigateToUpload?: () => void
}

export default function SessionDashboard({ onNavigateToUpload }: SessionDashboardProps = {}) {
  const { userRole } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // State for processed videos from backend
  const [processedVideos, setProcessedVideos] = useState<any[]>([]);
  const [processedVideosLoading, setProcessedVideosLoading] = useState(true);

  // Fetch processed videos from backend
  useEffect(() => {
    const fetchProcessedVideos = async () => {
      try {
        setProcessedVideosLoading(true);
        const response = await gymnasticsAPI.getProcessedVideos();
        if (response.success) {
          setProcessedVideos(response.processed_videos || []);
        }
      } catch (error) {
        console.error('Error fetching processed videos:', error);
      } finally {
        setProcessedVideosLoading(false);
      }
    };

    fetchProcessedVideos();
  }, []);

  // Dynamic mapping function to find analytics files based on video ID
  const findAnalyticsFileForVideo = (videoName: string): string | undefined => {
    // Extract the base video ID from the filename
    let videoId = videoName
      .replace(/\.mp4$/, '') // Remove .mp4 extension
      .replace(/^api_generated_/, '') // Remove api_generated_ prefix
      .replace(/^analyzed_/, '') // Remove analyzed_ prefix
      .replace(/^overlayed_/, '') // Remove overlayed_ prefix
      .replace(/^enhanced_replay_/, '') // Remove enhanced_replay_ prefix
      .replace(/^acl_risk_overlay_/, '') // Remove acl_risk_overlay_ prefix
      .replace(/^fixed_overlayed_analytics_/, '') // Remove fixed_overlayed_analytics_ prefix
      .replace(/^downloaded_overlayed_/, '') // Remove downloaded_overlayed_ prefix
      .replace(/_\d+$/, ''); // Remove timestamp suffix like _1756828395
    
    console.log(`Looking for analytics for video: ${videoName} -> extracted ID: ${videoId}`);
    
    // Use the processed videos data to find matching analytics files
    // This is more reliable than a hardcoded list
    const matchingVideo = processedVideos.find(video => {
      const processedFilename = video.processed_filename || '';
      const originalFilename = video.original_filename || '';
      
      // Check if this video matches our target
      return processedFilename === videoName || 
             originalFilename === videoId ||
             processedFilename.includes(videoId) ||
             originalFilename.includes(videoId);
    });
    
    if (matchingVideo && matchingVideo.analytics_file) {
      console.log(`Found analytics file for ${videoId}: ${matchingVideo.analytics_file}`);
      return matchingVideo.analytics_file;
    }
    
    console.log(`No analytics file found for ${videoId}`);
    return undefined;
  };

  // Convert processed videos to session data format
  const convertProcessedVideosToSessions = (): SessionData[] => {
    console.log('=== convertProcessedVideosToSessions called ===');
    console.log('processedVideos:', processedVideos);
    
    const sessions = processedVideos.map((video, index) => {
      const baseName = video.original_filename || video.processed_filename?.replace(/\.mp4$/, '');
      
      // Use our simple mapping function to find analytics
      const analyticsFile = findAnalyticsFileForVideo(video.processed_filename || '');
      const hasAnalytics = !!analyticsFile;
      
      console.log(`Processing video: ${video.processed_filename}, analytics: ${analyticsFile}`);
      console.log(`Base name: ${baseName}, hasAnalytics: ${hasAnalytics}`);
      
      // Use the new getVideo endpoint for frontend display
      const videoUrl = `http://localhost:5004/getVideo?video_filename=${video.processed_filename}`;
      console.log(`Video URL: ${videoUrl}`);
      
      const session = {
        id: `processed-${index}`,
        videoName: video.processed_filename || `${baseName}.mp4`,
        athlete: 'Athlete', // Default value
        event: 'Gymnastics', // Default value
        sessionType: 'Analysis',
        date: new Date().toISOString().split('T')[0], // Today's date
        duration: 'N/A',
        fileSize: video.file_size_mb || 0,
        analysisStatus: hasAnalytics ? ('completed' as const) : ('pending' as const),
        perFrameStatus: hasAnalytics ? ('completed' as const) : ('pending' as const),
        motionIQ: 85, // Default value
        aclRisk: 20, // Default value
        riskLevel: 'LOW' as const,
        metrics: {
          averageElevationAngle: 0,
          averageFlightTime: 0,
          averageLandingQuality: 0,
          totalFrames: 0,
          framesProcessed: 0
        },
        notes: `Processed video with ${hasAnalytics ? 'analytics' : 'pending'}`,
        hasProcessedVideo: true,
        processedVideoUrl: videoUrl,
        analyticsFile: analyticsFile
      };
      
      console.log(`Created session:`, session);
      return session;
    });
    
    console.log('Final sessions:', sessions);
    return sessions;
  };

  // Mock data for demonstration - using actual distinct videos from output_videos
  const mockSessions: SessionData[] = [
    {
      id: '1',
      videoName: 'pdtyUo5UELk.mp4',
      athlete: 'Simone Biles',
      event: 'Floor Exercise',
      sessionType: 'Competition',
      date: '2025-08-25',
      duration: '2:34',
      fileSize: 207,
      analysisStatus: 'completed',
      perFrameStatus: 'completed',
      motionIQ: 95,
      aclRisk: 12,
      riskLevel: 'LOW',
      metrics: {
        averageElevationAngle: 45.2,
        averageFlightTime: 0.8,
        averageLandingQuality: 92.5,
        totalFrames: 4500,
        framesProcessed: 4500
      },
      notes: 'Excellent execution, minor landing adjustment needed',
      hasProcessedVideo: true,
      processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=h264_analyzed_overlayed_pdtyUo5UELk_new_1756821489.mp4',
      analyticsFile: 'api_generated_pdtyUo5UELk.json'
    },
    {
      id: '2',
      videoName: 'UgWHozR_LLA.mp4',
      athlete: 'Katelyn Ohashi',
      event: 'Balance Beam',
      sessionType: 'Training',
      date: '2025-08-24',
      duration: '1:45',
      fileSize: 45000,
      analysisStatus: 'completed',
      perFrameStatus: 'completed',
      motionIQ: 88,
      aclRisk: 28,
      riskLevel: 'MODERATE',
      metrics: {
        averageElevationAngle: 38.7,
        averageFlightTime: 0.6,
        averageLandingQuality: 85.2,
        totalFrames: 3200,
        framesProcessed: 3200
      },
      notes: 'Good form, focus on landing stability',
      hasProcessedVideo: true,
      processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=h264_api_generated_UgWHozR_LLA.mp4',
      analyticsFile: 'api_generated_UgWHozR_LLA.json'
    },
    {
      id: '3',
      videoName: 'MeLfAr3GY6w.mp4',
      athlete: 'Nadia Comaneci',
      event: 'Uneven Bars',
      sessionType: 'Evaluation',
      date: '2025-08-23',
      duration: '3:12',
      fileSize: 9100,
      analysisStatus: 'completed',
      perFrameStatus: 'completed',
      motionIQ: 92,
      aclRisk: 18,
      riskLevel: 'LOW',
      metrics: {
        averageElevationAngle: 42.1,
        averageFlightTime: 0.9,
        averageLandingQuality: 89.7,
        totalFrames: 5800,
        framesProcessed: 3200
      },
      notes: 'Outstanding technique, minor timing adjustments',
      hasProcessedVideo: true,
              processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=analyzed_MeLfAr3GY6w_1756264690.mp4',
      analyticsFile: 'api_generated_MeLfAr3GY6w.json'
    },
    {
      id: '4',
      videoName: 'FWSpWksgk60.mp4',
      athlete: 'Simone Biles',
      event: 'Vault',
      sessionType: 'Training',
      date: '2025-08-22',
      duration: '1:23',
      fileSize: 35000,
      analysisStatus: 'completed',
      perFrameStatus: 'pending',
      motionIQ: 89,
      aclRisk: 35,
      riskLevel: 'MODERATE',
      metrics: {
        averageElevationAngle: 52.3,
        averageFlightTime: 1.1,
        averageLandingQuality: 78.4,
        totalFrames: 2400,
        framesProcessed: 0
      },
      notes: 'High power, needs landing refinement',
      hasProcessedVideo: true,
      processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=analyzed_FWSpWksgk60_1756825611.mp4'
    },
    {
      id: '5',
      videoName: '3-gNgU9Z_jU.mp4',
      athlete: 'Katelyn Ohashi',
      event: 'Floor Exercise',
      sessionType: 'Competition',
      date: '2025-08-21',
      duration: '2:56',
      fileSize: 27000,
      analysisStatus: 'completed',
      perFrameStatus: 'completed',
      motionIQ: 87,
      aclRisk: 22,
      riskLevel: 'LOW',
      metrics: {
        averageElevationAngle: 41.8,
        averageFlightTime: 0.7,
        averageLandingQuality: 86.9,
        totalFrames: 4800,
        framesProcessed: 4800
      },
      notes: 'Solid performance, room for improvement',
      hasProcessedVideo: true,
      processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=api_generated_3-gNgU9Z_jU.mp4',
      analyticsFile: 'api_generated_3-gNgU9Z_jU.json'
    },
    {
      id: '6',
      videoName: 'Yzhpyecs-ws.mp4',
      athlete: 'Gabby Douglas',
      event: 'All-Around',
      sessionType: 'Training',
      date: '2025-08-20',
      duration: '4:15',
      fileSize: 154000,
      analysisStatus: 'completed',
      perFrameStatus: 'pending',
      motionIQ: 91,
      aclRisk: 19,
      riskLevel: 'LOW',
      metrics: {
        averageElevationAngle: 43.5,
        averageFlightTime: 0.9,
        averageLandingQuality: 88.7,
        totalFrames: 7200,
        framesProcessed: 0
      },
      notes: 'Excellent all-around performance',
      hasProcessedVideo: true,
      processedVideoUrl: 'http://localhost:5004/getVideo?video_filename=api_generated_Yzhpyecs-ws.mp4'
    }
  ];

  const mockStats: SessionStats = {
    totalSessions: 6,
    completedAnalyses: 6,
    averageMotionIQ: 90.3,
    averageACLRisk: 22.3,
    riskDistribution: {
      low: 4,
      moderate: 2,
      high: 0
    },
    eventBreakdown: {
      'Floor Exercise': 2,
      'Balance Beam': 1,
      'Uneven Bars': 1,
      'Vault': 1,
      'All-Around': 1
    },
    athleteBreakdown: {
      'Simone Biles': 2,
      'Katelyn Ohashi': 2,
      'Nadia Comaneci': 1,
      'Gabby Douglas': 1
    },
    recentActivity: mockSessions.slice(0, 3)
  };

  // Helper function to get IQ color based on score
  const getIQColor = (score: number) => {
    if (score >= 90) return 'text-green-300' // High - Very Light Green
    if (score >= 70) return 'text-yellow-500' // Medium - Yellow
    return 'text-red-500' // Low - Red
  }

  // Helper function to get IQ badge color based on score
  const getIQBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-500/30' // High - Green
    if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' // Medium - Yellow
    return 'bg-red-500/20 text-red-400 border-red-500/30' // Low - Red
  }

  useEffect(() => {
    // Load session data
    const loadSessions = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from the API
        // const response = await gymnasticsAPI.getSessionHistory();
        // setSessions(response.sessions);
        // setStats(response.stats);
        
        // Combine mock data with processed videos from backend
        const processedSessions = convertProcessedVideosToSessions();
        const allSessions = [...mockSessions, ...processedSessions];
        setSessions(allSessions);
        setStats(mockStats);
      } catch (err) {
        setError('Failed to load session data');
        console.error('Error loading sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [processedVideos]); // Re-run when processed videos change

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.videoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.athlete.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAthlete = selectedAthlete === 'all' || session.athlete === selectedAthlete;
    const matchesEvent = selectedEvent === 'all' || session.event === selectedEvent;
    const matchesStatus = selectedStatus === 'all' || session.analysisStatus === selectedStatus;
    
    return matchesSearch && matchesAthlete && matchesEvent && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-black';
      case 'MODERATE':
        return 'bg-yellow-100 text-black';
      case 'HIGH':
        return 'bg-red-100 text-black';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoData, setVideoData] = useState<{url: string, name: string, analyticsBaseName?: string} | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);



  const findProcessedVideo = (originalName: string, type: 'standard' | 'perframe') => {
    console.log('Looking for video:', originalName, 'type:', type);
    console.log('Available videos:', processedVideos);
    
    // Remove .mp4 extension for comparison
    const cleanName = originalName.replace('.mp4', '');
    
    // First, try exact match on original_filename
    let matchingVideos = processedVideos.filter(v => {
      return v.original_filename === cleanName && v.file_size_mb > 0.1;
    });
    
    // If no exact match, try partial match
    if (matchingVideos.length === 0) {
      matchingVideos = processedVideos.filter(v => {
        const filename = v.processed_filename || v.original_filename || '';
        return filename.includes(cleanName) && v.file_size_mb > 0.1;
      });
    }
    
    // If still no match, try case-insensitive match
    if (matchingVideos.length === 0) {
      matchingVideos = processedVideos.filter(v => {
        const filename = v.processed_filename || v.original_filename || '';
        return filename.toLowerCase().includes(cleanName.toLowerCase()) && v.file_size_mb > 0.1;
      });
    }
    
    console.log('Matching videos found:', matchingVideos);

    if (type === 'standard') {
      // For standard analysis, prefer api_generated videos, then any other
      const apiGenerated = matchingVideos.find(v => v.analysis_type === 'api_generated');
      if (apiGenerated) return apiGenerated;
      
      // Return the first valid video
      return matchingVideos[0];
    } else {
      // For per-frame analysis, look for enhanced_replay or api_generated
      const enhancedReplay = matchingVideos.find(v => v.analysis_type === 'enhanced_replay');
      if (enhancedReplay) return enhancedReplay;
      
      const apiGenerated = matchingVideos.find(v => v.analysis_type === 'api_generated');
      if (apiGenerated) return apiGenerated;
      
      return null;
    }
  };

  const viewSession = async (session: SessionData) => {
    try {
      if (session.analysisStatus === 'completed') {
        // Get the best available video URL (H.264 if available)
        const bestVideoUrl = await getBestVideoUrl(session.videoName);
        if (bestVideoUrl) {
          const videoUrl = `${bestVideoUrl}&t=${Date.now()}`;
          
          console.log('Loading best available session video:', session.videoName);
          console.log('Best video URL:', videoUrl);
          
          setVideoData({
            url: videoUrl,
            name: session.videoName
          });
          setShowVideoPlayer(true);
        } else {
          alert('No video available for this session.');
        }
      } else {
        alert('Analysis is not completed for this session. Please wait for the analysis to finish.');
      }
    } catch (error) {
      console.error('Error viewing session:', error);
      alert('Failed to load session video');
    }
  };

  const getBestVideoUrl = async (videoFilename: string): Promise<string | null> => {
    try {
      // Get video info to find the best available format
      const response = await fetch(`http://localhost:5004/getVideoInfo?video_filename=${videoFilename}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.video_info.recommended_filename) {
          // Use the recommended filename (H.264 if available)
          return `http://localhost:5004/getVideo?video_filename=${data.video_info.recommended_filename}`;
        }
      }
      // Fallback to original video
      return `http://localhost:5004/getVideo?video_filename=${videoFilename}`;
    } catch (error) {
      console.error('Error getting best video URL:', error);
      // Fallback to original video
      return `http://localhost:5004/getVideo?video_filename=${videoFilename}`;
    }
  };

  const viewProcessedVideo = async (session: SessionData) => {
    try {
      console.log('=== viewProcessedVideo called ===');
      console.log('Session:', session);
      console.log('hasProcessedVideo:', session.hasProcessedVideo);
      console.log('processedVideoUrl:', session.processedVideoUrl);
      console.log('analyticsFile:', session.analyticsFile);
      
      if (session.hasProcessedVideo && session.processedVideoUrl) {
        console.log('Loading processed video for session:', session.videoName);
        console.log('Session analytics file:', session.analyticsFile);
        
        // Get the best available video URL (H.264 if available)
        const bestVideoUrl = await getBestVideoUrl(session.videoName);
        if (bestVideoUrl) {
          const processedVideoUrl = `${bestVideoUrl}&t=${Date.now()}`;
          console.log('Using best video URL:', processedVideoUrl);
          
          // Extract analytics base name if available
          let analyticsBaseName: string | undefined;
          if (session.analyticsFile) {
            const fullVideoName = session.analyticsFile.replace(/\.json$/, '');
            analyticsBaseName = fullVideoName
              .replace(/^api_generated_/, '')
              .replace(/^frame_analysis_/, '')
              .replace(/^per_frame_analysis_/, '')
              .replace(/^motion_analysis_/, '')
              .replace(/^biomechanical_data_/, '')
              .replace(/^gymnastics_metrics_/, '')
              .replace(/^performance_analysis_/, '');
            console.log('Analytics base name:', analyticsBaseName);
          }
          
          // Use the processed video filename for the name
          const videoFilename = bestVideoUrl.split('video_filename=')[1];
          const videoName = videoFilename || session.videoName;
          
          const videoDataObj = {
            url: processedVideoUrl,
            name: videoName,
            analyticsBaseName: analyticsBaseName
          };
          
          console.log('Setting video data:', videoDataObj);
          setVideoData(videoDataObj);
          console.log('Video data set successfully');
          
          console.log('Setting showVideoPlayer to true');
          setShowVideoPlayer(true);
          console.log('showVideoPlayer set to true');
        } else {
          console.log('No video URL available');
          alert('No video available for this session.');
        }
      } else {
        console.log('No processed video available');
        alert('No processed video available for this session.');
      }
    } catch (error) {
      console.error('Error viewing processed video:', error);
      alert('Failed to load processed video');
    }
  };

  const viewAnalytics = async (session: SessionData) => {
    try {
      // Extract the core video ID from the video name
      let baseName = session.videoName
        .replace(/\.mp4$/, '') // Remove .mp4 extension
        .replace(/^api_generated_/, '') // Remove api_generated_ prefix
        .replace(/^analyzed_/, '') // Remove analyzed_ prefix
        .replace(/^overlayed_/, '') // Remove overlayed_ prefix
        .replace(/^enhanced_replay_/, '') // Remove enhanced_replay_ prefix
        .replace(/^acl_risk_overlay_/, '') // Remove acl_risk_overlay_ prefix
        .replace(/^fixed_overlayed_analytics_/, '') // Remove fixed_overlayed_analytics_ prefix
        .replace(/^downloaded_overlayed_/, '') // Remove downloaded_overlayed_ prefix
        .replace(/_\d+$/, ''); // Remove timestamp suffix like _1756828395
      
      console.log('Original video name:', session.videoName);
      console.log('Extracted base name for analytics:', baseName);
      
      const analyticsUrl = `http://localhost:5004/getPerFrameStatistics?video_filename=${baseName}`;
      console.log('Loading analytics:', analyticsUrl);
      
      const response = await fetch(analyticsUrl);
      if (response.ok) {
        const analyticsData = await response.json();
        
        // Create a formatted display of the analytics
        const analyticsText = JSON.stringify(analyticsData, null, 2);
        const blob = new Blob([analyticsText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Open in new window
        window.open(url, '_blank');
      } else {
        console.error('Analytics response not ok:', response.status, response.statusText);
        alert('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error viewing analytics:', error);
      alert('Failed to load analytics data');
    }
  };

  const viewPerFrame = async (session: SessionData) => {
    try {
      if (session.perFrameStatus === 'completed') {
        // For per-frame analysis, we need to fetch the JSON data using the existing API
        // Extract the base name from the analytics file if available
        let baseName = session.videoName;
        if (session.analyticsFile) {
          baseName = session.analyticsFile
            .replace(/^api_generated_/, '')
            .replace(/\.json$/, '');
        }
        
        console.log('Fetching per-frame statistics for:', baseName);
        const jsonData = await gymnasticsAPI.getPerFrameStatistics(baseName);
        
        // Display the JSON data in a modal or new window
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Open in new window or download
        window.open(url, '_blank');
      } else {
        alert('Per-frame analysis is not completed for this video. Please run the per-frame analysis first.');
      }
    } catch (error) {
      console.error('Error viewing per-frame analysis:', error);
      alert('Per-frame analysis JSON data not found. This video has not been processed with per-frame analysis yet. Please run the per-frame analysis first from the Upload & Analysis section.');
    }
  }

  // Test function to debug video URLs
  const testVideoUrl = async (session: SessionData) => {
    try {
      console.log('=== Testing Video URL ===');
      console.log('Session:', session);
      console.log('Video Name:', session.videoName);
      console.log('Analytics File:', session.analyticsFile);
      console.log('Processed Video URL:', session.processedVideoUrl);
      
      if (session.analyticsFile) {
        const baseName = session.analyticsFile
          .replace(/^api_generated_/, '')
          .replace(/\.json$/, '');
        
        console.log('Extracted base name:', baseName);
        
        // Test the per-frame video endpoint
        const videoResponse = await fetch(`http://localhost:5004/getVideo?video_filename=${baseName}`);
        console.log('Video endpoint response:', videoResponse.status, videoResponse.statusText);
        
        // Test the analytics endpoint
        const analyticsResponse = await fetch(`http://localhost:5004/getPerFrameStatistics?video_filename=${baseName}`);
        console.log('Analytics endpoint response:', analyticsResponse.status, analyticsResponse.statusText);
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          console.log('Analytics data preview:', {
            success: analyticsData.success,
            frameCount: analyticsData.frame_data?.length || 0,
            firstFrame: analyticsData.frame_data?.[0] || 'No frames'
          });
        }
        
        // Test with different base name variations
        console.log('=== Testing Base Name Variations ===');
        const variations = [
          baseName,
          baseName.replace(/^api_generated_/, ''),
          baseName.replace(/\.mp4$/, ''),
          session.videoName.replace(/\.mp4$/, '').replace(/\s*\([^)]*\)$/, ''),
          session.videoName.replace(/\.mp4$/, '')
        ];
        
        for (const variation of variations) {
          if (variation !== baseName) {
            console.log(`Testing variation: "${variation}"`);
            const testResponse = await fetch(`http://localhost:5004/getPerFrameStatistics?video_filename=${variation}`);
            console.log(`  Status: ${testResponse.status} ${testResponse.statusText}`);
          }
        }
      }
    } catch (error) {
      console.error('Error testing video URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
          <span className="text-black">{error}</span>
        </div>
      </div>
    );
  }

  // Check if user is a coach
  if (userRole !== 'coach') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h2>
            <p className="text-gray-500 mb-4">Session history is only available to coaches.</p>
            <p className="text-sm text-gray-400">Please contact your coach to view session history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Dashboard</h1>
          <p className="text-muted-foreground">View and manage previous analysis sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          {onNavigateToUpload && (
            <Button
              onClick={onNavigateToUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New Video
            </Button>
          )}
          <Calendar className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {stats?.totalSessions || 0} total sessions
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                +5 from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Motion IQ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getIQColor(stats.averageMotionIQ)}`}>{stats.averageMotionIQ}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ACL Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.averageACLRisk}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.averageACLRisk < 15 ? 'Low risk' : 'Monitor closely'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.completedAnalyses}</div>
              <p className="text-xs text-muted-foreground">
                3 pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Athlete</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger>
                  <SelectValue placeholder="All athletes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All athletes</SelectItem>
                  {stats && Object.keys(stats.athleteBreakdown || {}).map(athlete => (
                    <SelectItem key={athlete} value={athlete}>{athlete}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Event</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {stats && Object.keys(stats.eventBreakdown || {}).map(event => (
                    <SelectItem key={event} value={event}>{event}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card className="ml-card ml-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="ml-text-hi">History</CardTitle>
              <CardDescription className="ml-text-md">
                Latest training sessions with AI analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-6 ml-card rounded-lg border ml-border hover:ml-hover transition-colors w-full"
              >
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 ml-cyan-bg rounded-lg flex items-center justify-center">
                    <Video className="h-3 w-3 text-black" />
                  </div>
                  <div className="flex-1 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold ml-text-hi text-sm">{session.athlete}</h4>
                      <p className="text-xs ml-text-lo -mt-0.5">{session.event} • {session.duration}</p>
                      <p className="text-xs ml-text-lo -mt-0.5">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Button size="sm" variant="ghost" className="ml-text-lo hover:ml-text-hi p-1">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-text-lo hover:ml-text-hi p-1">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Right side vertical stack: IQ -> Status -> Reopen */}
                    <div className="flex flex-col items-end space-y-0.5 ml-2">
                      <span className={`text-xs font-semibold ${getIQColor(session.motionIQ || 0)}`}>IQ: {session.motionIQ}</span>
                      <Badge 
                        className={`text-xs px-1 py-0 ${
                          session.analysisStatus === "completed" 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : session.analysisStatus === "processing"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {session.analysisStatus}
                      </Badge>
                      {session.analysisStatus === "completed" && session.hasProcessedVideo ? (
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                          onClick={() => viewSession(session)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Reopen
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="ml-text-lo hover:ml-text-hi p-1" onClick={() => viewSession(session)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Sessions Table - Commented out for now */}
      {/* 
      <Card>
        <CardHeader>
          <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
          <CardDescription>
            Detailed view of all analysis sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileVideo className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{session.athlete} - {session.event}</p>
                      <p className="text-sm text-gray-500">
                        {session.sessionType} • {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {session.date}
                    </Badge>
                    {session.motionIQ && (
                      <Badge className={`${getIQBadgeColor(session.motionIQ || 0)}`}>
                        <Award className="h-3 w-3 mr-1" />
                        IQ: {session.motionIQ}
                      </Badge>
                    )}
                    {session.hasProcessedVideo && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Video className="h-3 w-3 mr-1" />
                        Processed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-muted-foreground">{session.duration}</p>
                  </div>
                  <div>
                    <p className="font-medium">File Size</p>
                    <p className="text-muted-foreground">{formatFileSize(session.fileSize)}</p>
                  </div>
                  <div>
                    <p className="font-medium">ACL Risk</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{session.aclRisk}%</span>
                      {session.riskLevel && (
                        <Badge className={getRiskLevelColor(session.riskLevel)}>
                          {session.riskLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">Analysis Status</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.analysisStatus)}
                      <span className="capitalize">{session.analysisStatus}</span>
                    </div>
                  </div>
                </div>

                {session.metrics && (
                  <div className="border-t pt-3">
                    <p className="font-medium mb-2">Performance Metrics</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Elevation Angle</p>
                        <p className="font-medium">{session.metrics.averageElevationAngle.toFixed(1)}°</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Flight Time</p>
                        <p className="font-medium">{session.metrics.averageFlightTime.toFixed(1)}s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Landing Quality</p>
                        <p className="font-medium">{session.metrics.averageLandingQuality.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.analysisStatus)}
                      <span className="text-sm">Standard Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(session.perFrameStatus)}
                      <span className="text-sm">Per-Frame Analysis</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                                          <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('=== View Original Button Clicked ===');
                          console.log('Session:', session);
                          viewSession(session);
                        }}
                        disabled={session.analysisStatus !== 'completed'}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        View Original
                      </Button>
                    {session.hasProcessedVideo && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('=== View Processed Button Clicked ===');
                          console.log('Session:', session);
                          viewProcessedVideo(session);
                        }}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        View Processed
                      </Button>
                    )}
                    {session.analyticsFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewAnalytics(session)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Analytics
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewPerFrame(session)}
                      disabled={session.perFrameStatus !== 'completed'}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Per-Frame Data
                    </Button>
                    {session.analyticsFile && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testVideoUrl(session)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Test URL
                      </Button>
                    )}
                  </div>
                </div>

                {session.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">{session.notes}</p>
                  </div>
                )}
              </div>
            ))}

            {filteredSessions.length === 0 && (
              <div className="text-center py-8">
                <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No sessions found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      */}

      {/* Interactive Video Player */}
      {showVideoPlayer && videoData && (
        <div>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Video Player Debug Info</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowVideoPlayer(false);
                    setVideoData(null);
                  }}
                >
                  Close
                </Button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <h4 className="font-medium mb-2">Debug Information:</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Video URL:</strong> {videoData.url}</div>
                  <div><strong>Video Name:</strong> {videoData.name}</div>
                  <div><strong>Original Session:</strong> {JSON.stringify(sessions.find(s => s.videoName === videoData.name || s.processedVideoUrl === videoData.url), null, 2)}</div>
                </div>
              </div>
              
              {(() => {
                const session = sessions.find(s => s.videoName === videoData.name || s.processedVideoUrl === videoData.url);
                const hasProcessedVideo = session?.hasProcessedVideo;
                
                return hasProcessedVideo ? (
                  <AutoAnalyzedVideoPlayer
                    videoUrl={videoData.url}
                    videoName={videoData.name}
                    analyticsBaseName={videoData.analyticsBaseName}
                    onClose={() => {
                      setShowVideoPlayer(false);
                      setVideoData(null);
                    }}
                  />
                ) : (
                  <InteractiveVideoPlayer
                    videoUrl={videoData.url}
                    videoName={videoData.name}
                    analyticsBaseName={videoData.analyticsBaseName}
                    onClose={() => {
                      setShowVideoPlayer(false);
                      setVideoData(null);
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
