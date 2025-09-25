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
  Grid3X3,
  List,
  Maximize2,
  Settings,
  RefreshCw,
  Upload,
  Plus,
  ArrowRight
} from 'lucide-react';
import DebugThumbnailVideoReplay from './DebugThumbnailVideoReplay';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import AutoAnalyzedVideoPlayer from './AutoAnalyzedVideoPlayer';
import { gymnasticsAPI, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/FirebaseAuthContext';

interface SessionData {
  id: string;
  videoName: string;
  athlete: string;
  event: string;
  sessionType: string;
  date: string;
  duration: string;
  motionIQ: number;
  aclRisk: number;
  precision: number;
  power: number;
  status: 'completed' | 'processing' | 'failed' | 'pending' | 'uploaded';
  notes?: string;
  highlights?: string[];
  areasForImprovement?: string[];
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  processedVideoFilename?: string;
  analyticsFile?: string;
  analyticsId?: string;
  analyticsUrl?: string;
  sessionId?: string;
  analysisStatus?: "completed" | "processing" | "failed" | "pending";
  perFrameStatus?: "completed" | "processing" | "failed" | "pending";
  analysisProgress?: number;
  perFrameProgress?: number;
  cloudflareStream?: {
    originalStreamId?: string;
    originalStreamUrl?: string;
    analyzedStreamId?: string;
    analyzedStreamUrl?: string;
    uploadSource?: string;
    readyToStream?: boolean;
    thumbnail?: string;
  };
}

interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  avgMotionIQ: number;
  avgACLRisk: number;
  recentActivity: SessionData[];
}

type ViewMode = 'grid' | 'list' | 'timeline';

interface EnhancedSessionDashboardProps {
  onNavigateToUpload?: () => void
}

