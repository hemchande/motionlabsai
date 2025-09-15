"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Camera, Download, Share2, Maximize2, Brain, Target, Shield } from "lucide-react"
import { motion } from "framer-motion"
import MotionIQScore from "./MotionIQScore"
import BiomechanicalMetrics from "./BiomechanicalMetrics"

interface VideoReplayProps {
  selectedAthlete: string
  compact?: boolean
}

export default function VideoReplay({ selectedAthlete, compact = false }: VideoReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [activeAnalysisMode, setActiveAnalysisMode] = useState("motion-iq")
  const videoRef = useRef<HTMLVideoElement>(null)

  // Enhanced analysis data points with Motion IQ insights
  const analysisPoints = [
    {
      time: 15,
      type: "takeoff",
      score: 9.2,
      note: "Perfect launch angle",
      motionIQ: 94,
      biomechanics: {
        angleOfElevation: 82,
        centerOfMass: 1.45,
        kneeAngleL: 172,
        kneeAngleR: 175,
        aclRisk: 8
      }
    },
    {
      time: 32,
      type: "rotation",
      score: 8.8,
      note: "Slight form break",
      motionIQ: 87,
      biomechanics: {
        shoulderAngleL: 168,
        shoulderAngleR: 171,
        elbowVelocityL: 252,
        elbowVelocityR: 248,
        aclRisk: 12
      }
    },
    {
      time: 48,
      type: "landing",
      score: 9.5,
      note: "Excellent landing stability",
      motionIQ: 96,
      biomechanics: {
        landingStability: 97,
        stepSize: "minimal",
        kneeAngleL: 165,
        kneeAngleR: 168,
        aclRisk: 6
      }
    },
    {
      time: 67,
      type: "transition",
      score: 9.0,
      note: "Smooth transition",
      motionIQ: 91,
      biomechanics: {
        artistrySmoothness: 94,
        executionQuality: 92,
        technicalPrecision: 89,
        aclRisk: 10
      }
    },
    {
      time: 85,
      type: "dismount",
      score: 9.3,
      note: "Strong finish",
      motionIQ: 93,
      biomechanics: {
        flightTime: 0.92,
        landingStability: 95,
        tumblingAmplitude: 88,
        aclRisk: 7
      }
    }
  ]

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleTimeChange = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnalysisAtTime = (time: number) => {
    return analysisPoints.find(point => Math.abs(point.time - time) < 2)
  }

  const currentAnalysis = getAnalysisAtTime(currentTime)

  const compactView = (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Camera className="h-5 w-5 text-cyan-400" />
          <span>Video Analysis</span>
          {currentAnalysis && (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              Motion IQ: {currentAnalysis.motionIQ}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-slate-400 text-center">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p>Routine Video Player</p>
              <p className="text-sm">AI-Enhanced Analysis</p>
            </div>
          </div>

          {/* Enhanced Analytics Overlay */}
          {showAnalytics && currentAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-xs border border-slate-800"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">
                  {currentAnalysis.type.toUpperCase()}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3 text-cyan-400" />
                  <span className="text-cyan-400 font-bold text-sm">
                    {currentAnalysis.motionIQ}
                  </span>
                </div>
              </div>
              <p className="text-white text-xs mb-2">{currentAnalysis.note}</p>
              <div className="text-xs text-slate-400">
                Traditional Score: {currentAnalysis.score}/10
              </div>
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
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-slate-400 text-sm min-w-[60px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const fullView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-white">Video Analysis</h2>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            MotionLabs AI Enhanced
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
          <TabsTrigger value="motion-iq" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Motion IQ Score
          </TabsTrigger>
          <TabsTrigger value="biomechanics" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Biomechanical Data
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
                        <p className="text-lg">High-Definition Analysis View</p>
                        <p className="text-sm">AI-Enhanced Motion Tracking</p>
                      </div>
                    </div>

                    {/* Enhanced Analytics Overlay */}
                    {showAnalytics && currentAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-6 left-6 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-w-sm border border-slate-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="text-sm border-cyan-500 text-cyan-400">
                            {currentAnalysis.type.toUpperCase()}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Brain className="h-4 w-4 text-cyan-400" />
                            <span className="text-cyan-400 font-bold text-lg">
                              {currentAnalysis.motionIQ}
                            </span>
                          </div>
                        </div>
                        <p className="text-white text-sm mb-3">{currentAnalysis.note}</p>

                        {/* Quick Biomechanical Insights */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {currentAnalysis.biomechanics.aclRisk && (
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">ACL Risk: {currentAnalysis.biomechanics.aclRisk}%</span>
                            </div>
                          )}
                          {currentAnalysis.biomechanics.landingStability && (
                            <div className="flex items-center space-x-1">
                              <Target className="h-3 w-3 text-blue-400" />
                              <span className="text-blue-400">Stability: {currentAnalysis.biomechanics.landingStability}%</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Time Markers with Motion IQ */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        {analysisPoints.map((point, index) => (
                          <button
                            key={index}
                            className="bg-slate-800/80 px-2 py-1 rounded hover:bg-slate-700 flex flex-col items-center"
                            onClick={() => setCurrentTime(point.time)}
                          >
                            <span>{point.type}</span>
                            <span className="text-cyan-400 font-bold text-xs">IQ: {point.motionIQ}</span>
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
                        step={0.1}
                        className="w-full"
                      />
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
                    Motion IQ Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisPoints.map((point, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        Math.abs(currentTime - point.time) < 2
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                      }`}
                      onClick={() => setCurrentTime(point.time)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {point.type}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Brain className="h-3 w-3 text-cyan-400" />
                          <span className="text-cyan-400 font-bold text-sm">
                            {point.motionIQ}
                          </span>
                        </div>
                      </div>
                      <p className="text-white text-sm mb-1">{point.note}</p>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Traditional: {point.score}/10</span>
                        <span>@ {formatTime(point.time)}</span>
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
                    <span className="text-slate-300">Motion IQ Overlay</span>
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

        <TabsContent value="motion-iq">
          <MotionIQScore selectedAthlete={selectedAthlete} />
        </TabsContent>

        <TabsContent value="biomechanics">
          <BiomechanicalMetrics selectedAthlete={selectedAthlete} />
        </TabsContent>
      </Tabs>
    </div>
  )

  return compact ? compactView : fullView
}
