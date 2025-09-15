"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Video, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  Brain, 
  Shield, 
  Zap,
  Eye,
  Download,
  Play,
  Clock,
  Star,
  Award,
  Users,
  Activity
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Athlete {
  id: string
  name: string
  age: number
  level: string
  events: string[]
  lastSession: string
  totalSessions: number
  avgMotionIQ: number
  improvement: number
  avatar?: string
}

interface AthleteSession {
  id: string
  date: string
  event: string
  duration: string
  motionIQ: number
  aclRisk: number
  precision: number
  power: number
  status: "completed" | "processing" | "failed"
  videoUrl?: string
  notes?: string
  coachNotes?: string
  highlights?: string[]
  areasForImprovement?: string[]
  hasProcessedVideo?: boolean
  processedVideoUrl?: string
  analyticsFile?: string
}

interface PerformanceMetric {
  event: string
  currentScore: number
  previousScore: number
  improvement: number
  trend: "up" | "down" | "stable"
}

interface AthleteDetailViewProps {
  athlete: Athlete
  onBack: () => void
  onViewVideos: () => void
}

export default function AthleteDetailView({ athlete, onBack, onViewVideos }: AthleteDetailViewProps) {
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d")

  // Mock data - in a real app, this would come from an API
  const [sessions, setSessions] = useState<AthleteSession[]>([
    {
      id: "1",
      date: "2024-01-15",
      event: "Vault",
      duration: "2:34",
      motionIQ: 94,
      aclRisk: 8,
      precision: 91,
      power: 88,
      status: "completed",
      notes: "Great form on entry, slight adjustment needed on landing",
      coachNotes: "Excellent run and block. Focus on keeping chest up on landing.",
      highlights: ["Strong run", "Good block position", "Clean entry"],
      areasForImprovement: ["Landing position", "Chest up on landing"],
      hasProcessedVideo: true,
      processedVideoUrl: "http://localhost:5004/downloadVideo?video_filename=h264_api_generated_overlayed_pdtyUo5UELk_new.mp4",
      analyticsFile: "api_generated_pdtyUo5UELk.json"
    },
    {
      id: "2",
      date: "2024-01-12",
      event: "Bars",
      duration: "3:15",
      motionIQ: 87,
      aclRisk: 12,
      precision: 85,
      power: 82,
      status: "completed",
      notes: "Improved handstand position, work on release timing",
      coachNotes: "Great improvement on handstand. Continue working on release timing and body position.",
      highlights: ["Better handstand", "Improved release timing"],
      areasForImprovement: ["Release timing", "Body position"],
      hasProcessedVideo: true,
      processedVideoUrl: "http://localhost:5004/downloadVideo?video_filename=h264_api_generated_UgWHozR_LLA.mp4",
      analyticsFile: "UgWHozR_LLA_analytics.json"
    },
    {
      id: "3",
      date: "2024-01-10",
      event: "Floor",
      duration: "2:45",
      motionIQ: 89,
      aclRisk: 15,
      precision: 87,
      power: 85,
      status: "completed",
      notes: "Good tumbling, needs work on dance elements",
      coachNotes: "Strong tumbling passes. Focus on dance elements and presentation.",
      highlights: ["Strong tumbling", "Good power"],
      areasForImprovement: ["Dance elements", "Presentation"],
      hasProcessedVideo: true,
      processedVideoUrl: "http://localhost:5004/downloadVideo?video_filename=h264_analyzed_floor_routine.mp4",
      analyticsFile: "floor_routine_analytics.json"
    }
  ])

  const performanceMetrics: PerformanceMetric[] = [
    {
      event: "Vault",
      currentScore: 94,
      previousScore: 89,
      improvement: 5,
      trend: "up"
    },
    {
      event: "Bars",
      currentScore: 87,
      previousScore: 82,
      improvement: 5,
      trend: "up"
    },
    {
      event: "Beam",
      currentScore: 91,
      previousScore: 88,
      improvement: 3,
      trend: "up"
    },
    {
      event: "Floor",
      currentScore: 89,
      previousScore: 85,
      improvement: 4,
      trend: "up"
    }
  ]

  const filteredSessions = sessions.filter(session =>
    selectedEvent === "all" || session.event === selectedEvent
  )

  const stats = {
    totalSessions: sessions.length,
    avgMotionIQ: Math.round(sessions.reduce((sum, s) => sum + s.motionIQ, 0) / sessions.length),
    avgACLRisk: Math.round(sessions.reduce((sum, s) => sum + s.aclRisk, 0) / sessions.length),
    avgPrecision: Math.round(sessions.reduce((sum, s) => sum + s.precision, 0) / sessions.length),
    avgPower: Math.round(sessions.reduce((sum, s) => sum + s.power, 0) / sessions.length),
    bestEvent: performanceMetrics.reduce((best, current) => 
      current.currentScore > best.currentScore ? current : best
    ).event,
    improvement: Math.round(performanceMetrics.reduce((sum, m) => sum + m.improvement, 0) / performanceMetrics.length)
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const viewSession = (session: AthleteSession) => {
    // Open video player for this session
    console.log('Viewing session:', session.id)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Athletes</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold ml-text-hi">{athlete.name}</h1>
            <p className="ml-text-md">{athlete.age} years old • {athlete.level}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            className="ml-cyan-bg text-black hover:ml-cyan-hover"
            onClick={onViewVideos}
          >
            <Video className="h-4 w-4 mr-2" />
            View All Videos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="ml-card ml-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 ml-cyan-bg rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm ml-text-lo">Avg Motion IQ</p>
                <p className="text-2xl font-bold ml-text-hi">{stats.avgMotionIQ}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ml-card ml-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 ml-cyan-bg rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm ml-text-lo">Avg ACL Risk</p>
                <p className="text-2xl font-bold ml-text-hi">{stats.avgACLRisk}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ml-card ml-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 ml-cyan-bg rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm ml-text-lo">Avg Precision</p>
                <p className="text-2xl font-bold ml-text-hi">{stats.avgPrecision}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ml-card ml-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 ml-cyan-bg rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-sm ml-text-lo">Avg Power</p>
                <p className="text-2xl font-bold ml-text-hi">{stats.avgPower}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="ml-card ml-border">
          <TabsTrigger value="sessions" className="flex items-center space-x-2">
            <Video className="h-4 w-4" />
            <span>Training Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Progress Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {/* Training Sessions */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="ml-text-hi">Training Sessions</CardTitle>
                  <CardDescription className="ml-text-md">
                    All training sessions for {athlete.name}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedEvent} 
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="all">All Events</option>
                    <option value="Vault">Vault</option>
                    <option value="Bars">Bars</option>
                    <option value="Beam">Beam</option>
                    <option value="Floor">Floor</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 ml-card rounded-lg border ml-border hover:ml-hover transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 ml-cyan-bg rounded-lg flex items-center justify-center">
                          <Video className="h-8 w-8 text-black" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold ml-text-hi">{session.event}</h3>
                          <p className="text-sm ml-text-lo">
                            {new Date(session.date).toLocaleDateString()} • {session.duration}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="ml-cyan-bg text-black">
                              Motion IQ: {session.motionIQ}
                            </Badge>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              ACL Risk: {session.aclRisk}%
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Precision: {session.precision}%
                            </Badge>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Power: {session.power}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="ml-text-lo hover:ml-text-hi"
                          onClick={() => viewSession(session)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-text-lo hover:ml-text-hi">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Coach Feedback */}
                    {session.coachNotes && (
                      <div className="mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <h4 className="font-semibold ml-text-hi mb-2 flex items-center">
                          <Award className="h-4 w-4 mr-2 text-blue-400" />
                          Coach Feedback
                        </h4>
                        <p className="text-sm ml-text-md">{session.coachNotes}</p>
                      </div>
                    )}

                    {/* Highlights and Areas for Improvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {session.highlights && session.highlights.length > 0 && (
                        <div>
                          <h4 className="font-semibold ml-text-hi mb-2 flex items-center">
                            <Star className="h-4 w-4 mr-2 text-emerald-400" />
                            Highlights
                          </h4>
                          <ul className="space-y-1">
                            {session.highlights.map((highlight, index) => (
                              <li key={index} className="text-sm ml-text-md flex items-center">
                                <div className="w-1 h-1 bg-emerald-400 rounded-full mr-2" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {session.areasForImprovement && session.areasForImprovement.length > 0 && (
                        <div>
                          <h4 className="font-semibold ml-text-hi mb-2 flex items-center">
                            <Target className="h-4 w-4 mr-2 text-orange-400" />
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-1">
                            {session.areasForImprovement.map((area, index) => (
                              <li key={index} className="text-sm ml-text-md flex items-center">
                                <div className="w-1 h-1 bg-orange-400 rounded-full mr-2" />
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Progress Tracking */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <CardTitle className="ml-text-hi">Progress Tracking</CardTitle>
              <CardDescription className="ml-text-md">
                Performance trends across all events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.event} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold ml-text-hi">{metric.event}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold ml-text-hi">{metric.currentScore}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm ml-text-md mb-2">
                      <span>Previous: {metric.previousScore}</span>
                      <span className="text-emerald-400">+{metric.improvement} improvement</span>
                    </div>
                    <Progress value={(metric.currentScore / 100) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <CardTitle className="ml-text-hi">Performance Analytics</CardTitle>
              <CardDescription className="ml-text-md">
                Detailed insights into {athlete.name}'s performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart Placeholder */}
                <div className="p-6 ml-card rounded-lg border ml-border">
                  <h3 className="font-semibold ml-text-hi mb-4">Motion IQ Trend</h3>
                  <div className="h-64 flex items-center justify-center ml-text-lo">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Progress chart will be displayed here</p>
                    </div>
                  </div>
                </div>

                {/* Event Comparison */}
                <div className="p-6 ml-card rounded-lg border ml-border">
                  <h3 className="font-semibold ml-text-hi mb-4">Event Comparison</h3>
                  <div className="space-y-4">
                    {performanceMetrics.map((metric) => (
                      <div key={metric.event} className="flex items-center justify-between">
                        <span className="ml-text-md">{metric.event}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold ml-text-hi">{metric.currentScore}</span>
                          {getTrendIcon(metric.trend)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