export default function EnhancedSessionDashboard({ onNavigateToUpload }: EnhancedSessionDashboardProps = {}) {
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
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Video player state
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showAutoAnalyzedPlayer, setShowAutoAnalyzedPlayer] = useState(false);

  // Fetch sessions from frontend API (same as CoachDashboard)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        console.log('🚀 EnhancedSessionDashboard: Fetching sessions from frontend API...');
        const response = await fetch('/api/sessions');
        const data = await response.json();
        console.log('📡 EnhancedSessionDashboard: Raw API response:', data);
        console.log('📊 EnhancedSessionDashboard: Number of sessions received:', data.sessions?.length || 0);
        
        if (data.success && data.sessions) {
          // Use frontend API data directly (already transformed)
          const transformedSessions: SessionData[] = data.sessions.map((session: any) => {
            console.log('🔄 EnhancedSessionDashboard: Using session data:', session.id, session.athleteName, session.status, session.analysisStatus);
            return {
              id: session.id,
              videoName: session.videoName || session.originalVideoName,
              athlete: session.athleteName || 'Unknown Athlete',
              event: session.event || 'Unknown Event',
              sessionType: session.sessionType || 'Analysis',
              date: session.date || new Date().toISOString().split('T')[0],
              duration: session.duration || '0:00',
              motionIQ: session.motionIQ || 0,
              aclRisk: session.aclRisk || 0,
              precision: 0,
              power: 0,
              status: session.status as "completed" | "processing" | "failed" | "pending" | "uploaded",
              notes: session.notes || '',
              hasProcessedVideo: session.hasProcessedVideo,
              processedVideoUrl: session.processedVideoUrl,
              analyticsFile: session.analyticsFile,
              analyticsId: session.analyticsId,
              analyticsUrl: session.analyticsUrl,
              cloudflareStream: session.cloudflareStream,
              sessionId: session.sessionId,
              analysisStatus: session.analysisStatus,
              perFrameStatus: session.perFrameStatus,
              analysisProgress: 0,
              perFrameProgress: 0
            };
          });
          
          setSessions(transformedSessions);
          console.log('✅ EnhancedSessionDashboard: Sessions loaded:', transformedSessions.length, 'sessions');
          
          // Calculate stats
          const totalSessions = transformedSessions.length;
          const completedSessions = transformedSessions.filter(s => s.status === 'completed').length;
          const avgMotionIQ = transformedSessions.length > 0 
            ? Math.round(transformedSessions.reduce((sum, s) => sum + s.motionIQ, 0) / transformedSessions.length)
            : 0;
          const avgACLRisk = transformedSessions.length > 0 
            ? Math.round(transformedSessions.reduce((sum, s) => sum + s.aclRisk, 0) / transformedSessions.length)
            : 0;
          
          setStats({
            totalSessions,
            completedSessions,
            avgMotionIQ,
            avgACLRisk,
            recentActivity: transformedSessions.slice(0, 5)
          });
        } else {
          console.warn('⚠️ EnhancedSessionDashboard: No sessions found in response');
          setSessions([]);
          setStats({
            totalSessions: 0,
            completedSessions: 0,
            avgMotionIQ: 0,
            avgACLRisk: 0,
            recentActivity: []
          });
        }
      } catch (error) {
        console.error('❌ EnhancedSessionDashboard: Error loading sessions:', error);
        setError(`Failed to load session data: ${error instanceof Error ? error.message : String(error)}`);
        setSessions([]);
        setStats({
          totalSessions: 0,
          completedSessions: 0,
          avgMotionIQ: 0,
          avgACLRisk: 0,
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Manual refresh function
  const refreshSessions = async () => {
    try {
      console.log('🔄 Manual refresh of sessions...');
      const response = await fetch('/api/sessions');
      const data = await response.json();
      
      if (data.success && data.sessions) {
        // Use frontend API data directly (already transformed)
        const transformedSessions: SessionData[] = data.sessions.map((session: any) => {
          console.log('🔄 EnhancedSessionDashboard: Using session data:', session.id, session.athleteName, session.status, session.analysisStatus);
          return {
            id: session.id,
            videoName: session.videoName || session.originalVideoName,
            athlete: session.athleteName || 'Unknown Athlete',
            event: session.event || 'Unknown Event',
            sessionType: session.sessionType || 'Analysis',
            date: session.date || new Date().toISOString().split('T')[0],
            duration: session.duration || '0:00',
            motionIQ: session.motionIQ || 0,
            aclRisk: session.aclRisk || 0,
            precision: 0,
            power: 0,
            status: session.status as "completed" | "processing" | "failed" | "pending" | "uploaded",
            notes: session.notes || '',
            hasProcessedVideo: session.hasProcessedVideo,
            processedVideoUrl: session.processedVideoUrl,
            analyticsFile: session.analyticsFile,
            analyticsId: session.analyticsId,
            analyticsUrl: session.analyticsUrl,
            cloudflareStream: session.cloudflareStream,
            sessionId: session.sessionId,
            analysisStatus: session.analysisStatus,
            perFrameStatus: session.perFrameStatus,
            analysisProgress: 0,
            perFrameProgress: 0
          };
        });
        
        setSessions(transformedSessions);
        console.log('✅ Sessions refreshed:', transformedSessions.length, 'sessions');
        
        // Calculate stats
        const totalSessions = transformedSessions.length;
        const completedSessions = transformedSessions.filter(s => s.status === 'completed').length;
        const avgMotionIQ = transformedSessions.length > 0 
          ? Math.round(transformedSessions.reduce((sum, s) => sum + s.motionIQ, 0) / transformedSessions.length)
          : 0;
        const avgACLRisk = transformedSessions.length > 0 
          ? Math.round(transformedSessions.reduce((sum, s) => sum + s.aclRisk, 0) / transformedSessions.length)
          : 0;
        
        setStats({
          totalSessions,
          completedSessions,
          avgMotionIQ,
          avgACLRisk,
          recentActivity: transformedSessions.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    }
  };

  // Dynamic mapping function to find analytics files based on video ID
  const findAnalyticsFileForVideo = (videoName: string): string | undefined => {
    let videoId = videoName
      .replace(/\.mp4$/, '')
      .replace(/^api_generated_/, '')
      .replace(/^analyzed_/, '')
      .replace(/^overlayed_/, '')
      .replace(/^enhanced_replay_/, '')
      .replace(/^acl_risk_overlay_/, '')
      .replace(/^fixed_overlayed_analytics_/, '')
      .replace(/^downloaded_overlayed_/, '')
      .replace(/_\d+$/, '');
    
    const matchingVideo = processedVideos.find(video => {
      const processedFilename = video.processed_filename || '';
      const originalFilename = video.original_filename || '';
      
      return processedFilename === videoName || 
             originalFilename === videoId ||
             processedFilename.includes(videoId) ||
             originalFilename.includes(videoId);
    });
    
    if (matchingVideo && matchingVideo.analytics_file) {
      return matchingVideo.analytics_file;
    }
    
    return undefined;
  };

  // Convert processed videos to session data format
  const convertProcessedVideosToSessions = (): SessionData[] => {
    const sessions = processedVideos.map((video, index) => {
      const baseName = video.original_filename || video.processed_filename?.replace(/\.mp4$/, '');
      const analyticsFile = findAnalyticsFileForVideo(video.processed_filename || '');
      const hasAnalytics = !!analyticsFile;
      
      const videoUrl = `${API_BASE_URL}/getVideo?video_filename=${video.processed_filename}`;
      
      const session = {
        id: `processed-${index}`,
        videoName: video.processed_filename || `${baseName}.mp4`,
        athlete: 'Athlete',
        event: 'Gymnastics',
        sessionType: 'Analysis',
        date: new Date().toISOString().split('T')[0],
        duration: 'N/A',
        fileSize: video.file_size_mb || 0,
        analysisStatus: hasAnalytics ? ('completed' as const) : ('pending' as const),
        perFrameStatus: hasAnalytics ? ('completed' as const) : ('pending' as const),
        motionIQ: 85,
        aclRisk: 20,
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
      
      return session;
    });
    
    return sessions;
  };

  // Mock data for demonstration
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
      processedVideoUrl: `${API_BASE_URL}/getVideo?video_filename=h264_analyzed_overlayed_pdtyUo5UELk_new_1756821489.mp4`,
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
      processedVideoUrl: `${API_BASE_URL}/getVideo?video_filename=h264_api_generated_UgWHozR_LLA.mp4`,
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
      processedVideoUrl: gymnasticsAPI.getVideo('analyzed_MeLfAr3GY6w_1756264690.mp4'),
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
      processedVideoUrl: gymnasticsAPI.getVideo('analyzed_FWSpWksgk60_1756825611.mp4')
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
      processedVideoUrl: gymnasticsAPI.getVideo('api_generated_3-gNgU9Z_jU.mp4'),
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
      processedVideoUrl: gymnasticsAPI.getVideo('api_generated_Yzhpyecs-ws.mp4')
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

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
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
  }, [processedVideos]);

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

  const handleViewFullVideo = (session: SessionData) => {
    if (session.hasProcessedVideo && session.processedVideoUrl) {
      const videoDataObj = {
        url: session.processedVideoUrl,
        name: session.videoName,
        analyticsBaseName: session.analyticsFile?.replace(/\.json$/, '').replace(/^api_generated_/, '')
      };
      
      setVideoData(videoDataObj);
      setShowVideoPlayer(true);
    }
  };

  const handleViewAnalytics = (session: SessionData) => {
    // Implementation for viewing analytics
    console.log('View analytics for session:', session);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Refresh logic here
    setTimeout(() => setLoading(false), 1000);
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
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Session Dashboard</h1>
          <p className="text-muted-foreground">View and manage previous analysis sessions with thumbnail previews</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Calendar className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {stats?.totalSessions || 0} total sessions
          </span>
        </div>
      </div>

      {/* Quick Upload Section */}
      {onNavigateToUpload && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready to analyze more videos?</h3>
                  <p className="text-gray-600">Upload new training footage to get AI-powered insights</p>
                </div>
              </div>
              <Button
                onClick={onNavigateToUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedAnalyses || 0} completed analyses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Motion IQ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgMotionIQ || 0}</div>
              <p className="text-xs text-muted-foreground">
                +2.1 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ACL Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgACLRisk || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.riskDistribution?.low || 0} low risk sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Athletes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.athleteBreakdown || {}).length}</div>
              <p className="text-xs text-muted-foreground">
                Across {Object.keys(stats.eventBreakdown || {}).length} events
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and View Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & View Options</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">View:</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
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

      {/* Sessions Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
              <CardDescription>
                {viewMode === 'grid' ? 'Grid view with thumbnail previews' : 'List view with detailed information'}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshSessions}
              className="ml-border"
              title="Refresh sessions"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSessions.map((session) => (
                <DebugThumbnailVideoReplay
                  key={session.id}
                  session={session}
                  onViewFullVideo={handleViewFullVideo}
                  onViewAnalytics={handleViewAnalytics}
                  compact={true}
                  autoPlay={true}
                  showMetadata={true}
                  replayDuration={4}
                  debug={true}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileVideo className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{session.videoName}</p>
                        <p className="text-sm text-gray-500">
                          {session.athlete} • {session.event} • {session.sessionType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {session.date}
                      </Badge>
                      {session.motionIQ && (
                        <Badge variant="outline">
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
                      {/* Show Start Analysis only if session is not completed and doesn't have processed video */}
                      {session.analysisStatus !== "completed" && session.perFrameStatus !== "completed" && !session.hasProcessedVideo && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled
                          className="ml-border"
                        >
                          <Activity className="h-4 w-4 mr-1 animate-spin" />
                          Start Analysis
                        </Button>
                      )}
                      
                      {/* Show Analyzing button if session is processing */}
                      {(session.analysisStatus === "processing" || session.perFrameStatus === "processing" || session.status === "processing") && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled
                          className="ml-border"
                        >
                          <Activity className="h-4 w-4 mr-1 animate-spin" />
                          Analyzing...
                        </Button>
                      )}
                      
                      {/* Show View Analysis button if session is completed and has processed video */}
                      {(session.analysisStatus === "completed" && session.perFrameStatus === "completed" && session.hasProcessedVideo) && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            console.log('🎬 EnhancedSessionDashboard View Analysis clicked for session:', session.id, session.hasProcessedVideo);
                            setSelectedSession(session);
                            setShowAutoAnalyzedPlayer(true);
                          }}
                          className="ml-green-bg text-black hover:ml-green-hover"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Analysis
                        </Button>
                      )}
                      
                      {/* Fallback buttons for other cases */}
                      {session.analysisStatus === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewFullVideo(session)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          View Video
                        </Button>
                      )}
                      {session.analyticsFile && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAnalytics(session)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Analytics
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
            </div>
          )}

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <FileVideo className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {sessions.length === 0 ? 'No Sessions Yet' : 'No Sessions Found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {sessions.length === 0 
                    ? 'Start by uploading your first video for analysis'
                    : 'Try adjusting your filters to see more sessions'
                  }
                </p>
                {sessions.length === 0 && onNavigateToUpload && (
                  <div className="space-y-3">
                    <Button
                      onClick={onNavigateToUpload}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Your First Video
                    </Button>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <span>Get started with AI-powered analysis</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Video Player */}
      {showVideoPlayer && videoData && (
        <div>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Video Player</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowVideoPlayer(false);
                    setVideoData(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <InteractiveVideoPlayer
                videoUrl={videoData.url}
                videoName={videoData.name}
                analyticsBaseName={videoData.analyticsBaseName}
                onClose={() => {
                  setShowVideoPlayer(false);
                  setVideoData(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Auto Analyzed Video Player */}
      {showAutoAnalyzedPlayer && selectedSession && (
        <div>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Analyzed Video - {selectedSession.athlete}</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAutoAnalyzedPlayer(false);
                    setSelectedSession(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <AutoAnalyzedVideoPlayer
                videoUrl={selectedSession.processedVideoUrl}
                videoName={selectedSession.videoName}
                analyticsBaseName={selectedSession.analyticsFile?.replace('.json', '').replace('api_generated_', '')}
                processedVideoFilename={selectedSession.processedVideoFilename}
                processedVideoUrl={selectedSession.processedVideoUrl}
                sessionId={selectedSession.sessionId}
                analyticsId={selectedSession.analyticsId}
                analyticsUrl={selectedSession.analyticsUrl}
                onClose={() => {
                  setShowAutoAnalyzedPlayer(false);
                  setSelectedSession(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
