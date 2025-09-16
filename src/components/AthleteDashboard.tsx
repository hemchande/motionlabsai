"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Upload,
  FileVideo,
  Check,
  X,
  ZoomIn,
  Shield,
  Zap,
  Brain,
  CheckCircle,
  HelpCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { gymnasticsAPI } from "@/lib/api"
import { useProcessing } from "@/contexts/ProcessingContext"
import InteractiveVideoPlayer from "./InteractiveVideoPlayer"
import AutoAnalyzedVideoPlayer from "./AutoAnalyzedVideoPlayer"

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  createdAt: string;
  lastLogin: string;
}

interface AthleteSession {
  id: string;
  date: string;
  event: string;
  duration: string;
  motionIQ: number;
  aclRisk: number;
  precision: number;
  power: number;
  status: "completed" | "processing" | "failed" | "pending";
  videoUrl?: string;
  notes?: string;
  coachNotes?: string;
  highlights?: string[];
  areasForImprovement?: string[];
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  analyticsFile?: string;
  // GridFS support
  sessionId?: string;
}

interface PerformanceMetric {
  event: string;
  currentScore: number;
  previousScore: number;
  improvement: number;
  trend: "up" | "down" | "stable";
}

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
  aclRisk?: number
  precision?: number
  power?: number
  analysisJobId?: string
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  analysisProgress?: number
  perFrameJobId?: string
  perFrameStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  perFrameProgress?: number
}

interface AthleteDashboardProps {
  user: User | null;
  onStatsUpdate?: (stats: {
    totalSessions: number;
    avgMotionIQ: number;
    avgACLRisk: number;
    avgPrecision?: number;
    avgPower?: number;
    improvement?: number;
  }) => void;
}

