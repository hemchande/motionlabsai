"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Clock, User, Calendar, Award, Shield, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { generateVideoThumbnail, thumbnailCache } from "./VideoThumbnailGenerator"

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

interface OptimizedThumbnailVideoReplayProps {
  session: SessionMetadata
  onViewFullVideo?: (session: SessionMetadata) => void
  onViewAnalytics?: (session: SessionMetadata) => void
  compact?: boolean
  autoPlay?: boolean
  showMetadata?: boolean
  replayDuration?: number
  lazyLoad?: boolean
  preloadThumbnail?: boolean
}

export default function OptimizedThumbnailVideoReplay({
  session,
  onViewFullVideo,
  onViewAnalytics,
  compact = false,
  autoPlay = true,
  showMetadata = true,
  replayDuration = 4,
  lazyLoad = true,
  preloadThumbnail = true
}: OptimizedThumbnailVideoReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayCount, setReplayCount] = useState(0)
  const [isInView, setIsInView] = useState(!lazyLoad)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!lazyLoad)

  // Memoized cache key for this video
  const cacheKey = useMemo(() => {
    return `thumbnail_${session.id}_${session.videoName}`
  }, [session.id, session.videoName])

  // Load thumbnail from cache or generate new one
  const loadThumbnail = useCallback(async () => {
    if (!session.processedVideoUrl) return

    // Check cache first
    const cachedThumbnail = thumbnailCache.get(cacheKey)
    if (cachedThumbnail) {
      setThumbnailUrl(cachedThumbnail)
      return
    }

    // Generate new thumbnail
    setIsLoadingThumbnail(true)
    try {
      const thumbnailBlob = await generateVideoThumbnail(
        session.processedVideoUrl,
        2, // Capture at 2 seconds
        { width: 320, height: 180 }
      )

      if (thumbnailBlob) {
        const url = URL.createObjectURL(thumbnailBlob)
        setThumbnailUrl(url)
        thumbnailCache.set(cacheKey, url)
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    } finally {
      setIsLoadingThumbnail(false)
    }
  }, [session.processedVideoUrl, cacheKey])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !containerRef.current) return

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            setShouldLoadVideo(true)
            if (preloadThumbnail) {
              loadThumbnail()
            }
            // Disconnect observer after first intersection
            intersectionObserverRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: '100px', // Start loading 100px before element comes into view
        threshold: 0.1
      }
    )

    intersectionObserverRef.current.observe(containerRef.current)

    return () => {
      intersectionObserverRef.current?.disconnect()
    }
  }, [lazyLoad, preloadThumbnail, loadThumbnail])

  // Load thumbnail when component mounts (if not lazy loading)
  useEffect(() => {
    if (!lazyLoad && preloadThumbnail) {
      loadThumbnail()
    }
  }, [lazyLoad, preloadThumbnail, loadThumbnail])

  // Auto-replay logic
  useEffect(() => {
    if (!videoRef.current || !autoPlay || !shouldLoadVideo) return

    const video = videoRef.current

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      
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
  }, [autoPlay, replayDuration, isReplaying, shouldLoadVideo])

  // Auto-play on hover
  useEffect(() => {
    if (isHovered && autoPlay && videoRef.current && !isPlaying && shouldLoadVideo) {
      videoRef.current.play()
    } else if (!isHovered && videoRef.current && isPlaying) {
      videoRef.current.pause()
    }
  }, [isHovered, autoPlay, isPlaying, shouldLoadVideo])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
        videoRef.current.load()
      }
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current || !shouldLoadVideo) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying, shouldLoadVideo])

  const handleMuteToggle = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleRestart = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
    setIsReplaying(false)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getRiskLevelColor = useCallback((level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'MODERATE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }, [])

  // Show thumbnail placeholder if video is not loaded and thumbnail is available
  const showThumbnailPlaceholder = !videoLoaded && thumbnailUrl && !videoError

  const compactView = (
    <Card 
      ref={containerRef}
      className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          {/* Thumbnail Placeholder */}
          {showThumbnailPlaceholder && (
            <div className="absolute inset-0">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={handlePlayPause}
                >
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {/* Video Element */}
          {shouldLoadVideo && (
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
          )}

          {/* Loading State */}
          {!videoLoaded && !videoError && !showThumbnailPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-slate-400 text-center">
                {isLoadingThumbnail ? (
                  <>
                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                    <p className="text-sm">Loading thumbnail...</p>
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                    <p className="text-sm">Loading...</p>
                  </>
                )}
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
            {(isHovered || !isPlaying) && (videoLoaded || showThumbnailPlaceholder) && (
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
                  {videoLoaded && (
                    <>
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
                    </>
                  )}
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

  return compactView
}


