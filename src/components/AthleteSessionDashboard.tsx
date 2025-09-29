"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  BarChart3,
  Trophy,
  TrendingUp,
  Calendar,
  Activity,
  Target,
  Award,
  Eye,
  Download,
  Play,
  Clock,
  Star,
  Search,
  Filter,
  FileVideo,
  CheckCircle,
  AlertTriangle,
  Shield,
  Zap,
  Brain,
  Users,
  CalendarDays,
  TrendingDown
} from 'lucide-react';
import InteractiveVideoPlayer from './InteractiveVideoPlayer';
import AutoAnalyzedVideoPlayer from './AutoAnalyzedVideoPlayer';
import { useAuth } from '@/contexts/FirebaseAuthContext';

interface Session {
  id: string;
  sessionId: string;
  videoName: string;
  originalVideoName: string;
  event: string;
  sessionType: string;
  date: string;
  duration: string;
  fileSize: number;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  perFrameStatus: 'pending' | 'processing' | 'completed' | 'failed';
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
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  analyticsFile?: string;
  coachName: string;
  createdAt: string;
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
  recentSessions: Session[];
}

export default function AthleteSessionDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCoach, setSelectedCoach] = useState('all');

  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoData, setVideoData] = useState<{url: string, name: string, analyticsBaseName?: string} | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAthleteSessions();
    }
  }, [user?.id]);

  const fetchAthleteSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions?athleteId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Error fetching athlete sessions:', error);
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const response = await fetch(`/api/sessions/stats?athleteId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSessionStats();
    }
  }, [user?.id]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.videoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.coachName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEvent === 'all' || session.event === selectedEvent;
    const matchesStatus = selectedStatus === 'all' || session.analysisStatus === selectedStatus;
    const matchesCoach = selectedCoach === 'all' || session.coachName === selectedCoach;
    
    return matchesSearch && matchesEvent && matchesStatus && matchesCoach;
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
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIQColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const viewSession = async (session: Session) => {
    try {
      if (session.analysisStatus === 'completed' && session.processedVideoUrl) {
        setVideoData({
          url: session.processedVideoUrl,
          name: session.videoName
        });
        setShowVideoPlayer(true);
      } else {
        alert('Analysis is not completed for this session yet.');
      }
    } catch (error) {
      console.error('Error viewing session:', error);
      alert('Failed to load session video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Sessions</h1>
          <p className="text-muted-foreground">Your training sessions and analysis results</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {sessions.length} total sessions
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
              <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                All time sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Motion IQ</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getIQColor(stats.averageMotionIQ)}`}>
                {stats.averageMotionIQ}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.averageMotionIQ >= 90 ? 'Excellent!' : 
                 stats.averageMotionIQ >= 70 ? 'Good progress' : 'Keep improving'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ACL Risk</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageACLRisk}%</div>
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
              <div className="text-2xl font-bold text-blue-600">{stats.completedAnalyses}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions - stats.completedAnalyses} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Your injury risk levels across all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.riskDistribution.low}</div>
                <div className="text-sm text-muted-foreground">Low Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.riskDistribution.moderate}</div>
                <div className="text-sm text-muted-foreground">Moderate Risk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.riskDistribution.high}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
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

            <div>
              <label className="text-sm font-medium">Coach</label>
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger>
                  <SelectValue placeholder="All coaches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All coaches</SelectItem>
                  {Array.from(new Set(sessions.map(s => s.coachName))).map(coach => (
                    <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions ({filteredSessions.length})</CardTitle>
          <CardDescription>
            Your training sessions with AI analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sessions found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-sm">{session.event}</h4>
                        <p className="text-xs text-muted-foreground">
                          {session.coachName} • {new Date(session.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(session.analysisStatus)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Motion IQ:</span>
                      <span className={`font-medium ${getIQColor(session.motionIQ || 0)}`}>
                        {session.motionIQ || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ACL Risk:</span>
                      <span className="font-medium">{session.aclRisk || 'N/A'}%</span>
                    </div>
                    {session.riskLevel && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <Badge className={getRiskLevelColor(session.riskLevel)}>
                          {session.riskLevel}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {session.analysisStatus === 'completed' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => viewSession(session)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    {session.analysisStatus === 'processing' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <Activity className="h-3 w-3 mr-1 animate-pulse" />
                        Processing...
                      </Button>
                    )}
                    {session.analysisStatus === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {showVideoPlayer && videoData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Session Video</h3>
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
            
            <AutoAnalyzedVideoPlayer
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
      )}
    </div>
  );
}









