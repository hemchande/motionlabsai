'use client';

import React, { useEffect, useState } from 'react';
import { useGymnasticsAPI } from '@/hooks/useGymnasticsAPI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedFrameStatistics } from './EnhancedFrameStatistics';
import EnhancedVideoReplay from './EnhancedVideoReplay';
import { 
  Play, 
  Download, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  Video,
  FileVideo,
  TrendingUp,
  Shield,
  Camera,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export function GymnasticsAPIIntegration() {
  const {
    loading,
    error,
    healthStatus,
    videoList,
    processedVideos,
    currentJob,
    aclRiskAnalysis,
    summaryStatistics,
    checkHealth,
    getVideoList,
    getProcessedVideos,
    analyzeVideo,
    analyzeVideoPerFrame,
    pollJobStatus,
    getACLRiskAnalysis,
    getSummaryStatistics,
    downloadVideo,
    downloadPerFrameVideo,
    clearError,
  } = useGymnasticsAPI();

  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [enhancedFrameStats, setEnhancedFrameStats] = useState<any>(null);
  const [selectedVideoForFrameStats, setSelectedVideoForFrameStats] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Initialize data on component mount
    checkHealth();
    getVideoList();
    getProcessedVideos();
    getSummaryStatistics();
  }, [checkHealth, getVideoList, getProcessedVideos, getSummaryStatistics]);

  const handleAnalyzeVideo = async (videoFilename: string) => {
    await analyzeVideo(videoFilename);
  };

  const handleAnalyzeVideoPerFrame = async (videoFilename: string) => {
    const jobId = await analyzeVideoPerFrame(videoFilename);
    if (jobId) {
      setActiveJobId(jobId);
      pollJobStatus(jobId);
    }
  };

  const handleDownloadVideo = async (videoFilename: string) => {
    await downloadVideo(videoFilename);
  };

  const handleDownloadPerFrameVideo = async (videoFilename: string) => {
    await downloadPerFrameVideo(videoFilename);
  };

  const handleGetEnhancedFrameStats = async (videoFilename: string) => {
    try {
      // Use the hook's API methods instead of direct gymnasticsAPI
      const response = await fetch(`http://localhost:5004/getPerFrameStatistics?video_filename=${videoFilename}`);
      if (response.ok) {
        const stats = await response.json();
        setEnhancedFrameStats(stats);
        setSelectedVideoForFrameStats(videoFilename);
      } else {
        console.error('Error getting enhanced frame statistics:', response.statusText);
      }
    } catch (error) {
      console.error('Error getting enhanced frame statistics:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gymnastics Analytics API</h1>
          <p className="text-muted-foreground">Real-time video analysis and ACL risk assessment</p>
        </div>
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <Badge variant={healthStatus?.mediapipe_server === 'running' ? 'default' : 'destructive'}>
            {healthStatus?.mediapipe_server === 'running' ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-2 hover:bg-gray-100"
            title={isCollapsed ? "Expand API section" : "Collapse API section"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main Content - Collapsible */}
      {!isCollapsed ? (
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="acl-risk">ACL Risk</TabsTrigger>
            <TabsTrigger value="frame-stats">Frame Stats</TabsTrigger>
          </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-5 w-5" />
                  <span>Available Videos</span>
                </CardTitle>
                <CardDescription>Raw videos ready for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {videoList.length === 0 ? (
                  <p className="text-muted-foreground">No videos available</p>
                ) : (
                  videoList.map((video, index) => {
                    // Handle both string and object formats
                    const videoName = typeof video === 'string' ? video : video.filename || video.name || `video-${index}`;
                    const videoSize = typeof video === 'object' && video.size_mb ? `${video.size_mb.toFixed(1)} MB` : '';
                    
                    return (
                      <div key={`${videoName}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{videoName}</span>
                          {videoSize && (
                            <p className="text-sm text-muted-foreground">{videoSize}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAnalyzeVideo(videoName)}
                            disabled={loading}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Analyze
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnalyzeVideoPerFrame(videoName)}
                            disabled={loading}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Per-Frame
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Processed Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileVideo className="h-5 w-5" />
                  <span>Processed Videos</span>
                </CardTitle>
                <CardDescription>Videos with analytics overlays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!processedVideos?.processed_videos || processedVideos.processed_videos.length === 0 ? (
                  <p className="text-muted-foreground">No processed videos available</p>
                ) : (
                  processedVideos.processed_videos.map((video) => (
                    <div key={video.processed_filename} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{video.original_filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {video.file_size_mb.toFixed(1)} MB • {video.analysis_type}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadVideo(video.processed_filename)}
                          disabled={loading}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPerFrameVideo(video.processed_filename)}
                          disabled={loading}
                        >
                          <FileVideo className="h-4 w-4 mr-1" />
                          Per-Frame
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGetEnhancedFrameStats(video.processed_filename)}
                          disabled={loading}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Frame Stats
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleGetEnhancedFrameStats(video.processed_filename);
                            // Switch to frame-stats tab
                            const tabsList = document.querySelector('[role="tablist"]');
                            const frameStatsTab = tabsList?.querySelector('[value="frame-stats"]') as HTMLElement;
                            if (frameStatsTab) {
                              frameStatsTab.click();
                            }
                          }}
                          disabled={loading}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Video Replay
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Current Analysis Job</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentJob ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentJob.video_filename}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(currentJob.start_time).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={currentJob.status === 'completed' ? 'default' : currentJob.status === 'failed' ? 'destructive' : 'secondary'}>
                      {currentJob.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {currentJob.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                      {currentJob.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {currentJob.status}
                    </Badge>
                  </div>
                  
                  {currentJob.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{currentJob.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentJob.progress} />
                    </div>
                  )}

                  {currentJob.status === 'completed' && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Total Frames</p>
                        <p className="text-muted-foreground">{currentJob.total_frames}</p>
                      </div>
                      <div>
                        <p className="font-medium">Frames Processed</p>
                        <p className="text-muted-foreground">{currentJob.frames_processed}</p>
                      </div>
                      <div>
                        <p className="font-medium">Overlay Success</p>
                        <p className="text-muted-foreground">{currentJob.overlay_success ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Processing Time</p>
                        <p className="text-muted-foreground">
                          {currentJob.end_time && currentJob.start_time 
                            ? `${Math.round((new Date(currentJob.end_time).getTime() - new Date(currentJob.start_time).getTime()) / 1000)}s`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {currentJob.status === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-red-800">{currentJob.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No active analysis job</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Summary Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryStatistics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summaryStatistics.total_videos || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Videos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(summaryStatistics.total_frames || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Frames</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(summaryStatistics.average_acl_risk || 0).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Avg ACL Risk</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summaryStatistics.risk_distribution?.high || 0}</p>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No statistics available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACL Risk Tab */}
        <TabsContent value="acl-risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>ACL Risk Analysis</span>
              </CardTitle>
              <CardDescription>Select a video to analyze ACL risk factors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <select
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                >
                  <option value="">Select a video...</option>
                  {videoList.map((video, index) => {
                    const videoName = typeof video === 'string' ? video : video.filename || video.name || `video-${index}`;
                    return (
                      <option key={`${videoName}-${index}`} value={videoName}>{videoName}</option>
                    );
                  })}
                </select>
                <Button
                  onClick={() => selectedVideo && getACLRiskAnalysis(selectedVideo)}
                  disabled={!selectedVideo || loading}
                >
                  Analyze Risk
                </Button>
              </div>

              {aclRiskAnalysis && aclRiskAnalysis.risk_factors && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{(aclRiskAnalysis.risk_factors.knee_angle_risk || 0).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Knee Angle Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{(aclRiskAnalysis.risk_factors.knee_valgus_risk || 0).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Knee Valgus Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{(aclRiskAnalysis.risk_factors.landing_mechanics_risk || 0).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Landing Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold">{(aclRiskAnalysis.risk_factors.overall_acl_risk || 0).toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Overall Risk</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Risk Level:</span>
                    <Badge className={getRiskLevelColor(aclRiskAnalysis.risk_factors.risk_level || 'LOW')}>
                      {aclRiskAnalysis.risk_factors.risk_level || 'LOW'}
                    </Badge>
                  </div>

                  {aclRiskAnalysis.recommendations && aclRiskAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {aclRiskAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Frame Statistics Tab */}
        <TabsContent value="frame-stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Enhanced Frame Statistics</span>
              </CardTitle>
              <CardDescription>View detailed frame-by-frame analysis with tumbling detection and ACL risk assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <select
                  value={selectedVideoForFrameStats}
                  onChange={(e) => setSelectedVideoForFrameStats(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                >
                  <option value="">Select a video for frame analysis...</option>
                  {videoList.map((video, index) => {
                    const videoName = typeof video === 'string' ? video : video.filename || video.name || `video-${index}`;
                    return (
                      <option key={`${videoName}-${index}`} value={videoName}>{videoName}</option>
                    );
                  })}
                </select>
                <Button
                  onClick={() => selectedVideoForFrameStats && handleGetEnhancedFrameStats(selectedVideoForFrameStats)}
                  disabled={!selectedVideoForFrameStats || loading}
                >
                  Load Frame Stats
                </Button>
              </div>

              {enhancedFrameStats && enhancedFrameStats.success && enhancedFrameStats.enhanced_analytics && (
                <EnhancedVideoReplay
                  videoFilename={enhancedFrameStats.video_filename}
                  frameData={enhancedFrameStats.frame_data}
                  enhancedStats={enhancedFrameStats.enhanced_statistics}
                  totalFrames={enhancedFrameStats.total_frames}
                  fps={enhancedFrameStats.fps}
                  compact={false}
                />
              )}

              {enhancedFrameStats && !enhancedFrameStats.enhanced_analytics && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-800">
                      This video was processed with standard analytics. Enhanced analytics are not available.
                    </span>
                  </div>
                </div>
              )}

              {!enhancedFrameStats && selectedVideoForFrameStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-blue-800">
                      Click "Load Frame Stats" to view enhanced frame-by-frame analysis.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ChevronRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Click the chevron button to expand the API section</p>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
