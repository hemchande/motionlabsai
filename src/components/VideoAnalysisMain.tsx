"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Camera,
  RotateCcw,
  ZoomIn,
  Upload,
  Video
} from "lucide-react"
import { motion } from "framer-motion"

interface UploadedVideo {
  id: string
  name: string
  file: File
  url: string
  athlete: string
  event: string
  session: string
  notes: string
  uploadDate: string
  duration?: string
  size: number
  status: string
  motionIQ?: number
}

interface VideoAnalysisMainProps {
  selectedAthlete: string
  onAthleteChange: (athlete: string) => void
  userRole: "coach" | "athlete"
  uploadedVideos: UploadedVideo[]
  selectedVideo: UploadedVideo | null
  onVideoSelect: (video: UploadedVideo | null) => void
  onNavigateToUpload?: () => void
}

export default function VideoAnalysisMain({
  selectedAthlete,
  onAthleteChange,
  userRole,
  uploadedVideos,
  selectedVideo,
  onVideoSelect,
  onNavigateToUpload
}: VideoAnalysisMainProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadedMetadata = () => setDuration(video.duration)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [selectedVideo])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekToTime = (time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = newVolume / 100
    setVolume(newVolume)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b ml-border ml-nav backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold ml-text-hi">Video Analysis</h1>
            <p className="ml-text-md">AI-powered motion analysis and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Video Selector */}
            {uploadedVideos.length > 0 && (
              <Select
                value={selectedVideo?.id || ""}
                onValueChange={(videoId) => {
                  const video = uploadedVideos.find(v => v.id === videoId)
                  onVideoSelect(video || null)
                }}
              >
                <SelectTrigger className="w-64 ml-hover ml-border ml-text-hi">
                  <SelectValue placeholder="Select uploaded video" />
                </SelectTrigger>
                <SelectContent className="ml-card ml-border">
                  {uploadedVideos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.name} - {video.athlete}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedAthlete} onValueChange={onAthleteChange}>
              <SelectTrigger className="w-48 ml-hover ml-border ml-text-hi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="ml-card ml-border">
                <SelectItem value="athlete-1">Simone Biles</SelectItem>
                <SelectItem value="athlete-2">Katelyn Ohashi</SelectItem>
                <SelectItem value="athlete-3">Nadia Comaneci</SelectItem>
              </SelectContent>
            </Select>

            <Select value="elite" onValueChange={() => {}}>
              <SelectTrigger className="w-32 ml-hover ml-border ml-text-hi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="ml-card ml-border">
                <SelectItem value="elite">Elite</SelectItem>
                <SelectItem value="level-10">Level 10</SelectItem>
                <SelectItem value="level-9">Level 9</SelectItem>
              </SelectContent>
            </Select>

            <Select value="floor" onValueChange={() => {}}>
              <SelectTrigger className="w-32 ml-hover ml-border ml-text-hi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="ml-card ml-border">
                <SelectItem value="floor">Floor</SelectItem>
                <SelectItem value="vault">Vault</SelectItem>
                <SelectItem value="beam">Beam</SelectItem>
                <SelectItem value="bars">Bars</SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="ml-cyan-bg text-black hover:ml-cyan-hover"
              onClick={onNavigateToUpload}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload MP4
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Video Player */}
        <Card className="ml-card ml-border backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              {selectedVideo ? (
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-[400px] object-contain"
                    src={selectedVideo.url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="w-full">
                        <Slider
                          value={[currentTime]}
                          max={duration || 100}
                          step={0.1}
                          onValueChange={([value]) => seekToTime(value)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-white mt-1">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePlayPause}
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => seekToTime(Math.max(0, currentTime - 10))}
                            className="text-white hover:bg-white/20"
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => seekToTime(Math.min(duration, currentTime + 10))}
                            className="text-white hover:bg-white/20"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center space-x-2 ml-4">
                            <Volume2 className="h-4 w-4 text-white" />
                            <Slider
                              value={[volume]}
                              max={100}
                              step={1}
                              onValueChange={([value]) => handleVolumeChange(value)}
                              className="w-20"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Select value={playbackSpeed.toString()} onValueChange={(value) => handleSpeedChange(parseFloat(value))}>
                            <SelectTrigger className="w-20 text-white bg-transparent border-white/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.25">0.25x</SelectItem>
                              <SelectItem value="0.5">0.5x</SelectItem>
                              <SelectItem value="1">1x</SelectItem>
                              <SelectItem value="1.5">1.5x</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-16 w-16 ml-text-lo mx-auto mb-4" />
                    <h3 className="ml-text-hi font-semibold mb-2">No Video Selected</h3>
                    <p className="ml-text-md text-sm mb-4">
                      {uploadedVideos.length > 0
                        ? "Select an uploaded video from the dropdown above"
                        : "Upload a video to begin analysis"
                      }
                    </p>
                    {uploadedVideos.length === 0 && userRole === "coach" && (
                      <Button
                        className="ml-cyan-bg text-black hover:ml-cyan-hover"
                        onClick={onNavigateToUpload}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Video
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Motion IQ */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 ml-cyan-bg rounded-lg">
                  <Camera className="h-5 w-5 text-black" />
                </div>
                <div>
                  <p className="text-sm ml-text-md">Motion IQ</p>
                  <p className="text-2xl font-bold ml-cyan-primary">
                    {selectedVideo?.motionIQ || 94}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ACL Risk */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm ml-text-md">ACL Risk</p>
                  <p className="text-2xl font-bold text-emerald-400">8%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Precision */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ZoomIn className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm ml-text-md">Precision</p>
                  <p className="text-2xl font-bold text-blue-400">91%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Power */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <ZoomIn className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm ml-text-md">Power</p>
                  <p className="text-2xl font-bold text-yellow-400">88%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motion Timeline and Coaching Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Motion IQ Timeline */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="ml-text-hi flex items-center">
                <Camera className="h-5 w-5 mr-2 text-cyan-400" />
                Motion IQ Timeline
              </CardTitle>
              <CardDescription className="ml-text-md">
                AI analysis points throughout the routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { phase: "Takeoff", score: 94, time: "0:15", note: "Perfect launch angle & power generation", traditional: "9.2/10" },
                  { phase: "Mid-Air", score: 87, time: "0:32", note: "Slight form break in rotation", traditional: "8.8/10" },
                  { phase: "Landing", score: 96, time: "0:48", note: "Excellent stability and control", traditional: "9.5/10" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="ml-hover rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className="ml-nav ml-text-hi">{item.phase}</Badge>
                        <span className="text-lg font-bold ml-cyan-primary">{item.score}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm ml-text-md">@ {item.time}</div>
                        <div className="text-xs ml-text-lo">Traditional: {item.traditional}</div>
                      </div>
                    </div>
                    <p className="text-sm ml-text-md">{item.note}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Coaching Insights */}
          <Card className="ml-card ml-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="ml-text-hi flex items-center">
                <ZoomIn className="h-5 w-5 mr-2 text-cyan-400" />
                Coaching Insights
              </CardTitle>
              <CardDescription className="ml-text-md">
                AI-generated improvement recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Excellent Landing Control",
                    type: "strength",
                    description: "Landing stability is consistently above 95%. Great technique minimizing ACL risk."
                  },
                  {
                    title: "Rotation Form Focus",
                    type: "improvement",
                    description: "Mid-air body position could be tighter. Focus on core engagement during rotation."
                  },
                  {
                    title: "Power Generation",
                    type: "strength",
                    description: "Takeoff angle and velocity are optimal. Maintain this explosive power pattern."
                  }
                ].map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="ml-hover rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === "strength"
                          ? "bg-emerald-500/20"
                          : "bg-yellow-500/20"
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          insight.type === "strength"
                            ? "bg-emerald-400"
                            : "bg-yellow-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                          insight.type === "strength"
                            ? "text-emerald-400"
                            : "text-yellow-400"
                        }`}>
                          {insight.title}
                        </h4>
                        <p className="text-sm ml-text-md">{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