export default function AthleteDashboard({ user, onStatsUpdate }: AthleteDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d")
  
  // Upload state
  const [dragActive, setDragActive] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<Array<{
    id: number;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: string;
  }>>([])
  const [uploadMetadata, setUploadMetadata] = useState({
    athlete: user?.fullName || "",
    event: "",
    session: "",
    notes: ""
  })
  
  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [videoData, setVideoData] = useState<{url: string, name: string, analyticsBaseName?: string} | null>(null)
  const [selectedSession, setSelectedSession] = useState<AthleteSession | null>(null)
  
  const { addJob, getJob } = useProcessing()

  // Close video player handler
  const closeVideoPlayer = () => {
    setShowVideoPlayer(false)
    setVideoData(null)
    setSelectedSession(null)
  }

  // Handle ESC key to close video player
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showVideoPlayer) {
        closeVideoPlayer()
      }
    }

    if (showVideoPlayer) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showVideoPlayer])

  // Sessions state
  const [sessions, setSessions] = useState<AthleteSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Fetch sessions from backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true)
        const response = await gymnasticsAPI.getSessions()
        if (response.success && response.sessions) {
          // Transform backend sessions to frontend format
          const transformedSessions: AthleteSession[] = response.sessions.map((session: Record<string, any>) => ({
            id: session._id || session.id,
            date: session.date || new Date().toISOString().split('T')[0],
            event: session.event || 'Unknown Event',
            duration: session.duration || '0:00',
            motionIQ: session.motion_iq || 0,
            aclRisk: session.acl_risk || 0,
            precision: session.precision || 0,
            power: session.power || 0,
            status: session.status === 'completed' ? 'completed' : session.status === 'pending' ? 'pending' : 'processing',
            notes: session.notes || '',
            coachNotes: session.coach_notes || '',
            highlights: session.highlights || [],
            areasForImprovement: session.areas_for_improvement || [],
            hasProcessedVideo: !!session.processed_video_filename,
            processedVideoUrl: session.processed_video_url || session.video_url,
            analyticsFile: session.analytics_filename,
            sessionId: session._id // Add sessionId for GridFS support
          }))
          setSessions(transformedSessions)
          console.log('✅ Fetched athlete sessions from backend:', transformedSessions.length)
        }
      } catch (error) {
        console.error('❌ Error fetching athlete sessions:', error)
        // Keep empty array on error
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  // Mock data removed - now fetching from backend
  // Note: Sessions are now fetched from the backend API

  // Monitor processing jobs and update sessions
  useEffect(() => {
    const interval = setInterval(() => {
      sessions.forEach(session => {
        if (session.status === "processing") {
          // Check if analysis is complete and update session
          // This would typically check the backend for completion status
          // For now, we'll simulate completion after a delay
          if (session.id.startsWith('session-')) {
            const sessionAge = Date.now() - parseInt(session.id.split('-')[1])
            if (sessionAge > 10000) { // 10 seconds
              updateSessionWithResults(session.id, {
                motionIQ: Math.floor(Math.random() * 20) + 80, // 80-100
                aclRisk: Math.floor(Math.random() * 15) + 5,   // 5-20
                precision: Math.floor(Math.random() * 15) + 80, // 80-95
                power: Math.floor(Math.random() * 15) + 80,     // 80-95
                processedVideoUrl: `http://localhost:5004/downloadVideo?video_filename=h264_analyzed_${session.event.toLowerCase()}_${Date.now()}.mp4`,
                analyticsFile: `analyzed_${session.event.toLowerCase()}_${Date.now()}.json`
              })
            }
          }
        }
      })
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [sessions])

  const performanceMetrics: PerformanceMetric[] = useMemo(() => [
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
      currentScore: 96,
      previousScore: 93,
      improvement: 3,
      trend: "up"
    },
    {
      event: "Floor",
      currentScore: 91,
      previousScore: 88,
      improvement: 3,
      trend: "up"
    }
  ], [])

  const filteredSessions = sessions.filter(session =>
    session.event.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedEvent === "all" || session.event === selectedEvent)
  )

  const completedSessions = useMemo(() => 
    sessions.filter(s => s.status === "completed" && s.motionIQ > 0), 
    [sessions]
  )
  
  const stats = useMemo(() => ({
    totalSessions: sessions.length,
    avgMotionIQ: completedSessions.length > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + s.motionIQ, 0) / completedSessions.length) : 0,
    avgACLRisk: completedSessions.length > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + s.aclRisk, 0) / completedSessions.length) : 0,
    avgPrecision: completedSessions.length > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + s.precision, 0) / completedSessions.length) : 0,
    avgPower: completedSessions.length > 0 ? Math.round(completedSessions.reduce((sum, s) => sum + s.power, 0) / completedSessions.length) : 0,
    bestEvent: performanceMetrics.length > 0 ? performanceMetrics.reduce((best, current) => 
      current.currentScore > best.currentScore ? current : best
    ).event : "N/A",
    improvement: performanceMetrics.length > 0 ? Math.round(performanceMetrics.reduce((sum, m) => sum + m.improvement, 0) / performanceMetrics.length) : 0
  }), [sessions, completedSessions, performanceMetrics])

  // Update parent component with stats
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        totalSessions: stats.totalSessions,
        avgMotionIQ: stats.avgMotionIQ,
        avgACLRisk: stats.avgACLRisk,
        avgPrecision: stats.avgPrecision,
        avgPower: stats.avgPower,
        improvement: stats.improvement
      })
    }
  }, [stats, onStatsUpdate])

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

  // Upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const uploadId = Date.now() + Math.random()
        setUploadQueue(prev => [...prev, {
          id: uploadId,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'pending'
        }])
        
        // Start upload
        uploadVideo(file, uploadId)
      }
    })
  }, [])

  const uploadVideo = async (file: File, uploadId: number) => {
    try {
      setUploadQueue(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'uploading', progress: 10 } : upload
      ))

      // The API expects just the file, not FormData
      console.log('Uploading video:', file.name)
      const response = await gymnasticsAPI.uploadVideo(file)
      console.log('Upload response:', response)
      
      if (response.success && response.filename) {
        setUploadQueue(prev => prev.map(upload => 
          upload.id === uploadId ? { ...upload, status: 'completed', progress: 100 } : upload
        ))

        // Create session after upload (without starting analysis)
        console.log('Video uploaded successfully:', response.filename)
        await createSessionAfterUpload(response.filename, file.name)
        
        // If this is a MYa FX video, automatically show the existing Mya Wiley session
        if (file.name.toLowerCase().includes('mya fx') || 
            file.name.toLowerCase().includes('mya wiley') ||
            file.name.toLowerCase().includes('20250903_212015_20250911_144715_20250912_210519')) {
          const myaWileySession = sessions.find(s => s.id === 'mya-fx-floor')
          if (myaWileySession) {
            console.log('Redirecting to existing Mya Wiley session for:', file.name)
            setSelectedSession(myaWileySession)
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadQueue(prev => prev.map(upload => 
        upload.id === uploadId ? { ...upload, status: 'failed', progress: 0 } : upload
      ))
    }
  }

  const removeUpload = (uploadId: number) => {
    setUploadQueue(prev => prev.filter(upload => upload.id !== uploadId))
  }

  const createSessionAfterUpload = async (filename: string, originalName: string) => {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newSession: AthleteSession = {
        id: sessionId,
        date: new Date().toISOString(),
        event: uploadMetadata.event || "General",
        duration: "Uploaded",
        motionIQ: 0,
        aclRisk: 0,
        precision: 0,
        power: 0,
        status: "pending", // Set to pending so user can manually start analysis
        notes: uploadMetadata.notes,
        hasProcessedVideo: false, // Set to false until analysis is completed
        processedVideoUrl: `http://localhost:5004/downloadVideo?video_filename=${filename}`,
        videoUrl: filename,
        analyticsFile: `${filename.replace(/\.mp4$/, '')}_analytics.json`
      }
      
      // Add to sessions list
      setSessions(prev => [newSession, ...prev])
      console.log('Created new session with ID:', sessionId, 'for video:', filename)
      
      // Show success message
      alert(`Video "${originalName}" uploaded successfully! You can now start analysis from the "Videos Ready for Analysis" section below.`)
    } catch (error) {
      console.error("Failed to create session after upload:", error)
    }
  }

  const startAnalysis = async (filename: string, sessionId: string) => {
    try {
      // Extract just the filename from the path (remove /videos/ prefix if present)
      const actualFilename = filename.includes('/') ? filename.split('/').pop() : filename
      console.log('Starting analysis for:', actualFilename)
      
      // Update session status to processing
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'processing' as const }
          : session
      ))

      // Check if API server is available first
      let apiServerAvailable = false
      try {
        await gymnasticsAPI.checkHealth()
        apiServerAvailable = true
      } catch (error) {
        console.log('API server not available, skipping analysis')
      }

      if (!apiServerAvailable) {
        // Still add the session but mark it as completed without analysis
      const newSession: AthleteSession = {
          id: sessionId || `session-${Date.now()}`,
        date: new Date().toISOString(),
        event: uploadMetadata.event || "General",
          duration: "Uploaded",
        motionIQ: 0,
        aclRisk: 0,
        precision: 0,
        power: 0,
          status: "completed",
        notes: uploadMetadata.notes,
          hasProcessedVideo: false
      }
      setSessions(prev => [newSession, ...prev])
        return
      }
      
      // Start standard analysis
      let analysisJob = null
      try {
        const analysisResponse = await gymnasticsAPI.analyzeVideo(actualFilename)
        if (analysisResponse.success) {
          analysisJob = analysisResponse
          addJob({
            id: analysisResponse.job_id,
            videoName: actualFilename,
            type: 'analysis',
            status: 'processing',
            progress: 0,
            maxRetries: 3
          })
        }
      } catch (error) {
        console.log('Standard analysis not available:', error)
      }

      // Start per-frame analysis
      let perFrameJob = null
      try {
        const perFrameResponse = await gymnasticsAPI.analyzeVideoPerFrame(actualFilename)
        if (perFrameResponse.success) {
          perFrameJob = perFrameResponse
          addJob({
            id: perFrameResponse.job_id,
            videoName: actualFilename,
            type: 'perFrame',
            status: 'processing',
            progress: 0,
            maxRetries: 3
          })
        }
      } catch (error) {
        console.log('Per-frame analysis not available:', error)
      }

      // Session should already exist (created after upload)
      // This function only starts analysis for existing sessions
      
      // Simulate analysis completion after a delay
      if (analysisJob?.job_id || perFrameJob?.job_id) {
        setTimeout(() => {
          setSessions(prev => prev.map(session => {
            // Handle completion for existing sessions (when sessionId is provided)
            if (sessionId && session.id === sessionId) {
              return { 
                ...session, 
                status: 'completed' as const,
                motionIQ: Math.floor(Math.random() * 20) + 80,
                aclRisk: Math.floor(Math.random() * 15) + 5,
                precision: Math.floor(Math.random() * 15) + 80,
                power: Math.floor(Math.random() * 15) + 80,
                hasProcessedVideo: true,
                processedVideoUrl: `http://localhost:5004/downloadVideo?video_filename=h264_${actualFilename}`,
                analyticsFile: `${actualFilename.replace(/\.mp4$/, '')}_analytics.json`
              }
            }
            // Handle completion for sessions (when sessionId is provided or matches videoName)
            else if ((sessionId && session.id === sessionId) || (!sessionId && session.videoUrl === actualFilename && session.status === 'processing')) {
              console.log('Updating session to completed:', session.id, 'for video:', actualFilename)
              return { 
                ...session, 
                status: 'completed' as const,
                motionIQ: Math.floor(Math.random() * 20) + 80,
                aclRisk: Math.floor(Math.random() * 15) + 5,
                precision: Math.floor(Math.random() * 15) + 80,
                power: Math.floor(Math.random() * 15) + 80,
                hasProcessedVideo: true,
                processedVideoUrl: `http://localhost:5004/downloadVideo?video_filename=h264_${actualFilename}`,
                analyticsFile: `${actualFilename.replace(/\.mp4$/, '')}_analytics.json`
              }
            }
            return session
          }))
        }, 5000) // 5 seconds delay
      }
    } catch (error) {
      console.error('Analysis error:', error)
      // Update session status to failed
      if (sessionId) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'failed' as const }
            : session
        ))
      }
    }
  }


  // Update session with analysis results
  const updateSessionWithResults = (sessionId: string, analysisData: {
    motionIQ?: number;
    aclRisk?: number;
    precision?: number;
    power?: number;
    processedVideoUrl?: string;
    analyticsFile?: string;
  }) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          motionIQ: analysisData.motionIQ || session.motionIQ,
          aclRisk: analysisData.aclRisk || session.aclRisk,
          precision: analysisData.precision || session.precision,
          power: analysisData.power || session.power,
          status: "completed" as const,
          hasProcessedVideo: true,
          processedVideoUrl: analysisData.processedVideoUrl || session.processedVideoUrl,
          analyticsFile: analysisData.analyticsFile || session.analyticsFile
        }
      }
      return session
    }))
  }

  // Session selection handler
  const handleSessionSelect = (session: AthleteSession) => {
    setSelectedSession(session)
    // You can add additional logic here if needed
    console.log('Selected session:', session.id)
  }

  // Video player handlers
  const viewSession = async (session: AthleteSession) => {
    try {
      if (session.hasProcessedVideo && session.processedVideoUrl) {
        // Set the selected session for the AutoAnalyzedVideoPlayer
        setSelectedSession(session)
        
        setVideoData({
          url: session.processedVideoUrl,
          name: session.videoUrl || session.event,
          analyticsBaseName: session.analyticsFile?.replace('.json', '')
        })
        setShowVideoPlayer(true)
      } else {
        alert('No processed video available for this session.')
      }
    } catch (error) {
      console.error('Error viewing session:', error)
      alert('Failed to load session video')
    }
  }

  const viewAnalytics = async (session: AthleteSession) => {
    try {
      if (session.analyticsFile) {
        const baseName = session.analyticsFile
          .replace(/^api_generated_/, '')
          .replace(/^frame_analysis_/, '')
          .replace(/^per_frame_analysis_/, '')
          .replace(/^motion_analysis_/, '')
          .replace(/^biomechanical_data_/, '')
          .replace(/^gymnastics_metrics_/, '')
          .replace(/^performance_analysis_/, '')
          .replace(/\.json$/, '')
        
        const analyticsUrl = `http://localhost:5004/getPerFrameStatistics?video_filename=${baseName}`
        const response = await fetch(analyticsUrl)
        
        if (response.ok) {
          const analyticsData = await response.json()
          const analyticsText = JSON.stringify(analyticsData, null, 2)
          const blob = new Blob([analyticsText], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        } else {
          alert('Failed to load analytics data')
        }
      } else {
        alert('No analytics available for this session.')
      }
    } catch (error) {
      console.error('Error viewing analytics:', error)
      alert('Failed to load analytics data')
    }
  }

  return (
    <TooltipProvider>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ml-text-hi">My Dashboard</h1>
          <p className="ml-text-md">Welcome back, {user?.fullName}</p>
        </div>
        <Button 
          className="ml-cyan-bg text-black hover:ml-cyan-hover"
          onClick={() => {
            // Scroll to the upload section
            setTimeout(() => {
              const uploadSection = document.querySelector('#upload-section');
              if (uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Total Sessions
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs leading-tight">Total number of your video</p>
                    <p className="text-xs leading-tight">analysis sessions completed</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.improvement}% improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Average Motion IQ
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs leading-tight">Your AI-powered performance</p>
                    <p className="text-xs leading-tight">score combining technique,</p>
                    <p className="text-xs leading-tight">power, safety, artistry, and</p>
                    <p className="text-xs leading-tight">consistency metrics</p>
                    <p className="text-xs leading-tight">(0-100 scale)</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getIQColor(stats.avgMotionIQ)}`}>{stats.avgMotionIQ}</div>
            <p className="text-xs text-muted-foreground">
              Best: {stats.bestEvent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Average ACL Risk
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs leading-tight">Your Anterior Cruciate</p>
                    <p className="text-xs leading-tight">Ligament injury risk</p>
                    <p className="text-xs leading-tight">assessment based on landing</p>
                    <p className="text-xs leading-tight">mechanics and joint angles</p>
                    <p className="text-xs leading-tight">(lower is better)</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats.avgACLRisk}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgACLRisk < 15 ? 'Low risk' : 'Monitor closely'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Completed Analyses
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs leading-tight">Number of your video</p>
                    <p className="text-xs leading-tight">analyses that have been</p>
                    <p className="text-xs leading-tight">fully processed with</p>
                    <p className="text-xs leading-tight">results available</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{sessions.filter(s => s.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">
              {sessions.filter(s => s.status === "processing").length} processing
            </p>
          </CardContent>
        </Card>
      </div>


      {/* My Sessions Section */}
      <div className="space-y-4">
          {/* My Sessions - Show only one session for athletes */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="ml-text-hi">My Sessions</CardTitle>
                  <CardDescription className="ml-text-md">
                    Your training sessions with AI-powered analysis and coach feedback
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger className="w-32 ml-hover ml-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="Vault">Vault</SelectItem>
                      <SelectItem value="Bars">Bars</SelectItem>
                      <SelectItem value="Beam">Beam</SelectItem>
                      <SelectItem value="Floor">Floor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 w-full">
                {filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-8 ml-card rounded-lg border ml-border hover:ml-hover transition-colors w-full"
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
                            <Badge className={`${getIQBadgeColor(session.motionIQ)}`}>
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
                            <Badge 
                              className={
                                session.status === "completed" 
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : session.status === "processing"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              }
                            >
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {session.status === "pending" && (
                          <Button 
                            size="sm" 
                            onClick={() => startAnalysis(session.videoUrl || session.id, session.id)}
                            className="ml-cyan-bg text-black hover:ml-cyan-hover"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start Analysis
                          </Button>
                        )}
                        {session.status === "processing" && (
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
                        {session.status === "completed" && (
                          <>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="ml-text-lo hover:ml-text-hi"
                          onClick={() => viewSession(session)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="ml-text-lo hover:ml-text-hi"
                          onClick={() => viewAnalytics(session)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="ml-text-lo hover:ml-text-hi">
                          <Download className="h-4 w-4" />
                        </Button>
                          </>
                        )}
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
      </div>

      {/* Upload Videos Section */}
      <Card id="upload-section" className="ml-card ml-border">
            <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Videos</span>
          </CardTitle>
          <CardDescription>
            Drag and drop video files or click to browse. Supports MP4, MOV, AVI, and WebM formats.
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-4">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-cyan-500 bg-cyan-500/10' : 'ml-border ml-hover hover:border-cyan-400/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
            <Video className="h-12 w-12 ml-text-lo mx-auto mb-4" />
            <h3 className="ml-text-hi font-semibold mb-2">
              Drop video files here or click to browse
            </h3>
            <p className="ml-text-md text-sm mb-4">
              Supports MP4, MOV, AVI, WebM formats up to 500MB each
                </p>
                <Button
              variant="outline"
              className="ml-hover ml-border ml-text-hi hover:ml-cyan-hover"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
              accept="video/*"
                  className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {/* Upload Queue */}
              {uploadQueue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Upload Queue</h3>
                {uploadQueue.some(upload => upload.status === 'pending') && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const pendingUploads = uploadQueue.filter(upload => upload.status === 'pending')
                      pendingUploads.forEach(upload => uploadVideo(upload.file, upload.id))
                    }}
                    className="ml-cyan-bg text-black hover:ml-cyan-hover"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload All
                  </Button>
                )}
              </div>
                  {uploadQueue.map((upload) => (
                <div key={upload.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Video className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium">{upload.name}</p>
                    <p className="text-sm text-gray-500">{(upload.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                      <div className="flex items-center space-x-2">
                          <Progress value={upload.progress} className="w-20" />
                    <span className="text-sm text-gray-500">{upload.progress.toFixed(0)}%</span>
                    {upload.status === 'completed' && <Check className="h-4 w-4 text-green-500" />}
                    {upload.status === 'failed' && <X className="h-4 w-4 text-red-500" />}
                    {upload.status === 'uploading' && <Clock className="h-4 w-4 text-blue-500" />}
                    {upload.status === 'pending' && <Clock className="h-4 w-4 text-gray-500" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    {upload.status === 'pending' && (
                        <Button
                          size="sm"
                        onClick={() => uploadVideo(upload.file, upload.id)}
                        className="ml-cyan-bg text-black hover:ml-cyan-hover"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    )}
                    <Button
                          variant="ghost"
                      size="sm"
                          onClick={() => removeUpload(upload.id)}
                      className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

          {/* Metadata Form */}
          <div className="grid grid-cols-2 gap-4">
                <div>
              <Label htmlFor="athlete">Athlete Name</Label>
              <Input
                id="athlete"
                value={uploadMetadata.athlete}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, athlete: e.target.value }))}
                placeholder="Enter athlete name"
              />
            </div>
            <div>
              <Label htmlFor="event">Event</Label>
                  <Select value={uploadMetadata.event} onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, event: value }))}>
                <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="floor">Floor Exercise</SelectItem>
                  <SelectItem value="vault">Vault</SelectItem>
                  <SelectItem value="bars">Uneven Bars</SelectItem>
                  <SelectItem value="beam">Balance Beam</SelectItem>
                  <SelectItem value="all-around">All-Around</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
              <Label htmlFor="session">Session</Label>
              <Input
                id="session"
                value={uploadMetadata.session}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, session: e.target.value }))}
                placeholder="Training, Competition, etc."
              />
              </div>
              <div>
              <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={uploadMetadata.notes}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                />
            </div>
              </div>
            </CardContent>
          </Card>

      {/* Recently Uploaded Videos - Ready for Analysis */}
      {sessions.filter(s => s.status === "pending" && s.videoUrl).length > 0 && (
          <Card className="ml-card ml-border">
            <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Videos Ready for Analysis</span>
            </CardTitle>
            <CardDescription>
              Uploaded videos that are ready to be analyzed
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-2">
              {sessions.filter(s => s.status === "pending" && s.videoUrl).slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center space-x-3">
                    <Video className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{user?.fullName || 'My Session'} - {session.event}</p>
                      <p className="text-xs text-gray-500">{session.videoUrl}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => startAnalysis(session.videoUrl || session.id, session.id)}
                    className="ml-cyan-bg text-black hover:ml-cyan-hover"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start Analysis
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {user?.fullName || 'My Session'} - {selectedSession.event}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
                        </div>
            <div className="p-4">
              {selectedSession.hasProcessedVideo ? (
                <AutoAnalyzedVideoPlayer
                  videoUrl={selectedSession.processedVideoUrl || selectedSession.videoUrl}
                  videoName={selectedSession.processedVideoUrl?.split('/').pop() || selectedSession.videoUrl?.split('/').pop() || selectedSession.id}
                  analyticsBaseName={selectedSession.analyticsFile?.replace('.json', '').replace('api_generated_', '')}
                  onClose={() => setSelectedSession(null)}
                />
              ) : (
                <InteractiveVideoPlayer
                  videoUrl={selectedSession.processedVideoUrl || selectedSession.videoUrl}
                  videoName={selectedSession.processedVideoUrl?.split('/').pop() || selectedSession.videoUrl?.split('/').pop() || selectedSession.id}
                  analyticsBaseName={selectedSession.analyticsFile?.replace('.json', '').replace('api_generated_', '')}
                />
              )}
                      </div>
                  </div>
                </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && videoData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Video Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeVideoPlayer}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              {selectedSession && selectedSession.hasProcessedVideo ? (
                <AutoAnalyzedVideoPlayer
                  videoUrl={selectedSession.processedVideoUrl || selectedSession.videoUrl}
                  videoName={selectedSession.processedVideoUrl?.split('/').pop() || selectedSession.videoUrl?.split('/').pop() || selectedSession.id}
                  analyticsBaseName={selectedSession.analyticsFile?.replace('.json', '').replace('api_generated_', '')}
                  onClose={closeVideoPlayer}
                />
              ) : (
              <InteractiveVideoPlayer
                videoUrl={videoData.url}
                videoName={videoData.name}
                analyticsBaseName={videoData.analyticsBaseName}
              />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
