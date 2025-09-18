"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Video,
  BarChart3,
  Upload,
  Share2,
  Search,
  Filter,
  Calendar,
  Trophy,
  TrendingUp,
  Activity,
  UserPlus,
  Eye,
  Download,
  MoreHorizontal,
  FileVideo,
  Check,
  X,
  Clock,
  BarChart3 as BarChart3Icon,
  AlertTriangle,
  Play,
  Shield,
  CheckCircle,
  Award,
  HelpCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { gymnasticsAPI } from "@/lib/api"
import { useProcessing } from "@/contexts/ProcessingContext"
import InteractiveVideoPlayer from "./InteractiveVideoPlayer"
import AutoAnalyzedVideoPlayer from "./AutoAnalyzedVideoPlayer"
import AthleteDetailView from "./AthleteDetailView"
import AthleteInvitationModal from "./AthleteInvitationModal"
import BackgroundProcessingModal from "./BackgroundProcessingModal"

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

interface Athlete {
  id: string;
  name: string;
  age: number;
  level: string;
  events: string[];
  lastSession: string;
  totalSessions: number;
  avgMotionIQ: number;
  improvement: number;
  avatar?: string;
}

interface Session {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  event: string;
  duration: string;
  motionIQ: number;
  status: "completed" | "processing" | "failed" | "pending" | "uploaded";
  videoUrl?: string;
  notes?: string;
  // New fields for processed videos and analytics
  hasProcessedVideo?: boolean;
  processedVideoUrl?: string;
  processedVideoFilename?: string;
  analyticsFile?: string;
  aclRisk?: number;
  precision?: number;
  power?: number;
  analysisJobId?: string;
  perFrameJobId?: string;
  // GridFS support
  sessionId?: string;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'not_available';
  perFrameStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'not_available';
  analysisProgress?: number;
  perFrameProgress?: number;
  videoName?: string;
  originalFilename?: string;
  analysisData?: any;
}

