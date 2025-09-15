# Thumbnail Video Implementation

This document describes the implementation of thumbnail videos with 3-4 second replay functionality and session history in the gymnastics analytics application.

## Overview

The thumbnail video system provides:
- **3-4 second auto-replay** functionality for quick video previews
- **Session history** with thumbnail previews
- **Performance optimization** with lazy loading and caching
- **Interactive controls** for play/pause, mute, and restart
- **Metadata display** showing session information, Motion IQ scores, and ACL risk levels

## Components

### 1. ThumbnailVideoReplay.tsx
The main component for displaying thumbnail videos with replay functionality.

**Features:**
- Auto-replay for 3-4 seconds on hover
- Play/pause controls
- Mute/unmute functionality
- Progress bar showing replay progress
- Session metadata display
- Risk level and Motion IQ badges
- Replay counter

**Props:**
```typescript
interface ThumbnailVideoReplayProps {
  session: SessionMetadata
  onViewFullVideo?: (session: SessionMetadata) => void
  onViewAnalytics?: (session: SessionMetadata) => void
  compact?: boolean
  autoPlay?: boolean
  showMetadata?: boolean
  replayDuration?: number // Default: 4 seconds
}
```

### 2. OptimizedThumbnailVideoReplay.tsx
Performance-optimized version with lazy loading and memory management.

**Additional Features:**
- **Lazy loading** - Videos only load when they come into view
- **Thumbnail caching** - Generated thumbnails are cached to avoid regeneration
- **Memory management** - Automatic cleanup of video resources
- **Intersection Observer** - Efficient viewport detection
- **Thumbnail placeholders** - Show static thumbnails while videos load

**Additional Props:**
```typescript
interface OptimizedThumbnailVideoReplayProps extends ThumbnailVideoReplayProps {
  lazyLoad?: boolean
  preloadThumbnail?: boolean
}
```

### 3. VideoThumbnailGenerator.tsx
Utility component for generating video thumbnails.

**Features:**
- Generate thumbnails from video URLs
- Configurable capture time and size
- Download functionality
- Caching system
- Progress tracking

**Key Functions:**
```typescript
// Generate thumbnail from video URL
generateVideoThumbnail(
  videoUrl: string,
  captureTime: number = 2,
  thumbnailSize: { width: number; height: number } = { width: 320, height: 180 }
): Promise<Blob | null>

// Thumbnail cache management
class ThumbnailCache {
  set(key: string, thumbnailUrl: string)
  get(key: string): string | undefined
  has(key: string): boolean
  clear()
}
```

### 4. EnhancedSessionDashboard.tsx
Enhanced session dashboard with thumbnail video integration.

**Features:**
- **Grid and List views** - Toggle between thumbnail grid and detailed list
- **Advanced filtering** - Filter by athlete, event, status, and search terms
- **Session statistics** - Overview cards with key metrics
- **Thumbnail previews** - Quick video previews in grid view
- **Full video player** - Click to view complete videos with analytics

## Usage

### Basic Implementation
```tsx
import ThumbnailVideoReplay from '@/components/ThumbnailVideoReplay'

<ThumbnailVideoReplay
  session={sessionData}
  onViewFullVideo={handleViewFullVideo}
  onViewAnalytics={handleViewAnalytics}
  compact={true}
  autoPlay={true}
  replayDuration={4}
/>
```

### Optimized Implementation
```tsx
import OptimizedThumbnailVideoReplay from '@/components/OptimizedThumbnailVideoReplay'

<OptimizedThumbnailVideoReplay
  session={sessionData}
  onViewFullVideo={handleViewFullVideo}
  onViewAnalytics={handleViewAnalytics}
  compact={true}
  autoPlay={true}
  replayDuration={4}
  lazyLoad={true}
  preloadThumbnail={true}
/>
```

### Session Dashboard Integration
```tsx
import EnhancedSessionDashboard from '@/components/EnhancedSessionDashboard'

<EnhancedSessionDashboard />
```

## Performance Optimizations

### 1. Lazy Loading
- Videos only load when they enter the viewport
- Uses Intersection Observer API for efficient detection
- Configurable root margin for preloading

### 2. Thumbnail Caching
- Generated thumbnails are cached in memory
- Prevents regeneration of the same thumbnails
- Automatic cleanup of old cache entries
- Configurable cache size limit

### 3. Memory Management
- Automatic cleanup of video resources on unmount
- URL.revokeObjectURL() for blob cleanup
- Video element disposal to prevent memory leaks

### 4. Thumbnail Placeholders
- Static thumbnails shown while videos load
- Reduces perceived loading time
- Fallback for slow network connections

## Configuration

### Replay Duration
Default replay duration is 4 seconds, but can be customized:
```tsx
<ThumbnailVideoReplay replayDuration={3} />
```

### Thumbnail Size
Thumbnail generation size can be configured:
```tsx
generateVideoThumbnail(videoUrl, 2, { width: 480, height: 270 })
```

### Cache Settings
Thumbnail cache can be configured:
```typescript
const thumbnailCache = new ThumbnailCache()
thumbnailCache.maxSize = 50 // Limit to 50 cached thumbnails
```

## Session Metadata

Each session includes comprehensive metadata:

```typescript
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
```

## Styling

The components use Tailwind CSS with a dark theme:
- **Background**: `bg-slate-900/50` with backdrop blur
- **Borders**: `border-slate-800`
- **Text**: White text with slate variants for secondary text
- **Accents**: Cyan colors for highlights and progress bars
- **Risk levels**: Green (LOW), Yellow (MODERATE), Red (HIGH)

## Browser Compatibility

- **Modern browsers** with Intersection Observer support
- **Video formats**: MP4 with H.264 codec
- **Canvas API** for thumbnail generation
- **Blob API** for thumbnail caching

## Future Enhancements

1. **WebP thumbnails** for better compression
2. **Progressive loading** with multiple quality levels
3. **Video analytics** integration with thumbnail previews
4. **Batch thumbnail generation** for multiple videos
5. **Custom replay durations** per session type
6. **Keyboard shortcuts** for video controls
7. **Fullscreen thumbnail mode**

## Troubleshooting

### Common Issues

1. **Videos not loading**
   - Check video URL accessibility
   - Verify CORS settings
   - Ensure video format compatibility

2. **Thumbnails not generating**
   - Check canvas API support
   - Verify video metadata loading
   - Check for CORS issues with video sources

3. **Performance issues**
   - Enable lazy loading
   - Reduce thumbnail cache size
   - Use optimized component version

4. **Memory leaks**
   - Ensure proper cleanup on unmount
   - Check for URL.revokeObjectURL() calls
   - Monitor video element disposal

### Debug Mode

Enable debug logging by setting:
```typescript
const DEBUG_THUMBNAILS = true
```

This will log thumbnail generation, caching, and loading events to the console.


