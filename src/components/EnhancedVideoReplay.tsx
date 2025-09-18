"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Camera, Download, Share2, Brain, Target, Shield, Zap, TrendingUp, AlertTriangle, BarChart3, Eye, Heart } from "lucide-react"
import { API_BASE_URL } from '@/lib/api'
import { motion } from "framer-motion"

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

interface EnhancedVideoReplayProps {
  videoFilename: string;
  frameData: EnhancedFrameData[];
  enhancedStats: any;
  totalFrames: number;
  fps: number;
  compact?: boolean;
}

export default function EnhancedVideoReplay({ 
  videoFilename, 
  frameData, 
  enhancedStats, 
  totalFrames, 
  fps, 
  compact = false 
}: EnhancedVideoReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(totalFrames / fps)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Get current frame data based on timestamp
  const getCurrentFrameData = (time: number) => {
    return frameData.find(frame => Math.abs(frame.timestamp - time) < (1 / fps / 2))
  }

  const currentFrameData = getCurrentFrameData(currentTime)

  // Get frame number from timestamp
  const getFrameNumber = (time: number) => {
    return Math.floor(time * fps)
  }

  const currentFrameNumber = getFrameNumber(currentTime)

  const handlePlayPause = async () => {
    if (!videoRef.current) return
    
    try {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        // Check if video is ready to play
        if (videoRef.current.readyState >= 2) {
          await videoRef.current.play()
          setIsPlaying(true)
        } else {
          // Wait for video to be ready
          videoRef.current.addEventListener('canplay', async () => {
            try {
              await videoRef.current!.play()
              setIsPlaying(true)
            } catch (error) {
              console.error('Error playing video:', error)
              setVideoError('Failed to play video')
            }
          }, { once: true })
        }
      }
    } catch (error) {
      console.error('Error handling play/pause:', error)
      setVideoError('Failed to control video playback')
    }
  }

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'MODERATE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  const getFlightPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ground': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'preparation': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'takeoff': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'flight': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'landing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsVideoLoaded(true)
      setVideoError(null)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = (e: Event) => {
      console.error('Video error:', e)
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1)
        setVideoError(`Retrying video load... (${retryCount + 1}/3)`)
        // Retry after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.load()
          }
        }, 1000)
      } else {
        setVideoError('Failed to load video after 3 attempts')
        setIsVideoLoaded(false)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause()
        } catch (error) {
          console.error('Error pausing video on unmount:', error)
        }
      }
    }
  }, [])

  const compactView = (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Camera className="h-5 w-5 text-cyan-400" />
          <span>Enhanced Video Analysis</span>
          {currentFrameData && (
            <Badge className={getRiskLevelColor(currentFrameData.acl_risk_factors.risk_level)}>
              ACL Risk: {currentFrameData.acl_risk_factors.overall_acl_risk.toFixed(0)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-400 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p className="font-medium">Video Error</p>
                <p className="text-sm mb-4">{videoError}</p>
                {retryCount >= 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRetryCount(0)
                      setVideoError(null)
                      if (videoRef.current) {
                        videoRef.current.load()
                      }
                    }}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          ) : !isVideoLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                <p>Loading video...</p>
                <p className="text-sm">{videoFilename}</p>
              </div>
            </div>
          ) : null}
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            preload="metadata"
            onLoadStart={() => setIsVideoLoaded(false)}
            onCanPlay={() => setIsVideoLoaded(true)}
            playsInline
            muted
          >
            <source src={`${API_BASE_URL}/getVideo?video_filename=${videoFilename}`} type="video/mp4" />
            <source src={`${API_BASE_URL}/downloadEnhancedReplay?video_filename=${videoFilename}`} type="video/mp4" />
            <source src={`${API_BASE_URL}/getVideo?video_filename=${videoFilename}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Video Controls Overlay */}
          {isVideoLoaded && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white text-xs">Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className="bg-black/50 text-white text-xs border border-white/20 rounded px-2 py-1"
                  >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Analytics Overlay */}
          {showAnalytics && currentFrameData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-xs border border-slate-800"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Badge variant="outline" className={`text-xs ${getFlightPhaseColor(currentFrameData.flight_phase)}`}>
                  {currentFrameData.flight_phase.toUpperCase()}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-cyan-400" />
                  <span className="text-cyan-400 font-bold text-sm">
                    {currentFrameData.acl_risk_factors.overall_acl_risk.toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tumbling:</span>
                  <span className={currentFrameData.tumbling_detected ? "text-green-400" : "text-slate-400"}>
                    {currentFrameData.tumbling_detected ? "Detected" : "Not Detected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Height:</span>
                  <span className="text-white">{(currentFrameData.height_from_ground * 100).toFixed(1)}cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevation:</span>
                  <span className="text-white">{currentFrameData.elevation_angle.toFixed(1)}°</span>
                </div>
              </div>

              {currentFrameData.acl_recommendations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="flex items-center space-x-1 mb-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Recommendations</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {currentFrameData.acl_recommendations.slice(0, 2).map((rec, index) => (
                      <li key={index} className="text-xs">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                onValueChange={handleTimeChange}
                max={duration}
                step={1 / fps}
                className="w-full"
              />
            </div>
            <span className="text-slate-400 text-sm min-w-[60px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="text-xs text-slate-400 text-center">
            Frame {currentFrameNumber + 1} of {totalFrames} • {fps.toFixed(1)} FPS
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const fullView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Enhanced Video Analysis</h2>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            AI-Enhanced Frame Analysis
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share Analysis
          </Button>
        </div>
      </div>

      <Tabs defaultValue="video-player" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-900 border-slate-700">
          <TabsTrigger value="video-player" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Video Player
          </TabsTrigger>
          <TabsTrigger value="frame-analysis" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Frame Analysis
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video-player" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-slate-400 text-center">
                        <Camera className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg">{videoFilename}</p>
                        <p className="text-sm">Enhanced Frame-by-Frame Analysis</p>
                      </div>
                    </div>

                    {/* Enhanced Analytics Overlay */}
                    {showAnalytics && currentFrameData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-6 left-6 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-sm border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className={`text-sm ${getFlightPhaseColor(currentFrameData.flight_phase)}`}>
                            {currentFrameData.flight_phase.toUpperCase()}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-cyan-400" />
                            <span className="text-cyan-400 font-bold text-lg">
                              {currentFrameData.acl_risk_factors.overall_acl_risk.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Frame Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3 text-blue-400" />
                            <span className="text-blue-400">
                              {currentFrameData.tumbling_detected ? "Tumbling" : "No Tumbling"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span className="text-green-400">
                              {(currentFrameData.height_from_ground * 100).toFixed(1)}cm
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3 text-purple-400" />
                            <span className="text-purple-400">
                              {currentFrameData.elevation_angle.toFixed(1)}°
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Brain className="h-3 w-3 text-yellow-400" />
                            <span className="text-yellow-400">
                              {currentFrameData.tumbling_quality.toFixed(0)}/100
                            </span>
                          </div>
                        </div>

                        {/* ACL Risk Breakdown */}
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Knee Angle:</span>
                            <span className="text-white">{currentFrameData.acl_risk_factors.knee_angle_risk.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Knee Valgus:</span>
                            <span className="text-white">{currentFrameData.acl_risk_factors.knee_valgus_risk.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Landing:</span>
                            <span className="text-white">{currentFrameData.acl_risk_factors.landing_mechanics_risk.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {currentFrameData.acl_recommendations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <div className="flex items-center space-x-1 mb-2">
                              <AlertTriangle className="h-3 w-3 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-medium">Recommendations</span>
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1">
                              {currentFrameData.acl_recommendations.slice(0, 3).map((rec, index) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Time Markers with Frame Data */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        {frameData.filter((_, index) => index % Math.floor(totalFrames / 8) === 0).map((frame, index) => (
                          <button
                            key={index}
                            className="bg-slate-800/80 px-2 py-1 rounded hover:bg-slate-700 flex flex-col items-center"
                            onClick={() => setCurrentTime(frame.timestamp)}
                          >
                            <span>{frame.flight_phase}</span>
                            <span className="text-cyan-400 font-bold text-xs">
                              {frame.acl_risk_factors.overall_acl_risk.toFixed(0)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Controls */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayPause}
                        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTime(0)}
                        className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center space-x-2 ml-auto">
                        <span className="text-slate-400 text-sm">Speed:</span>
                        {[0.25, 0.5, 1, 1.5, 2].map(speed => (
                          <Button
                            key={speed}
                            variant={playbackSpeed === speed ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSpeedChange(speed)}
                            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-400 text-sm">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <Slider
                        value={[currentTime]}
                        onValueChange={handleTimeChange}
                        max={duration}
                        step={1 / fps}
                        className="w-full"
                      />
                      <div className="text-xs text-slate-400 text-center">
                        Frame {currentFrameNumber + 1} of {totalFrames} • {fps.toFixed(1)} FPS
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Analysis Panel */}
            <div className="space-y-6">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Brain className="h-5 w-5 text-cyan-400 mr-2" />
                    Frame Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {frameData.filter((_, index) => index % Math.floor(totalFrames / 20) === 0).map((frame, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        Math.abs(currentTime - frame.timestamp) < (1 / fps)
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                      }`}
                      onClick={() => setCurrentTime(frame.timestamp)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-xs ${getFlightPhaseColor(frame.flight_phase)}`}>
                          {frame.flight_phase}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-cyan-400" />
                          <span className="text-cyan-400 font-bold text-sm">
                            {frame.acl_risk_factors.overall_acl_risk.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tumbling:</span>
                          <span className={frame.tumbling_detected ? "text-green-400" : "text-slate-400"}>
                            {frame.tumbling_detected ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Height:</span>
                          <span className="text-white">{(frame.height_from_ground * 100).toFixed(1)}cm</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        @ {formatTime(frame.timestamp)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Analysis Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Enhanced Overlay</span>
                    <Button
                      variant={showAnalytics ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      {showAnalytics ? "ON" : "OFF"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="frame-analysis" className="space-y-6">
          {currentFrameData ? (
            <div className="space-y-6">
              {/* Frame Overview Card */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Eye className="h-5 w-5 text-cyan-400 mr-2" />
                    Frame {currentFrameNumber + 1} Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Detailed biomechanical analysis at {formatTime(currentTime)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tumbling Detection */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 rounded-lg bg-slate-800">
                                <Zap className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <CardTitle className="text-white text-sm">Tumbling Detection</CardTitle>
                              </div>
                            </div>
                            <Badge className={`${currentFrameData.tumbling_detected ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 bg-slate-500/20'} bg-slate-800 border-slate-700`}>
                              {currentFrameData.tumbling_detected ? "Detected" : "Not Detected"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <div className="flex items-baseline space-x-2 mb-2">
                              <span className="text-2xl font-bold text-white">
                                {currentFrameData.tumbling_quality.toFixed(1)}
                              </span>
                              <span className="text-slate-400 text-sm">/100</span>
                            </div>
                            <Progress
                              value={currentFrameData.tumbling_quality}
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                              <span>Quality Score</span>
                              <span>{currentFrameData.tumbling_quality >= 80 ? "✓" : "△"}</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex justify-between">
                              <span>Flight Phase:</span>
                              <Badge className={getFlightPhaseColor(currentFrameData.flight_phase)}>
                                {currentFrameData.flight_phase.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Confidence:</span>
                              <span className="text-white">{currentFrameData.landmark_confidence > 0 ? "High" : "Low"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Movement Analysis */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 rounded-lg bg-slate-800">
                                <TrendingUp className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <CardTitle className="text-white text-sm">Movement Analysis</CardTitle>
                              </div>
                            </div>
                            <Badge className="text-cyan-400 bg-cyan-500/20 bg-slate-800 border-slate-700">
                              Active
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold text-cyan-400 mb-1">
                              {(currentFrameData.height_from_ground * 100).toFixed(1)}
                            </div>
                            <div className="text-slate-400 text-sm">cm Height</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-xs text-slate-400">Elevation Angle: {currentFrameData.elevation_angle.toFixed(1)}°</div>
                            <div className="text-xs text-slate-300">
                              <span className="text-cyan-400">Forward Lean:</span> {currentFrameData.forward_lean_angle.toFixed(1)}°
                            </div>
                            {currentFrameData.com_position && (
                              <div className="text-xs text-slate-300">
                                <span className="text-cyan-400">COM:</span> ({currentFrameData.com_position.x.toFixed(2)}, {currentFrameData.com_position.y.toFixed(2)})
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* ACL Risk Analysis */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="p-2 rounded-lg bg-slate-800">
                                <Shield className="h-4 w-4 text-red-400" />
                              </div>
                              <div>
                                <CardTitle className="text-white text-sm">ACL Risk Analysis</CardTitle>
                              </div>
                            </div>
                            <Badge className={getRiskLevelColor(currentFrameData.acl_risk_factors.risk_level)}>
                              {currentFrameData.acl_risk_factors.risk_level}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center mb-4">
                            <div className={`text-3xl font-bold mb-2 ${
                              currentFrameData.acl_risk_factors.risk_level === 'HIGH' ? 'text-red-400' :
                              currentFrameData.acl_risk_factors.risk_level === 'MODERATE' ? 'text-yellow-400' : 'text-emerald-400'
                            }`}>
                              {currentFrameData.acl_risk_factors.overall_acl_risk.toFixed(1)}%
                            </div>
                            <Badge className={`${
                              currentFrameData.acl_risk_factors.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                              currentFrameData.acl_risk_factors.risk_level === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                            } border-0`}>
                              {currentFrameData.acl_risk_factors.risk_level} Risk
                            </Badge>
                          </div>
                          <Progress
                            value={100 - currentFrameData.acl_risk_factors.overall_acl_risk}
                            className="h-2 mb-2"
                          />
                          <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex justify-between">
                              <span>Knee Angle:</span>
                              <span className="text-white">{currentFrameData.acl_risk_factors.knee_angle_risk.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Knee Valgus:</span>
                              <span className="text-white">{currentFrameData.acl_risk_factors.knee_valgus_risk.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Landing:</span>
                              <span className="text-white">{currentFrameData.acl_risk_factors.landing_mechanics_risk.toFixed(1)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* ACL Recommendations */}
                  {currentFrameData.acl_recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentFrameData.acl_recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-lg">
                                <div className="p-1 rounded-full bg-yellow-500/20">
                                  <Heart className="h-3 w-3 text-yellow-400" />
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-slate-400"
            >
              <Brain className="h-12 w-12 mx-auto mb-4" />
              <p>No frame data available for current time</p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Enhanced Statistics Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Comprehensive analysis of the entire video
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enhancedStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Tumbling Detection Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Tumbling Detection</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tumbling Frames:</span>
                        <span className="text-white">{enhancedStats.tumbling_detection?.total_tumbling_frames || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Percentage:</span>
                        <span className="text-white">{(enhancedStats.tumbling_detection?.tumbling_percentage || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Flight Phases:</span>
                        <span className="text-white">
                          {(() => {
                            const phases = enhancedStats.tumbling_detection?.flight_phases || {};
                            return Object.values(phases).reduce((sum: number, val: any) => sum + (val || 0), 0);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACL Risk Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-red-400" />
                      <span>ACL Risk Analysis</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Overall Risk:</span>
                        <span className="text-white">{(enhancedStats.acl_risk_analysis?.average_overall_risk || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">High Risk Frames:</span>
                        <span className="text-white">{enhancedStats.acl_risk_analysis?.high_risk_frames || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Knee Valgus:</span>
                        <span className="text-white">{(enhancedStats.acl_risk_analysis?.average_knee_valgus_risk || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Movement Analysis Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span>Movement Analysis</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Elevation:</span>
                        <span className="text-white">{(enhancedStats.movement_analysis?.average_elevation_angle || 0).toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Elevation:</span>
                        <span className="text-white">{(enhancedStats.movement_analysis?.max_elevation_angle || 0).toFixed(1)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Height:</span>
                        <span className="text-white">{(enhancedStats.movement_analysis?.average_height_from_ground || 0).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tumbling Quality Summary */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-yellow-400" />
                      <span>Tumbling Quality</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Quality:</span>
                        <span className="text-white">{(enhancedStats.tumbling_quality?.average_quality || 0).toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Max Quality:</span>
                        <span className="text-white">{(enhancedStats.tumbling_quality?.max_quality || 0).toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Quality Frames:</span>
                        <span className="text-white">{enhancedStats.tumbling_quality?.quality_frames_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>No enhanced statistics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  return compact ? compactView : fullView
}
