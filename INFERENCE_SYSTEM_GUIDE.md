# 🎯 Inference System Guide

## Overview
This document explains the naming schema, directory structure, and processing flow for the gymnastics video analysis inference system.

## 📁 Directory Structure

```
meshTest/
├── gym_videos/
│   └── videos/                    # Input videos (YouTube-style IDs)
│       ├── pdtyUo5UELk.mp4       # Example: 207KB
│       ├── UgWHozR_LLA.mp4       # Example: 45MB
│       ├── MeLfAr3GY6w.mp4       # Example: 9.1MB
│       ├── FWSpWksgk60.mp4       # Example: 35MB
│       └── 3-gNgU9Z_jU.mp4       # Example: 27MB
├── gymnasticsapp/
│   ├── backend/
│   │   ├── gymnastics_api_server.py  # Main API server (port 5004)
│   │   ├── mediapipe_server.py       # MediaPipe processing (port 5001)
│   │   ├── enhanced_video_replay_with_acl.py
│   │   └── video_overlay_with_analytics_fixed.py
│   ├── output_videos/               # Generated MP4 files
│   │   ├── analyzed_*.mp4          # Standard analysis
│   │   ├── api_generated_*.mp4     # API-generated overlays
│   │   ├── enhanced_replay_*.mp4   # Enhanced replay
│   │   ├── acl_risk_overlay_*.mp4  # ACL risk overlays
│   │   └── fixed_overlayed_*.mp4   # Fixed analytics overlays
│   └── analytics/                   # JSON statistics
│       ├── api_generated_*.json    # API-generated analytics
│       ├── frame_analysis_*.json   # Frame-by-frame analysis
│       └── analytics_*.json        # General analytics
└── New-Project/gymnastics-analytics/
    └── public/videos/              # Frontend video serving
        ├── pdtyUo5UELk.mp4         # Copied from gym_videos
        ├── UgWHozR_LLA.mp4
        └── ...
```

## 🏷️ Naming Schema

### Input Videos
- **Format**: `{video_id}.mp4`
- **Location**: `gym_videos/videos/`
- **Example**: `pdtyUo5UELk.mp4`

### Output MP4 Files (output_videos/)

#### 1. Standard Analysis
```
analyzed_{video_id}_{timestamp}.mp4
Example: analyzed_FWSpWksgk60_1756657716.mp4
```

#### 2. API Generated Overlays
```
api_generated_{video_id}.mp4
Example: api_generated_MeLfAr3GY6w.mp4
```

#### 3. Enhanced Replay
```
enhanced_replay_{video_id}.mp4
Example: enhanced_replay_pdtyUo5UELk.mp4
```

#### 4. ACL Risk Overlays
```
acl_risk_overlay_{video_id}.mp4
Example: acl_risk_overlay_FWSpWksgk60.mp4
```

#### 5. Fixed Analytics Overlays
```
fixed_overlayed_analytics_{video_id}.mp4
Example: fixed_overlayed_analytics_FWSpWksgk60.mp4
```

### JSON Analytics Files (analytics/)

#### 1. API Generated Analytics
```
api_generated_{video_id}.json
Example: api_generated_MeLfAr3GY6w.json
```

#### 2. Frame Analysis with Timestamp
```
frame_analysis_{video_id}_{timestamp}.json
Example: frame_analysis_pdtyUo5UELk_1755896236.json
```

#### 3. General Analytics
```
analytics_{video_id}.json
Example: analytics_FWSpWksgk60.json
```

## 🔄 Processing Flow

### 1. Video Upload
- Videos uploaded to `gym_videos/videos/`
- Video ID extracted from filename

### 2. Analysis Processing
- MediaPipe server processes video frame-by-frame
- Generates pose landmarks and metrics
- Calculates ACL risk assessment
- Creates analytics overlay

### 3. Output Generation
- **MP4**: Overlayed videos saved to `output_videos/`
- **JSON**: Statistics saved to `analytics/`
- **Timestamps**: Added for unique identification

### 4. Frontend Serving
- Videos copied to `public/videos/` for web serving
- Direct URL access: `/videos/{video_id}.mp4`

## 🚀 API Endpoints

### Backend Server (port 5004)
- `POST /analyzeVideo` - Standard video analysis
- `POST /analyzeVideoPerFrame` - Per-frame analysis
- `GET /getProcessedVideos` - List processed videos
- `GET /downloadVideo` - Download processed video
- `GET /downloadPerFrameVideo` - Download per-frame video
- `GET /getPerFrameStatistics` - Get frame statistics

### MediaPipe Server (port 5001)
- `POST /detect-pose` - Process individual frames
- `POST /set-analytics-filename` - Set output filename
- `POST /clear-analytics` - Clear analytics data

## 📊 File Size Examples

### Input Videos
- `pdtyUo5UELk.mp4`: 207KB (small test video)
- `UgWHozR_LLA.mp4`: 45MB (full routine)
- `MeLfAr3GY6w.mp4`: 9.1MB (medium routine)
- `FWSpWksgk60.mp4`: 35MB (full routine)
- `3-gNgU9Z_jU.mp4`: 27MB (full routine)

### Output Files
- **Standard Analysis**: ~50-100MB (with overlays)
- **API Generated**: ~100-200MB (enhanced overlays)
- **JSON Analytics**: ~1-10MB (detailed statistics)

## 🔧 Configuration

### Environment Variables
```bash
MEDIAPIPE_SERVER_URL=http://localhost:5001
VIDEO_PROCESSING_DIR=../gym_videos/videos
OUTPUT_DIR=../output_videos
ANALYTICS_DIR=../analytics
```

### Server Ports
- **Frontend**: 3001 (Next.js)
- **Backend API**: 5004 (Flask)
- **MediaPipe**: 5001 (Flask)

## 🐛 Troubleshooting

### Video Loading Issues
1. Check if video exists in `gym_videos/videos/`
2. Verify video format (MP4)
3. Check file permissions
4. Ensure backend servers are running

### Processing Issues
1. Verify MediaPipe server is running on port 5001
2. Check disk space in output directories
3. Review server logs for errors
4. Ensure video files are not corrupted

### Frontend Issues
1. Check if videos are copied to `public/videos/`
2. Verify Next.js server is running on port 3001
3. Check browser console for CORS errors
4. Ensure video URLs are correct

## 📝 Usage Examples

### Start Backend Servers
```bash
# Start MediaPipe server
cd gymnasticsapp/backend
python mediapipe_server.py

# Start API server
python gymnastics_api_server.py
```

### Process a Video
```bash
# Via API
curl -X POST http://localhost:5004/analyzeVideo \
  -H "Content-Type: application/json" \
  -d '{"video_filename": "pdtyUo5UELk.mp4"}'
```

### Access Processed Video
```bash
# Download processed video
curl http://localhost:5004/downloadVideo?video_filename=pdtyUo5UELk.mp4

# Get analytics
curl http://localhost:5004/getPerFrameStatistics?video_filename=pdtyUo5UELk.mp4
```

## 🎯 Key Features

- **Frame-by-frame analysis** with pose detection
- **ACL risk assessment** with biomechanical analysis
- **Multiple output formats** (MP4 overlays, JSON stats)
- **Real-time processing** with progress tracking
- **Comprehensive analytics** with detailed metrics
- **Web-based interface** for easy access














