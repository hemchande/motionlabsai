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
    // Load session data from backend
    const loadSessions = async () => {
      try {
        setLoading(true);
        
        // Fetch real sessions from backend
        const response = await fetch('http://localhost:5004/getSessions');
        const data = await response.json();
        
        if (data.success && data.sessions) {
          // Filter to only show analyzed videos (completed sessions with analytics)
          const analyzedSessions = data.sessions.filter((session: any) => 
            session.status === 'completed' && 
            session.processed_video_filename && 
            session.analytics_filename
          );
          
          // Convert backend sessions to frontend format
          const realSessions = analyzedSessions.map((session: any, index: number) => ({
            id: session._id || `session-${index}`,
            videoName: session.original_filename || session.video_filename || 'Unknown Video',
            athlete: session.athlete_name || 'Unknown Athlete',
            event: session.event || 'Unknown Event',
        sessionType: 'Analysis',
            date: session.created_at || new Date().toISOString().split('T')[0],
        duration: 'N/A',
            fileSize: 0,
            analysisStatus: 'completed' as const,
            perFrameStatus: 'completed' as const,
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
            notes: `Analyzed session with ${session.analytics_filename ? 'analytics' : 'pending'}`,
        hasProcessedVideo: true,
            processedVideoUrl: `http://localhost:5004/getVideo?video_filename=${session.processed_video_filename}`,
            analyticsFile: session.analytics_filename
          }));
          
          setSessions(realSessions);
          
          // Calculate real statistics
          const realStats = {
            totalSessions: realSessions.length,
            completedAnalyses: realSessions.length,
            averageMotionIQ: realSessions.reduce((sum: number, s: any) => sum + (s.motionIQ || 0), 0) / realSessions.length || 0,
            averageACLRisk: realSessions.reduce((sum: number, s: any) => sum + (s.aclRisk || 0), 0) / realSessions.length || 0,
            riskDistribution: {
              low: realSessions.filter((s: any) => s.riskLevel === 'LOW').length,
              moderate: realSessions.filter((s: any) => s.riskLevel === 'MODERATE').length,
              high: realSessions.filter((s: any) => s.riskLevel === 'HIGH').length
            },
            eventBreakdown: realSessions.reduce((acc: any, s: any) => {
              acc[s.event] = (acc[s.event] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            athleteBreakdown: realSessions.reduce((acc: any, s: any) => {
              acc[s.athlete] = (acc[s.athlete] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
            recentActivity: realSessions.slice(0, 3)
          };
          
          setStats(realStats);
          console.log('📋 Loaded real sessions from backend:', realSessions.length);
        } else {
          console.error('Failed to load sessions from backend:', data);
          setError('Failed to load session data from backend');
        }
      } catch (err) {
        setError('Failed to load session data');
        console.error('Error loading sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []); // Remove processedVideos dependency since we're using real backend data

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
                      ) : session.analysisStatus === "pending" ? (
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                          disabled={true}
                        >
                              <Play className="h-3 w-3 mr-1" />
                          Pending
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