interface CoachDashboardProps {
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

export default function CoachDashboard({ user, onStatsUpdate }: CoachDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  
  // Upload functionality
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
    athlete: "",
    event: "",
    session: "",
    notes: ""
  })
  
  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [showAutoAnalyzedPlayer, setShowAutoAnalyzedPlayer] = useState(false)
  const [videoData, setVideoData] = useState<{url: string, name: string} | null>(null)
  const [autoAnalyzedVideo, setAutoAnalyzedVideo] = useState<{url: string, name: string} | null>(null)
  
  // Athlete detail view state
  const [showAthleteDetail, setShowAthleteDetail] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  
  // Session and modal state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  
  // Per-frame analysis service status
  const [perFrameServiceStatus, setPerFrameServiceStatus] = useState<'available' | 'unavailable' | 'unknown'>('unknown')
  
  const { addJob, getJob, isProcessing, activeJobs } = useProcessing()

  // Upload functions
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
      const file = e.dataTransfer.files[0]
      handleFiles([file])
    }
  }, [])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newUploads = fileArray.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending"
    }))
    
    setUploadQueue(prev => [...prev, ...newUploads])
  }, [])

  const uploadVideo = async (uploadItem: {
    id: number;
    file: File;
    name: string;
    size: number;
    progress: number;
    status: string;
  }) => {
    try {
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === uploadItem.id 
            ? { ...item, status: "uploading", progress: 0 }
            : item
        )
      )

      // The API expects just the file, not FormData
      console.log('Uploading video:', uploadItem.file.name)
      const response = await gymnasticsAPI.uploadVideo(uploadItem.file)
      console.log('Upload response:', response)
      
      if (response.success && response.filename) {
        setUploadQueue(prev => 
          prev.map(item => 
            item.id === uploadItem.id 
              ? { ...item, status: "completed", progress: 100 }
              : item
          )
        )
        
        // Create session after upload (without starting analysis)
        console.log('Video uploaded successfully:', response.filename)
        await createSessionAfterUpload(response.filename, uploadItem.name)
        
        // If this is a MYa FX video, automatically show the existing Mya Wiley session
        if (uploadItem.name.toLowerCase().includes('mya fx') || 
            uploadItem.name.toLowerCase().includes('mya wiley') ||
            uploadItem.name.toLowerCase().includes('20250903_212015_20250911_144715_20250912_210519')) {
          const myaWileySession = sessions.find(s => s.id === 'mya-fx-floor')
          if (myaWileySession) {
            console.log('Redirecting to existing Mya Wiley session for:', uploadItem.name)
            setSelectedSession(myaWileySession)
          }
        }
        
        // Don't automatically show video player - let user choose when to start analysis
        // setTimeout(() => {
        //   setAutoAnalyzedVideo({
        //     url: `http://localhost:5004/getVideo?video_filename=${response.filename}`,
        //     name: uploadItem.name
        //   })
        //   setShowAutoAnalyzedPlayer(true)
        // }, 2000) // Wait 2 seconds for analysis to start
        
        // Session will show up in Session History with "Start Analysis" button
        console.log('Uploaded video ready for manual analysis:', response.filename)
        
        // Show success message
        alert(`Video "${uploadItem.name}" uploaded successfully! You can now start analysis from the Session History section.`)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === uploadItem.id 
            ? { ...item, status: "failed" }
            : item
        )
      )
    }
  }

  // Check backend health before attempting per-frame analysis
  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      const health = await gymnasticsAPI.checkHealth()
      console.log('Backend health check:', health)
      const isHealthy = health.status === 'healthy' || health.status === 'ok'
      setPerFrameServiceStatus(isHealthy ? 'available' : 'unavailable')
      return isHealthy
    } catch (error) {
      console.warn('Backend health check failed:', error)
      setPerFrameServiceStatus('unavailable')
      return false
    }
  }

  // Retry function for per-frame analysis with exponential backoff
  const retryPerFrameAnalysis = async (filename: string, maxRetries: number): Promise<any> => {
    // First check if backend is healthy
    const isHealthy = await checkBackendHealth()
    if (!isHealthy) {
      throw new Error('Backend service is not healthy. Skipping per-frame analysis.')
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Per-frame analysis attempt ${attempt}/${maxRetries} for ${filename}`)
        return await gymnasticsAPI.analyzeVideoPerFrame(filename)
      } catch (error) {
        if (error instanceof Error && error.message.includes('503')) {
          if (attempt === maxRetries) {
            throw error // Re-throw on final attempt
          }
          // Wait with exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000
          console.log(`Per-frame analysis failed with 503, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error // Re-throw non-503 errors immediately
        }
      }
    }
  }

  const analyzeVideo1 = async (videoFilename: string, videoId?: string) => {
    try {
      // Extract just the filename from the path (remove /videos/ prefix if present)
      const actualFilename: string = videoFilename.includes('/') ? videoFilename.split('/').pop() || videoFilename : videoFilename
      console.log('Starting analyzeVideo2 (enhanced analytics) for:', actualFilename)
      
      // Update session status to processing
      if (videoId) {
        setSessions(prev => prev.map(session => 
          session.id === videoId 
            ? { ...session, status: 'processing' as const }
            : session
        ))
      }
      
      // Use the enhanced analyzeVideo2 endpoint
      const response = await gymnasticsAPI.analyzeVideo2(
        actualFilename,
        uploadMetadata.athlete || "Unknown",
        uploadMetadata.event || "General",
        uploadMetadata.session || "Training",
        user?.id || "unknown"
      )
      
      if (response.success) {
        console.log('analyzeVideo2 (enhanced analytics) started successfully:', response)
        
        // Update session with the new session_id from response
        if (videoId) {
          setSessions(prev => prev.map(session => 
            session.id === videoId 
              ? { 
                  ...session, 
                  status: 'processing' as const,
                  sessionId: response.session_id,
                  analysisJobId: response.session_id
                }
              : session
          ))
        }
        
        // Show success message
        alert(`Analysis started successfully! Session ID: ${response.session_id}`)
      } else {
        throw new Error(response.message || 'Analysis failed to start')
      }
    } catch (error) {
      console.error("analyzeVideo1 failed:", error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(`Analysis failed: ${error.message}`)
      } else {
        alert('Analysis failed: An unexpected error occurred. Please try again.')
      }
      
      // Update session status to failed
      if (videoId) {
        setSessions(prev => prev.map(session => 
          session.id === videoId 
            ? { ...session, status: 'failed' as const }
            : session
        ))
      }
    }
  }

  const startAnalysis = async (videoFilename: string, videoId?: string) => {
    try {
      // Extract just the filename from the path (remove /videos/ prefix if present)
      const actualFilename: string = videoFilename.includes('/') ? videoFilename.split('/').pop() || videoFilename : videoFilename
      console.log('Starting analysis for:', actualFilename)
      
      // Update session status to processing
      if (videoId) {
        setSessions(prev => prev.map(session => 
          session.id === videoId 
            ? { ...session, status: 'processing' as const }
            : session
        ))
      }
      
      // Check if API server is available first
      let apiServerAvailable = false
      try {
        await gymnasticsAPI.checkHealth()
        apiServerAvailable = true
        console.log('API server is available, starting analysis...')
      } catch (error) {
        console.warn('API server not available, skipping analysis:', error)
        apiServerAvailable = false
      }
      
      if (!apiServerAvailable) {
        // Still add the session but mark it as completed without analysis
        const newSession: Session = {
          id: videoId || `session-${Date.now()}`,
          athleteId: uploadMetadata.athlete || "Unknown",
          athleteName: uploadMetadata.athlete || "Unknown",
          date: new Date().toISOString(),
          event: uploadMetadata.event || "General",
          duration: "Uploaded",
          motionIQ: 0,
          status: "completed",
          notes: uploadMetadata.notes,
          hasProcessedVideo: false,
          analysisJobId: undefined,
          perFrameJobId: undefined,
          analysisStatus: "not_available" as const
        }
        setSessions(prev => [newSession, ...prev])
        return
      }
      
      // Start standard analysis
      let analysisJob = null
      let perFrameJob = null
      
      try {
        if (actualFilename) {
          analysisJob = await gymnasticsAPI.analyzeVideo(actualFilename)
        if (analysisJob.job_id) {
          addJob({
            id: analysisJob.job_id,
              videoName: actualFilename,
            type: 'analysis',
            status: 'processing',
              progress: 0,
              maxRetries: 3
          })
          }
        }
      } catch (error) {
        console.warn('Standard analysis failed:', error)
        // Show user-friendly error message
        if (error instanceof Error && error.message.includes('Video file not found')) {
          alert(`Video file not found. Please ensure the video file exists on the server.`)
        }
      }
      
      try {
        // Start per-frame analysis with retry logic for 503 errors
        if (actualFilename) {
          perFrameJob = await retryPerFrameAnalysis(actualFilename, 3)
          if (perFrameJob.job_id) {
            addJob({
              id: perFrameJob.job_id,
              videoName: actualFilename,
              type: 'perFrame',
              status: 'processing',
              progress: 0,
              maxRetries: 3
            })
          }
        }
      } catch (error) {
        console.warn('Per-frame analysis failed after retries:', error)
        // Show user-friendly error message based on error type
        if (error instanceof Error) {
          if (error.message.includes('Video file not found')) {
            alert(`Video file not found for per-frame analysis. Please ensure the video file exists on the server.`)
          } else if (error.message.includes('Backend service is not healthy')) {
            console.log('Per-frame analysis service is not available. Continuing with standard analysis only.')
            // Don't show alert for health check failures
          } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
            console.log('Per-frame analysis service is temporarily unavailable after retries. Standard analysis will continue.')
            // Don't show alert for 503 errors as they're often temporary
          } else {
            console.log('Per-frame analysis failed with error:', error.message)
            // Don't show alert for other errors to avoid spam
          }
        }
      }
      
      // Session should already exist (created after upload)
      // This function only starts analysis for existing sessions
      
      // Simulate analysis completion after a delay
      if (analysisJob?.job_id || perFrameJob?.job_id) {
        setTimeout(() => {
          setSessions(prev => prev.map(session => {
            // Handle completion for existing sessions (when videoId is provided)
            if (videoId && session.id === videoId) {
              return { 
                ...session, 
                status: 'completed' as const,
                motionIQ: Math.floor(Math.random() * 20) + 80,
                aclRisk: Math.floor(Math.random() * 15) + 5,
                precision: Math.floor(Math.random() * 15) + 80,
                power: Math.floor(Math.random() * 15) + 80,
                hasProcessedVideo: true,
                processedVideoUrl: `${API_BASE_URL}/getVideo?video_filename=h264_${actualFilename}`,
                analyticsFile: `${actualFilename.replace(/\.mp4$/, '')}_analytics.json`,
                analysisStatus: 'completed' as const,
                perFrameStatus: perFrameJob?.job_id ? 'completed' as const : 'not_available' as const
              }
            }
            // Handle completion for sessions (when videoId is provided or matches videoName)
            else if ((videoId && session.id === videoId) || (!videoId && session.videoName === actualFilename && session.status === 'processing')) {
              console.log('Updating session to completed:', session.id, 'for video:', actualFilename)
              return { 
                ...session, 
                status: 'completed' as const,
                motionIQ: Math.floor(Math.random() * 20) + 80,
                aclRisk: Math.floor(Math.random() * 15) + 5,
                precision: Math.floor(Math.random() * 15) + 80,
                power: Math.floor(Math.random() * 15) + 80,
                hasProcessedVideo: true,
                processedVideoUrl: `${API_BASE_URL}/getVideo?video_filename=h264_${actualFilename}`,
                analyticsFile: `${actualFilename.replace(/\.mp4$/, '')}_analytics.json`,
                analysisStatus: 'completed' as const,
                perFrameStatus: perFrameJob?.job_id ? 'completed' as const : 'not_available' as const
              }
            }
            return session
          }))
        }, 5000) // 5 seconds delay
      }
      
      console.log('Analysis started successfully for:', actualFilename)
    } catch (error) {
      console.error("Analysis failed:", error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Video file not found')) {
          alert(`Analysis failed: Video file not found. Please ensure the video file exists on the server.`)
        } else {
          alert(`Analysis failed: ${error.message}`)
        }
      } else {
        alert('Analysis failed: An unexpected error occurred. Please try again.')
      }
      
      // Update session status to failed
      if (videoId) {
        setSessions(prev => prev.map(session => 
          session.id === videoId 
            ? { ...session, status: 'failed' as const }
            : session
        ))
      }
    }
  }

  const removeUpload = (id: number) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id))
  }

  const createSessionAfterUpload = async (filename: string, originalName: string) => {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newSession: Session = {
        id: sessionId,
        athleteId: uploadMetadata.athlete || "Unknown",
        athleteName: uploadMetadata.athlete || "Unknown",
        date: new Date().toISOString(),
        event: uploadMetadata.event || "General",
        duration: "Uploaded",
        motionIQ: 0,
        status: "pending", // Set to pending so user can manually start analysis
        notes: uploadMetadata.notes,
        hasProcessedVideo: false, // Set to false until analysis is completed
        processedVideoUrl: `${API_BASE_URL}/getVideo?video_filename=${filename}`,
        videoName: filename,
        analyticsFile: `${filename.replace(/\.mp4$/, '')}_analytics.json`,
        analysisJobId: undefined,
        perFrameJobId: undefined,
        analysisStatus: "not_available" as const,
        perFrameStatus: "not_available" as const,
        analysisProgress: 0,
        perFrameProgress: 0
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

  const viewSession = (session: Session) => {
    if (session.processedVideoUrl) {
      // For completed sessions, open the auto-analyzed video player with frame-by-frame stats
      if (session.status === "completed" && session.hasProcessedVideo) {
        setAutoAnalyzedVideo({
          url: session.processedVideoUrl,
          name: session.videoName || session.athleteName
        })
        setShowAutoAnalyzedPlayer(true)
      } else {
        // For other sessions, use the regular video player
        setVideoData({
          url: session.processedVideoUrl,
          name: session.videoName || session.athleteName
        })
        setShowVideoPlayer(true)
      }
    }
  }

  const viewAnalytics = (session: Session) => {
    // Open analytics view with video player and per-frame stats
    console.log("View analytics for session:", session.id)
    setSelectedSession(session)
  }

  const updateSessionStatus = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, ...updates } : session
    ))
  }

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  // Fetch sessions from backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setSessionsLoading(true)
        console.log('🚀 CoachDashboard: Fetching sessions from backend...')
        const response = await gymnasticsAPI.getSessions()
        console.log('📡 CoachDashboard: Raw API response:', response)
        if (response.success && response.sessions) {
          // Transform backend sessions to frontend format
          const transformedSessions: Session[] = response.sessions.map((session: any) => ({
            id: session._id || session.id,
            athleteId: session.athlete_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
            athleteName: session.athlete_name || 'Unknown Athlete',
            date: session.date || new Date().toISOString().split('T')[0],
            event: session.event || 'Unknown Event',
            duration: session.duration || '0:00',
            motionIQ: session.motion_iq || 0,
            status: (() => {
              const status = session.status === 'completed' ? 'completed' : session.status === 'pending' ? 'pending' : session.status === 'uploaded' ? 'uploaded' : 'processing';
              console.log(`📊 CoachDashboard Session ${session._id}: backend status="${session.status}" -> frontend status="${status}"`);
              return status;
            })(),
            videoName: session.original_filename, // Map original_filename to videoName
            videoUrl: session.processed_video_url || session.video_url,
            originalFilename: session.original_filename, // Add originalFilename for robust filtering
            hasProcessedVideo: !!session.processed_video_filename,
            processedVideoUrl: session.processed_video_url || session.video_url,
            processedVideoFilename: session.processed_video_filename,
            analyticsFile: session.analytics_filename,
            aclRisk: session.acl_risk || 0,
            precision: session.precision || 0,
            power: session.power || 0,
            notes: session.notes || session.coach_notes || '',
            sessionId: session._id // Add sessionId for GridFS support
          }))
          setSessions(transformedSessions)
          console.log('✅ Fetched sessions from backend:', transformedSessions.length)
          
          // Debug: Log uploaded sessions
          const uploadedSessions = transformedSessions.filter(s => s.status === 'uploaded')
          console.log('🔍 Uploaded sessions:', uploadedSessions.map(s => ({
            id: s.id,
            status: s.status,
            videoName: s.videoName,
            videoUrl: s.videoUrl,
            originalFilename: s.originalFilename,
            processedVideoFilename: s.processedVideoFilename
          })))
        }
      } catch (error) {
        console.error('❌ Error fetching sessions:', error)
        setSessionsError(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`)
        // Keep empty array on error
      } finally {
        setSessionsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  // Poll for completed analyses
  useEffect(() => {
    const pollForCompletedAnalyses = async () => {
      // Only poll if there are processing sessions
      const processingSessions = sessions.filter(s => s.status === 'processing')
      if (processingSessions.length === 0) return

      try {
        console.log('🔄 Polling for completed analyses...', processingSessions.length, 'processing sessions')
        const response = await gymnasticsAPI.getSessions()
        
        if (response.success && response.sessions) {
          // Check if any processing sessions have completed
          const updatedSessions = sessions.map(session => {
            if (session.status === 'processing') {
              const backendSession = response.sessions.find((s: any) => s._id === session.id)
              if (backendSession && backendSession.status === 'completed') {
                console.log('✅ Session completed:', session.id, backendSession)
                return {
                  ...session,
                  status: 'completed' as const,
                  hasProcessedVideo: !!backendSession.processed_video_filename,
                  processedVideoUrl: backendSession.processed_video_url || session.videoUrl,
                  processedVideoFilename: backendSession.processed_video_filename,
                  analyticsFile: backendSession.analytics_filename,
                  motionIQ: backendSession.motion_iq || session.motionIQ,
                  aclRisk: backendSession.acl_risk || session.aclRisk,
                  precision: backendSession.precision || session.precision,
                  power: backendSession.power || session.power
                }
              }
            }
            return session
          })
          
          // Only update if there are changes
          const hasChanges = updatedSessions.some((session, index) => 
            session.status !== sessions[index].status
          )
          
          if (hasChanges) {
            setSessions(updatedSessions)
            console.log('🔄 Updated sessions with completed analyses')
          }
        }
      } catch (error) {
        console.error('❌ Error polling for completed analyses:', error)
      }
    }

    // Poll every 5 seconds if there are processing sessions
    const interval = setInterval(pollForCompletedAnalyses, 5000)
    
    // Initial poll
    pollForCompletedAnalyses()
    
    return () => clearInterval(interval)
  }, [sessions])

  // Mock data - in a real app, this would come from an API
  const athletes: Athlete[] = useMemo(() => [
    {
      id: "mya-wiley",
      name: "Mya Wiley",
      age: 17,
      level: "Level 10",
      events: ["Vault", "Bars", "Beam", "Floor"],
      lastSession: "2025-09-12",
      totalSessions: 28,
      avgMotionIQ: 89,
      improvement: 12
    },
    {
      id: "1",
      name: "Alex Chen",
      age: 16,
      level: "Level 10",
      events: ["Vault", "Bars", "Beam", "Floor"],
      lastSession: "2024-01-15",
      totalSessions: 24,
      avgMotionIQ: 92,
      improvement: 8
    },
    {
      id: "2",
      name: "Sarah Johnson",
      age: 15,
      level: "Level 9",
      events: ["Vault", "Bars", "Beam"],
      lastSession: "2024-01-14",
      totalSessions: 18,
      avgMotionIQ: 88,
      improvement: 12
    },
    {
      id: "3",
      name: "Maya Rodriguez",
      age: 17,
      level: "Level 10",
      events: ["Vault", "Bars", "Beam", "Floor"],
      lastSession: "2024-01-13",
      totalSessions: 31,
      avgMotionIQ: 95,
      improvement: 5
    }
  ], [])



  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedLevel === "all" || athlete.level === selectedLevel)
  )

  const filteredSessions = sessions.filter(session =>
    session.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedEvent === "all" || session.event === selectedEvent) &&
    // Show completed sessions with video/analytics OR processing sessions
    ((session.status === "completed" && session.hasProcessedVideo && session.analyticsFile) ||
     (session.status === "processing"))
  )

  const stats = useMemo(() => ({
    totalAthletes: athletes.length,
    totalSessions: sessions.length,
    avgMotionIQ: athletes.length > 0 ? Math.round(athletes.reduce((sum, a) => sum + a.avgMotionIQ, 0) / athletes.length) : 0,
    avgACLRisk: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.aclRisk || 0), 0) / sessions.length) : 0,
    recentSessions: sessions.filter(s => new Date(s.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    avgImprovement: athletes.length > 0 ? Math.round(athletes.reduce((sum, a) => sum + a.improvement, 0) / athletes.length) : 0
  }), [athletes, sessions])

  // Update parent component with stats
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate({
        totalSessions: stats.totalSessions,
        avgMotionIQ: stats.avgMotionIQ,
        avgACLRisk: stats.avgACLRisk,
        avgPrecision: 0, // Coach dashboard doesn't track precision separately
        avgPower: 0, // Coach dashboard doesn't track power separately
        improvement: stats.avgImprovement
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

  // Helper function to get ACL risk color based on risk percentage
  const getACLRiskColor = (risk: number) => {
    if (risk <= 5) return 'text-green-500' // Low risk - Green
    if (risk <= 15) return 'text-yellow-500' // Medium risk - Yellow
    return 'text-red-500' // High risk - Red
  }

  // Helper function to check if session has successful video and per-frame stats
  const hasSuccessfulVideoAndStats = async (session: Session): Promise<boolean> => {
    try {
      // Check if video is accessible via /getVideo
      if (session.videoName) {
        const videoResponse = await fetch(`${API_BASE_URL}/getVideo?video_filename=${session.videoName}`)
        if (!videoResponse.ok) {
          console.log(`Video not accessible for session ${session.id}: ${videoResponse.status}`)
          return false
        }
      }
      
      // Check if per-frame stats are available
      if (session.analyticsFile && session.processedVideoFilename) {
        // Use the processed video filename directly from the session data
        const statsResponse = await fetch(`${API_BASE_URL}/getPerFrameStatistics?video_filename=${session.processedVideoFilename}`)
        if (!statsResponse.ok) {
          console.log(`Per-frame stats not available for session ${session.id}: ${statsResponse.status}`)
          return false
        }
      }
      
      return true
    } catch (error) {
      console.log(`Error checking session ${session.id}:`, error)
      return false
    }
  }

  return (
    <TooltipProvider>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ml-text-hi">Coach Dashboard</h1>
          <p className="ml-text-md">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Processing Status Button */}
          {(isProcessing || activeJobs.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProcessingModal(true)}
              className="relative"
            >
              <Activity className="h-4 w-4 mr-2" />
              Processing
              {activeJobs.filter(job => job.status === 'processing').length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
              )}
            </Button>
          )}
          
          <AthleteInvitationModal 
            coachName={user?.fullName || "Coach"}
            coachEmail={user?.email || ""}
            institution={user?.institution}
            onInvitationSent={() => {
              // Refresh athlete list or show success message
              console.log("Athlete invitation sent successfully!")
            }}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
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
                      <p className="text-xs leading-tight">Total number of video analysis</p>
                      <p className="text-xs leading-tight">sessions completed across</p>
                      <p className="text-xs leading-tight">all athletes</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.recentSessions} from last week
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
                      <p className="text-xs leading-tight">AI-powered performance score</p>
                      <p className="text-xs leading-tight">combining technique, power,</p>
                      <p className="text-xs leading-tight">safety, artistry, and</p>
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
                +8% from last month
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
                      <p className="text-xs leading-tight">Anterior Cruciate Ligament</p>
                      <p className="text-xs leading-tight">injury risk assessment</p>
                      <p className="text-xs leading-tight">based on landing mechanics</p>
                      <p className="text-xs leading-tight">and joint angles</p>
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
                      <p className="text-xs leading-tight">Number of video analyses</p>
                      <p className="text-xs leading-tight">that have been fully</p>
                      <p className="text-xs leading-tight">processed with results</p>
                      <p className="text-xs leading-tight">available</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{sessions.filter(s => s.status === "completed").length}</div>
              <p className="text-xs text-muted-foreground">
                {sessions.filter(s => s.status === "processing").length} pending
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Videos Section */}
      <Card className="ml-card ml-border">
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
                      pendingUploads.forEach(upload => uploadVideo(upload))
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
                        onClick={() => uploadVideo(upload)}
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
        </CardContent>
      </Card>

      {/* Sessions Management */}
      <Card className="ml-card ml-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="ml-text-hi">Training Sessions</CardTitle>
              <CardDescription className="ml-text-md">
                Manage and analyze training sessions for all athletes
                {perFrameServiceStatus === 'unavailable' && (
                  <span className="ml-2 text-orange-400 text-sm">
                    (Per-frame analysis unavailable)
                  </span>
                )}
                {perFrameServiceStatus === 'available' && (
                  <span className="ml-2 text-green-400 text-sm">
                    (Per-frame analysis available)
                  </span>
                )}
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
          {sessionsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-black">{sessionsError}</span>
              </div>
            </div>
          )}
          <div className="space-y-4 max-w-6xl mx-auto">
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
                      <h3 className="text-lg font-semibold ml-text-hi">{session.athleteName} - {session.event}</h3>
                      <p className="text-sm ml-text-lo">
                        {new Date(session.date).toLocaleDateString()} • {session.duration}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {session.status === "processing" ? (
                          // Show processing indicator for analyzing sessions
                          <>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Activity className="h-3 w-3 mr-1 animate-spin" />
                              Analyzing...
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Processing Video
                            </Badge>
                          </>
                        ) : (
                          // Show metrics for completed sessions
                          <>
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
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              Completed
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(session.status === "pending" || session.status === "uploaded") && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          console.log('🚀 CoachDashboard Start Analysis clicked for session:', session.id, session.status);
                          analyzeVideo1(session.videoName || session.videoUrl || session.id, session.id);
                        }}
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
                          onClick={() => setSelectedSession(session)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="ml-text-lo hover:ml-text-hi"
                          onClick={() => setSelectedSession(session)}
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

                {/* Coach Notes */}
                {session.notes && (
                  <div className="mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-semibold ml-text-hi mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-blue-400" />
                      Coach Notes
                    </h4>
                    <p className="text-sm ml-text-md">{session.notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
            
            {filteredSessions.length === 0 && (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold ml-text-hi mb-2">No Sessions Found</h3>
                <p className="text-sm ml-text-lo mb-4">
                  {sessions.length === 0 
                    ? 'Start by uploading your first video for analysis'
                    : 'Try adjusting your filters to see more sessions'
                  }
                </p>
                <Button 
                  onClick={() => {/* Scroll to upload section */}}
                  className="ml-cyan-bg text-black hover:ml-cyan-hover"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            )}
          </div>
          
          {/* Recently Uploaded Videos - Ready for Analysis */}
          {sessions.filter(s => s.status === "uploaded" || s.status === "pending").length > 0 && (
            <div className="mt-6 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Videos Ready for Analysis ({sessions.filter(s => s.status === "uploaded").length} uploaded)
              </h4>
              <div className="space-y-2">
                {(() => {
                  // More robust filtering - check for uploaded status and any video identifier
                  const filteredSessions = sessions.filter(s => {
                    const isUploaded = s.status === "uploaded" || s.status === "pending"
                    const hasVideo = s.videoName || s.videoUrl || s.originalFilename
                    console.log(`🔍 Session ${s.id}: status=${s.status}, videoName=${s.videoName}, videoUrl=${s.videoUrl}, hasVideo=${hasVideo}`)
                    return isUploaded && hasVideo
                  })
                  console.log('🔍 CoachDashboard - Filtered sessions for "Videos Ready for Analysis":', filteredSessions.length, 'sessions')
                  return filteredSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                      <div className="flex items-center space-x-3">
                        <Video className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{session.athleteName} - {session.event}</p>
                          <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => analyzeVideo1(session.videoName || session.id, session.id)}
                        className="ml-cyan-bg text-black hover:ml-cyan-hover"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Analysis
                      </Button>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Analyses - Quick Access */}
      {(() => {
        const recentSessions = sessions.filter(s => s.status === "completed" && s.hasProcessedVideo)
        console.log('Recent Analyses - Total sessions:', sessions.length)
        console.log('Recent Analyses - Completed with processed video:', recentSessions.length)
        console.log('Recent Analyses - Sessions:', recentSessions.map(s => ({ id: s.id, athleteName: s.athleteName, status: s.status, hasProcessedVideo: s.hasProcessedVideo })))
        return recentSessions.length > 0
      })() && (
        <Card className="ml-card ml-border">
          <CardHeader>
            <CardTitle className="ml-text-hi flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>Recent Analyses</span>
            </CardTitle>
            <CardDescription className="ml-text-md">
              Quick access to your recently completed video analyses
              {sessions.filter(s => s.status === "processing").length > 0 && (
                <span className="ml-2 text-blue-400 text-sm">
                  ({sessions.filter(s => s.status === "processing").length} analyzing...)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
                {sessions.filter(s => s.status === "completed" && s.hasProcessedVideo).length === 0 && 
                 sessions.filter(s => s.status === "processing").length > 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-blue-400 mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold ml-text-hi mb-2">Analysis in Progress</h3>
                    <p className="text-sm ml-text-lo">
                      Your video analysis is being processed. Results will appear here when complete.
                    </p>
                  </div>
                ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
              {sessions
                .filter(s => s.status === "completed" && s.hasProcessedVideo)
                .slice(0, 8)
                .map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer w-full"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Video className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold ml-text-hi text-sm">{session.athleteName}</h4>
                          <p className="text-xs ml-text-lo">{session.event}</p>
                        </div>
                      </div>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="ml-text-lo">Date:</span>
                        <span className="ml-text-md">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="ml-text-lo">Motion IQ:</span>
                        <span className={`font-semibold ${getIQBadgeColor(session.motionIQ || 0)}`}>
                          {session.motionIQ || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="ml-text-lo">ACL Risk:</span>
                        <span className={`font-semibold ${getACLRiskColor(session.aclRisk || 0)}`}>
                          {session.aclRisk || 'N/A'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="ml-text-lo">Precision:</span>
                        <span className="ml-text-md">{session.precision || 'N/A'}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="ml-text-lo">Power:</span>
                        <span className="ml-text-md">{session.power || 'N/A'}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-gray-400" />
                        <span className="text-xs ml-text-lo">View Per-Frame Stats</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                        title="View video with per-frame statistics and analytics"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
                )}
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold ml-text-hi">
                {selectedSession.athleteName} - {selectedSession.event}
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
                  processedVideoFilename={selectedSession.processedVideoFilename}
                  sessionId={selectedSession.sessionId}
                  onClose={() => setSelectedSession(null)}
                />
              ) : (
                <InteractiveVideoPlayer
                  videoUrl={selectedSession.processedVideoUrl || selectedSession.videoUrl}
                  videoName={selectedSession.processedVideoUrl?.split('/').pop() || selectedSession.videoUrl?.split('/').pop() || selectedSession.id}
                  analyticsBaseName={selectedSession.analyticsFile?.replace('.json', '').replace('api_generated_', '')}
                  sessionId={selectedSession.sessionId}
                  onClose={() => setSelectedSession(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Athlete Detail Modal - TODO: Implement component */}
      {/* {selectedAthlete && (
        <AthleteDetailView
          athlete={selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
        />
      )} */}

      {/* Athlete Invitation Modal - TODO: Implement component */}
      {/* <AthleteInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={(email: string, name: string) => {
          // Handle athlete invitation
          console.log(`Inviting ${name} (${email})`);
          setShowInviteModal(false);
          // Refresh athlete list or show success message
          console.log("Athlete invitation sent successfully!")
        }}
      /> */}

      {/* Background Processing Modal */}
      <BackgroundProcessingModal
        isOpen={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
      />
    </div>
    </TooltipProvider>
  );
}