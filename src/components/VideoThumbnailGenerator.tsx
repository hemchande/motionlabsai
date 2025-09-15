"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Download, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"

interface VideoThumbnailGeneratorProps {
  videoUrl: string
  videoName: string
  onThumbnailGenerated?: (thumbnailBlob: Blob) => void
  thumbnailSize?: { width: number; height: number }
  captureTime?: number // Time in seconds to capture thumbnail
}

export default function VideoThumbnailGenerator({
  videoUrl,
  videoName,
  onThumbnailGenerated,
  thumbnailSize = { width: 320, height: 180 },
  captureTime = 2
}: VideoThumbnailGeneratorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  const generateThumbnail = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setIsGenerating(true)
      setError(null)
      setProgress(0)

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size
      canvas.width = thumbnailSize.width
      canvas.height = thumbnailSize.height

      // Set video time to capture point
      video.currentTime = captureTime
      setProgress(25)

      // Wait for video to seek to the specified time
      await new Promise((resolve) => {
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked)
          resolve(void 0)
        }
        video.addEventListener('seeked', handleSeeked)
      })

      setProgress(50)

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, thumbnailSize.width, thumbnailSize.height)
      setProgress(75)

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          }
        }, 'image/jpeg', 0.8)
      })

      setProgress(100)

      // Create URL for the thumbnail
      const url = URL.createObjectURL(blob)
      setThumbnailUrl(url)

      // Call callback if provided
      onThumbnailGenerated?.(blob)

      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 10000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail')
      console.error('Error generating thumbnail:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadThumbnail = () => {
    if (!thumbnailUrl) return

    const link = document.createElement('a')
    link.href = thumbnailUrl
    link.download = `${videoName.replace(/\.mp4$/, '')}_thumbnail.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleVideoLoaded = () => {
    setVideoLoaded(true)
    setError(null)
  }

  const handleVideoError = () => {
    setError('Failed to load video')
    setVideoLoaded(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Thumbnail Generator</h3>
          <Camera className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Hidden video element for thumbnail generation */}
        <video
          ref={videoRef}
          className="hidden"
          preload="metadata"
          onLoadedMetadata={handleVideoLoaded}
          onError={handleVideoError}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>

        {/* Hidden canvas for thumbnail generation */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Video Info */}
        <div className="text-sm text-muted-foreground">
          <p><strong>Video:</strong> {videoName}</p>
          <p><strong>Capture Time:</strong> {captureTime}s</p>
          <p><strong>Size:</strong> {thumbnailSize.width}x{thumbnailSize.height}</p>
        </div>

        {/* Status */}
        {!videoLoaded && !error && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading video...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {videoLoaded && !error && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Video loaded successfully</span>
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Generating thumbnail...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Thumbnail:</p>
            <div className="relative">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-auto rounded border"
                style={{ maxHeight: '200px' }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={generateThumbnail}
            disabled={!videoLoaded || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Generate Thumbnail
              </>
            )}
          </Button>

          {thumbnailUrl && (
            <Button
              variant="outline"
              onClick={downloadThumbnail}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function to generate thumbnail from video URL
export const generateVideoThumbnail = async (
  videoUrl: string,
  captureTime: number = 2,
  thumbnailSize: { width: number; height: number } = { width: 320, height: 180 }
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(null)
      return
    }

    video.crossOrigin = 'anonymous'
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      canvas.width = thumbnailSize.width
      canvas.height = thumbnailSize.height
      video.currentTime = captureTime
    }

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, thumbnailSize.width, thumbnailSize.height)
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.8)
    }

    video.onerror = () => {
      resolve(null)
    }

    video.src = videoUrl
  })
}

// Utility function to cache thumbnails
export class ThumbnailCache {
  private cache = new Map<string, string>()
  private maxSize = 100

  set(key: string, thumbnailUrl: string) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        URL.revokeObjectURL(this.cache.get(firstKey)!)
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, thumbnailUrl)
  }

  get(key: string): string | undefined {
    return this.cache.get(key)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  clear() {
    for (const url of this.cache.values()) {
      URL.revokeObjectURL(url)
    }
    this.cache.clear()
  }
}

// Global thumbnail cache instance
export const thumbnailCache = new ThumbnailCache()


