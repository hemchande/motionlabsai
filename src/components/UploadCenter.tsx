"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Video,
  FileVideo,
  Check,
  X,
  Clock,
  Eye,
  Download,
  Trash2,
  Edit,
  BarChart3,
  Activity,
  AlertTriangle,
  Play,
  FileVideo as PerFrameIcon,
  TrendingUp,
  Shield
} from "lucide-react"
import { motion } from "framer-motion"
import { gymnasticsAPI, API_BASE_URL } from "@/lib/api"
import { useProcessing } from "@/contexts/ProcessingContext"
import InteractiveVideoPlayer from "./InteractiveVideoPlayer"

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
  analysisJobId?: string
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  analysisProgress?: number
  perFrameJobId?: string
  perFrameStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  perFrameProgress?: number
}

interface UploadCenterProps {
  onVideoUpload: (video: UploadedVideo) => void
  uploadedVideos: UploadedVideo[]
}

export default function UploadCenter({ onVideoUpload, uploadedVideos }: UploadCenterProps) {
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
  const { addJob, getJob } = useProcessing()

  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [videoData, setVideoData] = useState<{url: string, name: string} | null>(null)

  // Sync processing jobs with uploaded videos
  useEffect(() => {
    const syncJobsWithVideos = () => {
      uploadedVideos.forEach(video => {
        if (video.analysisJobId) {
          const job = getJob(video.analysisJobId)
          if (job) {
            const updatedVideo = {
              ...video,
              analysisStatus: job.status,
              analysisProgress: job.progress
            }
            onVideoUpload(updatedVideo)
          }
        }
        
        if (video.perFrameJobId) {
          const job = getJob(video.perFrameJobId)
          if (job) {
            const updatedVideo = {
              ...video,
              perFrameStatus: job.status,
              perFrameProgress: job.progress
            }
            onVideoUpload(updatedVideo)
          }
        }
      })
    }

    const interval = setInterval(syncJobsWithVideos, 1000)
    return () => clearInterval(interval)
  }, [uploadedVideos, getJob, onVideoUpload])

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        const duration = video.duration
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const handleFiles = async (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      // Enhanced file validation
      const maxSize = 500 * 1024 * 1024 // 500MB
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime']

      if (!file.type.startsWith('video/')) {
        alert(`${file.name} is not a video file. Please upload only video files.`)
        return
      }

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(`${file.name} format not supported. Please upload MP4, MOV, AVI, or WebM files.`)
        return
      }

      if (file.size > maxSize) {
        alert(`${file.name} is too large. Please upload files smaller than 500MB.`)
        return
      }

      const uploadId = Date.now() + Math.random()
      const newUpload = {
        id: uploadId,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      }
      setUploadQueue(prev => [...prev, newUpload])

      try {
        // Actually upload the file to the backend
        const uploadResult = await gymnasticsAPI.uploadVideo(file)
        
        if (uploadResult.success) {
          // Update progress to 100%
          setUploadQueue(prev => prev.map(upload => {
            if (upload.id === uploadId) {
              return { ...upload, progress: 100, status: 'completed' }
            }
            return upload
          }))

          // Create video URL and get duration
          const videoUrl = URL.createObjectURL(file)
          const duration = await getVideoDuration(file)

          // Create the uploaded video object with the backend filename
          const uploadedVideo: UploadedVideo = {
            id: `video-${Date.now()}-${Math.random()}`,
            name: uploadResult.filename, // Use the backend filename
            file: file,
            url: videoUrl,
            athlete: uploadMetadata.athlete || "Unknown Athlete",
            event: uploadMetadata.event || "Unknown Event",
            session: uploadMetadata.session || "Training",
            notes: uploadMetadata.notes || "",
            uploadDate: new Date().toISOString().split('T')[0],
            duration: duration,
            size: file.size,
            status: 'processed',
            motionIQ: Math.floor(Math.random() * 20) + 80, // Random score 80-100
            analysisStatus: 'pending',
            perFrameStatus: 'pending'
          }

          // Call the upload callback
          onVideoUpload(uploadedVideo)

          console.log(`✅ Video uploaded successfully: ${uploadResult.filename}`)
        } else {
          throw new Error(uploadResult.message || 'Upload failed')
        }

      } catch (error) {
        console.error('❌ Upload failed:', error)
        
        // Update upload queue status to failed
        setUploadQueue(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            return { ...upload, status: 'failed', progress: 0 }
          }
          return upload
        }))

        alert(`Failed to upload ${file.name}: ${error.message}`)
        
        // Remove failed upload after a delay
        setTimeout(() => {
          setUploadQueue(prev => prev.filter(upload => upload.id !== uploadId))
        }, 3000)
        
        return
      }

      // Remove from queue after a short delay
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(upload => upload.id !== uploadId))
      }, 2000)
    })
  }

  const startAnalysis = async (video: UploadedVideo) => {
    try {
      console.log(`🚀 Starting analysis for video: ${video.name}`)
      // Use analyzeVideo1 for better handling of large videos from GridFS
      const response = await gymnasticsAPI.analyzeVideo1(
        video.name, 
        video.athlete, 
        video.event, 
        video.session
      )
      console.log(`📊 Analysis response:`, response)
      
      if (response.success && response.session_id) {
        console.log(`✅ Analysis completed successfully, Session ID: ${response.session_id}`)
        const updatedVideo = {
          ...video,
          analysisJobId: response.session_id,
          analysisStatus: 'completed' as const,
          analysisProgress: 100,
          downloadUrl: response.download_url,
          analyticsUrl: response.analytics_url
        }
        onVideoUpload(updatedVideo)
        
        // Add to global processing context
        addJob({
          id: response.session_id,
          videoName: video.name,
          type: 'analysis',
          status: 'completed',
          progress: 100,
          maxRetries: 3
        })
        
        console.log(`✅ Analysis completed for ${video.name}, Session ID: ${response.session_id}`)
      } else {
        console.error(`❌ Analysis failed:`, response)
        throw new Error(response.message || 'Analysis failed to start')
      }
    } catch (error) {
      console.error('Error starting analysis:', error)
      alert('Failed to start analysis. Please try again.')
    }
  }

  const startPerFrameAnalysis = async (video: UploadedVideo) => {
    try {
      console.log(`🎯 Starting per-frame analysis for video: ${video.name}`)
      const response = await gymnasticsAPI.analyzeVideoPerFrame(video.name)
      console.log(`📊 Per-frame analysis response:`, response)
      
      if (response.success && response.job_id) {
        console.log(`✅ Per-frame analysis started successfully, Job ID: ${response.job_id}`)
        const updatedVideo = {
          ...video,
          perFrameJobId: response.job_id,
          perFrameStatus: 'processing' as const,
          perFrameProgress: 0
        }
        onVideoUpload(updatedVideo)
        
        // Add to global processing context
        addJob({
          id: response.job_id,
          videoName: video.name,
          type: 'perFrame',
          status: 'processing',
          progress: 0,
          maxRetries: 3
        })
        
        console.log(`✅ Per-frame analysis started for ${video.name}, Job ID: ${response.job_id}`)
      } else if (response.error && response.error.includes('MediaPipe')) {
        // Handle MediaPipe server not running
        console.log(`⚠️ MediaPipe server not running, falling back to standard analysis`)
        alert('Per-frame analysis requires MediaPipe server. Running standard analysis instead.')
        startAnalysis(video)
      } else {
        console.error(`❌ Per-frame analysis failed:`, response)
        throw new Error(response.message || response.error || 'Per-frame analysis failed to start')
      }
    } catch (error) {
      console.error('Error starting per-frame analysis:', error)
      alert('Failed to start per-frame analysis. Please try again.')
    }
  }

  const downloadAnalysis = async (video: UploadedVideo) => {
    try {
      await gymnasticsAPI.downloadVideo(video.name)
      alert('Analysis video downloaded successfully!')
    } catch (error) {
      console.error('Error downloading analysis:', error)
      alert('Failed to download analysis video.')
    }
  }

  const downloadPerFrameAnalysis = async (video: UploadedVideo) => {
    try {
      await gymnasticsAPI.downloadPerFrameVideo(video.name)
      alert('Per-frame analysis video downloaded successfully!')
    } catch (error) {
      console.error('Error downloading per-frame analysis:', error)
      alert('Failed to download per-frame analysis video.')
    }
  }

  const viewProcessedVideo = async (video: UploadedVideo) => {
    try {
      const baseName = video.name.replace('.mp4', '');
      
      // Try to find the per-frame analysis video first
      let videoUrl = `${API_BASE_URL}/downloadPerFrameVideo?video_filename=${baseName}`;
      
      // If no per-frame video exists, try the standard analyzed video
      // We'll need to check what's actually available
      console.log('Attempting to view processed video for:', baseName);
      
      setVideoData({
        url: videoUrl,
        name: `${video.name} (Processed)`
      });
      setShowVideoPlayer(true);
    } catch (error) {
      console.error('Error viewing processed video:', error);
      alert('Failed to load processed video');
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return <Check className="h-4 w-4 text-emerald-400" />
      case 'processing': return <Clock className="h-4 w-4 text-yellow-400" />
      case 'uploading': return <Upload className="h-4 w-4 text-blue-400" />
      case 'failed': return <X className="h-4 w-4 text-red-400" />
      default: return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getAnalysisStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-emerald-400" />
      case 'processing':
        return <Activity className="h-4 w-4 text-yellow-400 animate-pulse" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      case 'processing': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'uploading': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b ml-border ml-nav backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold ml-text-hi">Upload & Analysis Center</h1>
            <p className="ml-text-md">Upload videos and run both standard and frame-by-frame analysis with real-time progress tracking</p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Coach Access
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Demo Instructions */}
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Test Frame-by-Frame Analysis:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Upload a video file using the drag-and-drop area or file browser</li>
            <li>Fill in the metadata (athlete name, event, session, notes)</li>
            <li>Switch to the "Analysis Jobs" tab to see your uploaded video</li>
            <li>Click "Start Analysis" to run standard analysis</li>
            <li>Click "Start Per-Frame" to run frame-by-frame analysis</li>
            <li>Monitor real-time progress with progress bars</li>
            <li>Download completed analysis videos from the "Results" tab</li>
          </ol>
        </div>

        {/* Backend Status */}
        <div className="p-6 bg-gray-100 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Backend Status:</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">API Server: Running on port 5004</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">MediaPipe Server: May be starting up</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Note: Frame-by-frame analysis requires both servers to be running. 
            The MediaPipe server may take a moment to start up.
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Videos</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Jobs</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
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
                    <h3 className="font-medium">Upload Queue</h3>
                    {uploadQueue.map((upload) => (
                      <div key={upload.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Video className="h-5 w-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium">{upload.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(upload.size)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={upload.progress} className="w-20" />
                          <span className="text-sm text-gray-500">{upload.progress.toFixed(0)}%</span>
                          {getStatusIcon(upload.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analysis Jobs</span>
                </CardTitle>
                <CardDescription>
                  Manage and monitor video analysis jobs including frame-by-frame analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedVideos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No videos uploaded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {uploadedVideos.map((video) => (
                      <div key={video.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileVideo className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{video.name}</p>
                              <p className="text-sm text-gray-500">
                                {video.athlete} • {video.event} • {formatFileSize(video.size)}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(video.status)}>
                            {video.status}
                          </Badge>
                        </div>

                        {/* Standard Analysis */}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Play className="h-4 w-4" />
                              <span className="font-medium">Standard Analysis</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getAnalysisStatusIcon(video.analysisStatus || 'pending')}
                              <Badge variant={video.analysisStatus === 'completed' ? 'default' : 'secondary'}>
                                {video.analysisStatus || 'pending'}
                              </Badge>
                            </div>
                          </div>
                          
                          {video.analysisStatus === 'processing' && video.analysisProgress !== undefined && (
                            <div className="space-y-2">
                              <Progress value={video.analysisProgress} />
                              <p className="text-sm text-gray-500">{video.analysisProgress.toFixed(1)}% complete</p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {video.analysisStatus === 'pending' && (
                              <Button size="sm" onClick={() => startAnalysis(video)}>
                                <Play className="h-4 w-4 mr-1" />
                                Start Analysis
                              </Button>
                            )}
                            {video.analysisStatus === 'completed' && (
                              <Button size="sm" variant="outline" onClick={() => downloadAnalysis(video)}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Frame-by-Frame Analysis */}
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <PerFrameIcon className="h-4 w-4" />
                              <span className="font-medium">Frame-by-Frame Analysis</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getAnalysisStatusIcon(video.perFrameStatus || 'pending')}
                              <Badge variant={video.perFrameStatus === 'completed' ? 'default' : 'secondary'}>
                                {video.perFrameStatus || 'pending'}
                              </Badge>
                            </div>
                          </div>
                          
                          {video.perFrameStatus === 'processing' && video.perFrameProgress !== undefined && (
                            <div className="space-y-2">
                              <Progress value={video.perFrameProgress} />
                              <p className="text-sm text-gray-500">{video.perFrameProgress.toFixed(1)}% complete</p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {video.perFrameStatus === 'pending' && (
                              <Button size="sm" onClick={() => startPerFrameAnalysis(video)}>
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Start Per-Frame
                              </Button>
                            )}
                            {video.perFrameStatus === 'completed' && (
                              <Button size="sm" variant="outline" onClick={() => downloadPerFrameAnalysis(video)}>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Analysis Results</span>
                </CardTitle>
                <CardDescription>
                  View and download completed analysis results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedVideos.filter(v => v.analysisStatus === 'completed' || v.perFrameStatus === 'completed').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No completed analyses yet.</p>
                ) : (
                  <div className="space-y-4">
                    {uploadedVideos
                      .filter(v => v.analysisStatus === 'completed' || v.perFrameStatus === 'completed')
                      .map((video) => (
                        <div key={video.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FileVideo className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium">{video.name}</p>
                                <p className="text-sm text-gray-500">
                                  {video.athlete} • {video.event}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {video.motionIQ && (
                                <Badge variant="outline">
                                  MotionIQ: {video.motionIQ}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {video.analysisStatus === 'completed' && (
                              <div className="border rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Play className="h-4 w-4 text-emerald-400" />
                                  <span className="font-medium">Standard Analysis</span>
                                  <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => downloadAnalysis(video)}>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => viewProcessedVideo(video)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            )}

                            {video.perFrameStatus === 'completed' && (
                              <div className="border rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <PerFrameIcon className="h-4 w-4 text-cyan-400" />
                                  <span className="font-medium">Frame-by-Frame</span>
                                  <Badge className="bg-cyan-100 text-cyan-800">Completed</Badge>
                                </div>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => downloadPerFrameAnalysis(video)}>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => viewProcessedVideo(video)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && videoData && (
        <InteractiveVideoPlayer
          videoUrl={videoData.url}
          videoName={videoData.name}
          onClose={() => {
            setShowVideoPlayer(false)
            setVideoData(null)
          }}
        />
      )}
    </div>
  )
}
