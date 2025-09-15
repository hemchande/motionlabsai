"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Clock, User, Calendar, Award, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SessionMetadata {
  id: string
  videoName: string
  athlete: string
  event: string
  sessionType: string
  date: string
  duration: string
  motionIQ?: number
  aclRisk?: number
  riskLevel?: 'LOW' | 'MODERATE' | 'HIGH'
  analysisStatus: 'completed' | 'processing' | 'failed' | 'pending'
  hasProcessedVideo?: boolean
  processedVideoUrl?: string
  analyticsFile?: string
}

interface ThumbnailVideoReplayProps {
  session: SessionMetadata
  onViewFullVideo?: (session: SessionMetadata) => void
  onViewAnalytics?: (session: SessionMetadata) => void
  compact?: boolean
  autoPlay?: boolean
  showMetadata?: boolean
  replayDuration?: number // Duration in seconds for auto-replay
}

export default function ThumbnailVideoReplay({
  session,
  onViewFullVideo,
  onViewAnalytics,
  compact = false,
  autoPlay = true,
  showMetadata = true,
  replayDuration = 4
}: ThumbnailVideoReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayCount, setReplayCount] = useState(0)

  // Auto-replay logic
  useEffect(() => {
    if (!videoRef.current || !autoPlay) return

    const video = videoRef.current

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
      // Auto-replay when reaching the replay duration
      if (video.currentTime >= replayDuration && !isReplaying) {
        setIsReplaying(true)
        setReplayCount(prev => prev + 1)
        video.currentTime = 0
        video.play()
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      if (autoPlay && !isReplaying) {
        // Start auto-replay
        setIsReplaying(true)
        setReplayCount(prev => prev + 1)
        video.currentTime = 0
        video.play()
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [autoPlay, replayDuration, isReplaying])

  // Auto-play on hover
  useEffect(() => {
    if (isHovered && autoPlay && videoRef.current && !isPlaying) {
      videoRef.current.play()
    } else if (!isHovered && videoRef.current && isPlaying) {
      videoRef.current.pause()
    }
  }, [isHovered, autoPlay, isPlaying])

  const handlePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleMuteToggle = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleRestart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setIsReplaying(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'MODERATE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const compactView = (
    <Card 
      className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            preload="metadata"
            muted={isMuted}
            playsInline
            loop={false}
            onLoadedMetadata={() => {
              setVideoLoaded(true)
              setDuration(videoRef.current?.duration || 0)
            }}
            onError={() => setVideoError('Failed to load video')}
          >
            <source src={session.processedVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Loading State */}
          {!videoLoaded && !videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-slate-400 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-red-400 text-center">
                <p className="text-sm">{videoError}</p>
              </div>
            </div>
          )}

          {/* Overlay Controls */}
          <AnimatePresence>
            {(isHovered || !isPlaying) && videoLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
              >
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMuteToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRestart}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          {videoLoaded && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
              <div 
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${(currentTime / Math.min(duration, replayDuration)) * 100}%` }}
              />
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            <Badge className={`text-xs ${getStatusColor(session.analysisStatus)}`}>
              {session.analysisStatus}
            </Badge>
            {session.riskLevel && (
              <Badge className={`text-xs ${getRiskLevelColor(session.riskLevel)}`}>
                {session.riskLevel} Risk
              </Badge>
            )}
          </div>

          {/* Motion IQ Badge */}
          {session.motionIQ && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                <Award className="h-3 w-3 mr-1" />
                {session.motionIQ}
              </Badge>
            </div>
          )}

          {/* Replay Counter */}
          {isReplaying && replayCount > 0 && (
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-slate-800/80 text-slate-300 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                {replayCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Session Info */}
        {showMetadata && (
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white text-sm truncate">{session.videoName}</h4>
              <div className="flex items-center space-x-1 text-slate-400 text-xs">
                <Clock className="h-3 w-3" />
                <span>{session.duration}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{session.athlete}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{session.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{session.event}</span>
              {session.aclRisk && (
                <div className="flex items-center space-x-1 text-xs">
                  <Shield className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-400">{session.aclRisk}%</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewFullVideo?.(session)}
                className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs"
              >
                <Maximize2 className="h-3 w-3 mr-1" />
                View Full
              </Button>
              {session.analyticsFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewAnalytics?.(session)}
                  className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs"
                >
                  <Award className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const fullView = (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            preload="metadata"
            muted={isMuted}
            playsInline
            loop={false}
            onLoadedMetadata={() => {
              setVideoLoaded(true)
              setDuration(videoRef.current?.duration || 0)
            }}
            onError={() => setVideoError('Failed to load video')}
          >
            <source src={session.processedVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Enhanced Overlay with Session Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            {/* Top Info Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getStatusColor(session.analysisStatus)}`}>
                  {session.analysisStatus}
                </Badge>
                {session.riskLevel && (
                  <Badge className={`text-xs ${getRiskLevelColor(session.riskLevel)}`}>
                    {session.riskLevel} Risk
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {session.motionIQ && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Motion IQ: {session.motionIQ}
                  </Badge>
                )}
                {session.aclRisk && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    ACL: {session.aclRisk}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{session.videoName}</h3>
                  <p className="text-slate-300 text-sm">{session.athlete} • {session.event}</p>
                </div>
                <div className="text-right text-slate-300 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{session.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{session.duration}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {videoLoaded && (
                <div className="w-full h-1 bg-slate-800 rounded-full mb-2">
                  <div 
                    className="h-full bg-cyan-400 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / Math.min(duration, replayDuration)) * 100}%` }}
                  />
                </div>
              )}

              {/* Controls */}
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMuteToggle}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRestart}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(Math.min(duration, replayDuration))}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {isReplaying && replayCount > 0 && (
                    <Badge className="bg-slate-800/80 text-slate-300 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Replay {replayCount}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewFullVideo?.(session)}
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Maximize2 className="h-4 w-4 mr-1" />
                    Full View
                  </Button>
                  {session.analyticsFile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewAnalytics?.(session)}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return compact ? compactView : fullView
}


