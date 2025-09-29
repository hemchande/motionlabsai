'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { StepBack, StepForward, Play, Pause } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Cloudflare Stream API configuration
const CLOUDFLARE_ACCOUNT_ID = 'f2b0714a082195118f53d0b8327f6635'
const CLOUDFLARE_API_TOKEN = 'DEmkpIDn5SLgpjTOoDqYrPivnOpD9gnqbVICwzTQ'
const VIDEO_ID = '0dcb9daa132905082aa699d4e984c214' // Processed video with analytics overlays

interface FrameData {
  frame_number: number
  timestamp: number
  video_time: number
}

interface FrameAnalytics {
  frame_number: number
  timestamp: number
  acl_risk: number
  knee_angle_left: number
  knee_angle_right: number
  elevation: number
  forward_lean: number
  tumbling_phase: string
  quality_score: number
}

export default function SimpleCloudflarePlayer() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0)
  const [frameData, setFrameData] = useState<FrameData[]>([])
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<FrameAnalytics[]>([])
  const [currentAnalytics, setCurrentAnalytics] = useState<FrameAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false)
  
  // Video frame tracking state
  const [currentVideoFrame, setCurrentVideoFrame] = useState<number>(0)
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)
  const [analyticsFrameIndex, setAnalyticsFrameIndex] = useState<number>(0)
  const [isLiveAnalytics, setIsLiveAnalytics] = useState<boolean>(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  // Debug logging function
  const log = (message: string, type: string = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`[${timestamp}] ${message}`)
  }

  // Track current video frame based on video time
  const updateVideoFrameTracking = () => {
    const video = videoRef.current
    if (video && frameData.length > 0) {
      const currentTime = video.currentTime
      setCurrentVideoTime(currentTime)
      
      // Find the closest frame to current video time
      let closestFrameIndex = 0
      let minTimeDifference = Infinity
      
      for (let i = 0; i < frameData.length; i++) {
        const frame = frameData[i]
        const timeDifference = Math.abs(frame.video_time - currentTime)
        
        if (timeDifference < minTimeDifference) {
          minTimeDifference = timeDifference
          closestFrameIndex = i
        }
      }
      
      // Always update current video frame and analytics when video is playing
      setCurrentVideoFrame(closestFrameIndex)
      
      // Update analytics for the current video frame (always update while playing)
      if (analyticsData.length > closestFrameIndex) {
        setCurrentAnalytics(analyticsData[closestFrameIndex])
        log(`📊 Analytics updated for frame ${closestFrameIndex + 1} (time: ${currentTime.toFixed(3)}s)`)
      }
      
      // Log frame changes for debugging
      if (closestFrameIndex !== currentVideoFrame) {
        log(`🎬 Video frame changed: ${closestFrameIndex + 1} (time: ${currentTime.toFixed(3)}s, frame time: ${frameData[closestFrameIndex]?.video_time?.toFixed(3)}s)`)
      }
    } else {
      log(`❌ Video frame tracking failed: video=${!!video}, frameData.length=${frameData.length}`)
    }
  }

  // Track video time changes to update current video frame
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handleTimeUpdate = () => {
        log(`🎬 Video time update: ${video.currentTime.toFixed(3)}s`)
        updateVideoFrameTracking()
      }
      
      const handleSeeked = () => {
        log(`🎬 Video seeked: ${video.currentTime.toFixed(3)}s`)
        updateVideoFrameTracking()
      }
      
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('seeked', handleSeeked)
      
      // Initial call
      updateVideoFrameTracking()
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('seeked', handleSeeked)
      }
    }
  }, [frameData, analyticsData])

  // Initialize video frame tracking when frame data is loaded
  useEffect(() => {
    if (frameData.length > 0) {
      log(`🎬 Frame data loaded: ${frameData.length} frames`)
      log(`🎬 First frame time: ${frameData[0]?.video_time?.toFixed(3)}s`)
      log(`🎬 Last frame time: ${frameData[frameData.length - 1]?.video_time?.toFixed(3)}s`)
      
      // Initialize video frame tracking
      setTimeout(() => {
        updateVideoFrameTracking()
      }, 100)
    }
  }, [frameData])

  // Load analytics data (same as AutoAnalyzedVideoPlayer)
  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    log('📊 Loading analytics data...')
    
    try {
      // Use the same analytics URL as AutoAnalyzedVideoPlayer
      const analyticsUrl = 'https://gymnasticsapi.onrender.com/getPerFrameStatistics?video_filename=myaNew.mp4'
      const response = await fetch(analyticsUrl)
      
      if (response.ok) {
        const data = await response.json()
        log(`📊 Loaded ${data.length} analytics entries`)
        setAnalyticsData(data)
        setAnalyticsLoading(false)
        
        // Set initial analytics for first frame
        if (data.length > 0) {
          setCurrentAnalytics(data[0])
        }
      } else {
        log('❌ Failed to load analytics, using mock data', 'error')
        // Generate mock analytics data
        generateMockAnalytics()
      }
    } catch (error) {
      log(`❌ Analytics loading error: ${error instanceof Error ? error.message : String(error)}`, 'error')
      // Generate mock analytics data
      generateMockAnalytics()
    }
  }

  // Generate mock analytics data
  const generateMockAnalytics = () => {
    const mockAnalytics: FrameAnalytics[] = []
    for (let i = 0; i < 314; i++) {
      mockAnalytics.push({
        frame_number: i + 1,
        timestamp: i * 0.033,
        acl_risk: Math.random() * 100,
        knee_angle_left: 120 + Math.random() * 60,
        knee_angle_right: 120 + Math.random() * 60,
        elevation: 50 + Math.random() * 100,
        forward_lean: 10 + Math.random() * 20,
        tumbling_phase: ['Approach', 'Takeoff', 'Flight', 'Landing'][Math.floor(Math.random() * 4)],
        quality_score: 60 + Math.random() * 40
      })
    }
    setAnalyticsData(mockAnalytics)
    setCurrentAnalytics(mockAnalytics[0])
    setAnalyticsLoading(false)
    log(`📊 Generated ${mockAnalytics.length} mock analytics entries`)
  }

  // Enable download
  const enableDownload = async () => {
    log(`Enabling download for video ${VIDEO_ID}...`)
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${VIDEO_ID}/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({})
      })

      const data = await response.json()
      log('API Response: ' + JSON.stringify(data, null, 2))

      if (data.success) {
        log('✅ Download enabled successfully!', 'success')
        setDownloadEnabled(true)
        setLoading(false)
        
        // Check download status after enabling
        setTimeout(() => {
          checkDownloadStatus()
        }, 1000)
      } else {
        log('❌ Failed to enable download: ' + JSON.stringify(data.errors), 'error')
        setError('Failed to enable download')
        setLoading(false)
      }
    } catch (error) {
      log(`❌ Network Error: ${error instanceof Error ? error.message : String(error)}`, 'error')
      setError(`Network Error: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  // Check download status
  const checkDownloadStatus = async () => {
    log(`Checking download status for video ${VIDEO_ID}...`)
    setLoading(true)
    
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${VIDEO_ID}/downloads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        }
      })

      const data = await response.json()
      log('Download Status Response: ' + JSON.stringify(data, null, 2))
      
      if (data.success && data.result) {
        const downloads = data.result
        if (downloads.default) {
          const url = downloads.default.url
          setDownloadUrl(url)
          log(`✅ Download URL found: ${url}`, 'success')
          
          // Load video
          loadVideo()
        } else {
          log('⚠️ No download URL available yet', 'warning')
          setLoading(false)
        }
      } else {
        log('❌ Failed to check download status', 'error')
        setError('Failed to check download status')
        setLoading(false)
      }
    } catch (error) {
      log(`❌ Network Error: ${error instanceof Error ? error.message : String(error)}`, 'error')
      setError(`Network Error: ${error instanceof Error ? error.message : String(error)}`)
      setLoading(false)
    }
  }

  // Load video with download URL (exact same as HTML file)
  const loadVideo = () => {
    if (downloadUrl) {
      log(`Loading video with download URL: ${downloadUrl}`)
      
      const video = videoRef.current
      
      if (video) {
        // Check if source element exists, if not create it
        let videoSource = document.getElementById('videoSource') as HTMLSourceElement
        if (!videoSource) {
          videoSource = document.createElement('source')
          videoSource.id = 'videoSource'
          videoSource.type = 'video/mp4'
          video.appendChild(videoSource)
          log('🎬 Created new source element in loadVideo')
        }
        // Add event listeners for debugging
        video.addEventListener('loadstart', () => {
          log('🎬 Video load started')
        })
        
        video.addEventListener('loadedmetadata', () => {
          log(`🎬 Video metadata loaded - Duration: ${video.duration}s, Size: ${video.videoWidth}x${video.videoHeight}`)
        })
        
        video.addEventListener('loadeddata', () => {
          log('🎬 Video data loaded - ready to play')
          setLoading(false)
        })
        
        video.addEventListener('canplay', () => {
          log('🎬 Video can start playing')
        })
        
        video.addEventListener('error', (e) => {
          const target = e.currentTarget as HTMLVideoElement
          const error = target?.error
          log(`❌ Video error: ${error?.code} - ${error?.message}`, 'error')
          setError(`Video error: ${error?.message}`)
          setLoading(false)
        })
        
        video.addEventListener('stalled', () => {
          log('⚠️ Video stalled - network issue?', 'warning')
        })
        
        // Test if the download URL is accessible
        log('🔍 Testing download URL accessibility...')
        fetch(downloadUrl, { method: 'HEAD' })
          .then(response => {
            log(`🔍 Download URL test: ${response.status} ${response.statusText}`)
            log(`🔍 Content-Type: ${response.headers.get('content-type')}`)
            log(`🔍 Content-Length: ${response.headers.get('content-length')}`)
            
            if (response.ok) {
              // Set the source and load (exact same as HTML file)
              videoSource.src = downloadUrl
              video.load()
            } else {
              log(`❌ Download URL not accessible: ${response.status}`, 'error')
              setError(`Download URL not accessible: ${response.status}`)
              setLoading(false)
            }
          })
        .catch((error: Error) => {
          log(`❌ Download URL test failed: ${error.message}`, 'error')
          setError(`Download URL test failed: ${error.message}`)
          setLoading(false)
        })
        
        // Generate mock frame data and load analytics
        generateFrameData()
        loadAnalytics()
      } else {
        log('❌ Video element not found', 'error')
        setError('Video element not found')
        setLoading(false)
      }
    } else {
      log('❌ No download URL available', 'error')
      setError('No download URL available')
      setLoading(false)
    }
  }

  // Generate mock frame data (same as HTML file)
  const generateFrameData = () => {
    const frames: FrameData[] = []
    for (let i = 0; i < 314; i++) {
      frames.push({
        frame_number: i + 1,
        timestamp: i * 0.033, // ~30 FPS
        video_time: i * 0.033
      })
    }
    setFrameData(frames)
    log(`Generated ${frames.length} frame data points`)
    updateFrameDisplay()
  }

  // Video frame navigation (seeks video to specific frame)
  const goToNextVideoFrame = () => {
    if (currentFrameIndex < frameData.length - 1) {
      const newFrameIndex = currentFrameIndex + 1
      setCurrentFrameIndex(newFrameIndex)
      seekToFrameTime()
      updateFrameDisplay()
      log(`🎬 Video frame: ${newFrameIndex + 1}`)
    }
  }

  const goToPreviousVideoFrame = () => {
    if (currentFrameIndex > 0) {
      const newFrameIndex = currentFrameIndex - 1
      setCurrentFrameIndex(newFrameIndex)
      seekToFrameTime()
      updateFrameDisplay()
      log(`🎬 Video frame: ${newFrameIndex + 1}`)
    }
  }

  // Analytics frame navigation (changes which analytics are displayed)
  const goToNextAnalyticsFrame = () => {
    if (analyticsFrameIndex < analyticsData.length - 1) {
      const newAnalyticsIndex = analyticsFrameIndex + 1
      setAnalyticsFrameIndex(newAnalyticsIndex)
      updateAnalytics(newAnalyticsIndex)
      log(`📊 Analytics frame: ${newAnalyticsIndex + 1}`)
    }
  }

  const goToPreviousAnalyticsFrame = () => {
    if (analyticsFrameIndex > 0) {
      const newAnalyticsIndex = analyticsFrameIndex - 1
      setAnalyticsFrameIndex(newAnalyticsIndex)
      updateAnalytics(newAnalyticsIndex)
      log(`📊 Analytics frame: ${newAnalyticsIndex + 1}`)
    }
  }

  // Legacy function for backward compatibility
  const goToNextFrame = goToNextVideoFrame
  const goToPreviousFrame = goToPreviousVideoFrame

  // Update analytics for current frame
  const updateAnalytics = (frameIndex: number) => {
    if (analyticsData.length > frameIndex) {
      const analytics = analyticsData[frameIndex]
      setCurrentAnalytics(analytics)
      log(`📊 Updated analytics for frame ${frameIndex + 1}: ACL Risk: ${analytics.acl_risk.toFixed(1)}%, Quality: ${analytics.quality_score.toFixed(1)}%`)
    }
  }

  const seekToFrameTime = () => {
    const video = videoRef.current
    const frame = frameData[currentFrameIndex]
    if (video && frame) {
      log(`Seeking to frame ${frame.frame_number} at time ${frame.video_time}s`)
      video.currentTime = frame.video_time
    }
  }

  const updateFrameDisplay = () => {
    const frame = frameData[currentFrameIndex]
    if (frame) {
      // Update display elements if they exist
      const currentFrameElement = document.getElementById('currentFrame')
      const videoTimeElement = document.getElementById('videoTime')
      
      if (currentFrameElement) {
        currentFrameElement.textContent = frame.frame_number.toString()
      }
      if (videoTimeElement) {
        videoTimeElement.textContent = frame.video_time.toFixed(3) + 's'
      }
    }
  }

  const togglePlayPause = () => {
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        video.play()
        setIsPlaying(true)
        log('Video playing')
      } else {
        video.pause()
        setIsPlaying(false)
        log('Video paused')
      }
    }
  }

  // Try direct video load (same as HTML file)
  const tryDirectVideo = () => {
    if (!downloadUrl) {
      log('❌ No download URL available', 'error')
      return
    }
    
    log('🎬 Trying direct video load...')
    const video = videoRef.current
    
    if (video) {
      // Remove crossorigin attribute (same as HTML file)
      video.removeAttribute('crossorigin')
      
      // Check if source element exists, if not create it
      let videoSource = document.getElementById('videoSource') as HTMLSourceElement
      if (!videoSource) {
        videoSource = document.createElement('source')
        videoSource.id = 'videoSource'
        videoSource.type = 'video/mp4'
        video.appendChild(videoSource)
        log('🎬 Created new source element')
      }
      
      videoSource.src = downloadUrl
      video.load()
      log('🎬 Direct video load attempted')
    } else {
      log('❌ Video element not found', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">🎬 Simple Cloudflare Player</h1>
      <p className="mb-6">Exact same functionality as enable_download_test.html</p>
      
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex space-x-4">
          <Button 
            onClick={enableDownload}
            disabled={loading || downloadEnabled}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {downloadEnabled ? 'Download Enabled' : 'Enable Download'}
          </Button>
          
          {downloadEnabled && (
            <Button 
              onClick={checkDownloadStatus}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              Check Download Status
            </Button>
          )}
          
          {downloadUrl && (
            <Button 
              onClick={tryDirectVideo}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Try Direct Video Load
            </Button>
          )}
          
          <Button 
            onClick={loadAnalytics}
            disabled={analyticsLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {analyticsLoading ? 'Loading Analytics...' : 'Load Analytics'}
          </Button>
          
          <Button 
            onClick={() => {
              log('🔧 Manual video frame tracking test')
              updateVideoFrameTracking()
            }}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Test Frame Tracking
          </Button>
        </div>
        
        {/* Status */}
        {loading && <p className="text-yellow-400">Loading...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}
        {downloadUrl && <p className="text-green-400">Download URL: {downloadUrl}</p>}
        
        {/* Debug Info */}
        <div className="bg-gray-800 p-3 rounded-lg mt-4">
          <h4 className="text-sm font-semibold text-white mb-2">🔧 Debug Info</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <p>Video Element: {videoRef.current ? '✅ Available' : '❌ Not Available'}</p>
            <p>Video Current Time: {videoRef.current?.currentTime?.toFixed(3) || 'N/A'}s</p>
            <p>Frame Data Length: {frameData.length}</p>
            <p>Current Video Frame: {currentVideoFrame + 1}</p>
            <p>Current Video Time State: {currentVideoTime.toFixed(3)}s</p>
            {frameData.length > 0 && (
              <>
                <p>First Frame Time: {frameData[0]?.video_time?.toFixed(3)}s</p>
                <p>Last Frame Time: {frameData[frameData.length - 1]?.video_time?.toFixed(3)}s</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Player */}
      <div className="mb-6">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video 
            ref={videoRef}
            id="video"
            controls 
            width="100%" 
            height="400" 
            style={{ background: 'black' }}
            crossOrigin="anonymous"
            preload="metadata"
          >
            {downloadUrl && <source src={downloadUrl} type="video/mp4" id="videoSource" />}
            Your browser does not support the video tag.
          </video>
          
          {/* Current Video Frame Indicator Overlay */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg border-2 border-green-400">
            <div className="text-sm font-bold">
              🎬 Video Frame: {currentVideoFrame + 1} / {frameData.length}
            </div>
            <div className="text-xs text-green-300">
              Time: {currentVideoTime.toFixed(3)}s
            </div>
          </div>
          
          {/* Manual Frame Indicator Overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg border-2 border-blue-400">
            <div className="text-sm font-bold">
              🎯 Manual Frame: {currentFrameIndex + 1} / {frameData.length}
            </div>
            <div className="text-xs text-blue-300">
              Time: {frameData[currentFrameIndex]?.video_time?.toFixed(3) || '0.000'}s
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Frame Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Video Frame Navigation</h3>
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            onClick={goToPreviousVideoFrame}
            disabled={currentFrameIndex <= 0}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            <StepBack className="h-4 w-4 mr-2" />
            Previous Video Frame
          </Button>
          
          <Button 
            onClick={goToNextVideoFrame}
            disabled={currentFrameIndex >= frameData.length - 1}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            Next Video Frame
            <StepForward className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            onClick={togglePlayPause}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
        
        {/* Video Frame Info */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h4 className="text-md font-semibold mb-3 text-white">📊 Frame Status</h4>
          
          {/* Current Video Frame Status - Most Prominent */}
          <div className="bg-green-900 bg-opacity-50 border-2 border-green-400 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-green-300">
                  🎬 CURRENT VIDEO FRAME: {currentVideoFrame + 1} / {frameData.length}
                </div>
                <div className="text-sm text-green-200">
                  Video Time: {currentVideoTime.toFixed(3)}s
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-200">
                  Frame Time: {frameData[currentVideoFrame]?.video_time?.toFixed(3) || '0.000'}s
                </div>
                <div className="text-xs text-green-300">
                  {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Manual Frame Status */}
          <div className="bg-blue-900 bg-opacity-50 border-2 border-blue-400 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-300">
                  🎯 MANUAL FRAME: {currentFrameIndex + 1} / {frameData.length}
                </div>
                <div className="text-sm text-blue-200">
                  Frame Time: {frameData[currentFrameIndex]?.video_time?.toFixed(3) || '0.000'}s
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-200">
                  Difference: {Math.abs((currentVideoFrame - currentFrameIndex))} frames
                </div>
                <div className="text-xs text-blue-300">
                  {currentVideoFrame === currentFrameIndex ? '✅ Synced' : '⚠️ Different'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Frame Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Frame Progress</span>
              <span>{currentVideoFrame + 1} / {frameData.length}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-400 h-3 rounded-full transition-all duration-200"
                style={{ width: `${((currentVideoFrame + 1) / frameData.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>{frameData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Frame Controls */}
      {analyticsData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-white">Analytics Frame Navigation</h3>
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              onClick={goToPreviousAnalyticsFrame}
              disabled={analyticsFrameIndex <= 0}
              variant="outline"
              className="text-white border-orange-500 hover:bg-orange-500 hover:text-black"
            >
              <StepBack className="h-4 w-4 mr-2" />
              Previous Analytics
            </Button>
            
            <Button 
              onClick={goToNextAnalyticsFrame}
              disabled={analyticsFrameIndex >= analyticsData.length - 1}
              variant="outline"
              className="text-white border-orange-500 hover:bg-orange-500 hover:text-black"
            >
              Next Analytics
              <StepForward className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          {/* Analytics Frame Info */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-2 text-white">Analytics Frame Display</h4>
            <p><strong>Analytics Frame:</strong> {analyticsFrameIndex + 1} / {analyticsData.length}</p>
            <p><strong>Frame Number:</strong> {currentAnalytics?.frame_number || 'N/A'}</p>
          </div>
        </div>
      )}
      
      {/* Analytics Display */}
      {currentAnalytics && (
        <div className="mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                📊 Frame Analytics (Frame {currentAnalytics.frame_number})
              </CardTitle>
              <p className="text-sm text-gray-400">
                Analytics Frame: {analyticsFrameIndex + 1} / {analyticsData.length}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACL Risk */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">ACL Risk</span>
                    <Badge variant={currentAnalytics.acl_risk > 70 ? "destructive" : currentAnalytics.acl_risk > 40 ? "secondary" : "default"}>
                      {currentAnalytics.acl_risk.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={currentAnalytics.acl_risk} className="h-2" />
                </div>
                
                {/* Quality Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Quality Score</span>
                    <Badge variant={currentAnalytics.quality_score > 80 ? "default" : currentAnalytics.quality_score > 60 ? "secondary" : "destructive"}>
                      {currentAnalytics.quality_score.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={currentAnalytics.quality_score} className="h-2" />
                </div>
                
                {/* Knee Angles */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Knee Angles</span>
                  <div className="flex justify-between text-sm">
                    <span>Left: {currentAnalytics.knee_angle_left.toFixed(1)}°</span>
                    <span>Right: {currentAnalytics.knee_angle_right.toFixed(1)}°</span>
                  </div>
                </div>
                
                {/* Tumbling Phase */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Tumbling Phase</span>
                  <Badge variant="outline" className="text-white border-white">
                    {currentAnalytics.tumbling_phase}
                  </Badge>
                </div>
                
                {/* Elevation & Forward Lean */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Elevation</span>
                  <div className="text-sm text-gray-300">{currentAnalytics.elevation.toFixed(1)} cm</div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-300">Forward Lean</span>
                  <div className="text-sm text-gray-300">{currentAnalytics.forward_lean.toFixed(1)}°</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Debug Log */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug Log</h3>
        <p className="text-sm text-gray-300">Check browser console for detailed logs</p>
      </div>
    </div>
  )
}
