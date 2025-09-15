# Gymnastics Analytics API Integration

This document describes the integration of the Gymnastics Analytics Backend API with the frontend application.

## Overview

The frontend now includes a comprehensive API integration that connects to the Gymnastics Analytics Backend Server running on port 5004. This integration provides real-time video analysis, ACL risk assessment, and video processing capabilities.

## Features

### 🔗 **API Integration**
- **Health Monitoring**: Real-time server status checking
- **Video Management**: List and manage available videos
- **Analysis Processing**: Standard and per-frame video analysis
- **ACL Risk Assessment**: Comprehensive injury risk analysis
- **Statistics Dashboard**: Summary statistics and metrics
- **Video Downloads**: Download processed videos with overlays

### 📊 **Key Functionality**
1. **Video Analysis**
   - Standard analysis with basic metrics
   - Per-frame analysis with detailed analytics
   - Real-time progress tracking
   - Background job processing

2. **ACL Risk Assessment**
   - Knee angle risk calculation
   - Knee valgus detection
   - Landing mechanics analysis
   - Risk level classification (LOW/MODERATE/HIGH)
   - Personalized recommendations

3. **Statistics & Metrics**
   - Total videos processed
   - Frame-by-frame analytics
   - Risk distribution analysis
   - Performance trends

## API Endpoints Integrated

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/getVideoList` | GET | List available videos |
| `/getProcessedVideos` | GET | List processed videos |
| `/analyzeVideo` | POST | Standard video analysis |
| `/analyzeVideoPerFrame` | POST | Per-frame analysis |
| `/getJobStatus` | GET | Check analysis job status |
| `/getStatistics` | GET | Video-specific statistics |
| `/getSummaryStatistics` | GET | Overall statistics |
| `/getACLRiskAnalysis` | GET | ACL risk analysis |
| `/downloadVideo` | GET | Download processed video |
| `/downloadPerFrameVideo` | GET | Download per-frame video |

## Components

### 1. **API Client** (`src/lib/api.ts`)
- TypeScript interfaces for all API responses
- Centralized API client with error handling
- Download functionality with blob handling
- Job status polling with progress updates

### 2. **React Hook** (`src/hooks/useGymnasticsAPI.ts`)
- Custom hook for API state management
- Loading states and error handling
- Automatic data refresh
- Job polling and progress tracking

### 3. **Integration Component** (`src/components/GymnasticsAPIIntegration.tsx`)
- Complete UI for all API functionality
- Tabbed interface for different features
- Real-time progress indicators
- Error handling and user feedback

## Usage

### Basic Setup

1. **Environment Configuration**
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:5004
   ```

2. **Start the Backend Server**
   ```bash
   cd gymnasticsapp
   python backend/gymnastics_api_server.py
   ```

3. **Start the Frontend**
   ```bash
   cd New-Project/gymnastics-analytics
   npm run dev
   ```

### Using the API Integration

1. **Access the Demo Page**
   - Navigate to `/api-demo` to see the full integration
   - Or use the component in your existing pages

2. **Video Analysis Workflow**
   - Select a video from the available list
   - Choose analysis type (standard or per-frame)
   - Monitor progress in real-time
   - Download results when complete

3. **ACL Risk Assessment**
   - Select a video for analysis
   - View detailed risk factors
   - Get personalized recommendations
   - Monitor risk trends

## API Response Examples

### Health Check
```json
{
  "status": "healthy",
  "mediapipe_server": "running",
  "timestamp": "2025-08-26T17:09:50.155719"
}
```

### ACL Risk Analysis
```json
{
  "success": true,
  "video_filename": "example.mp4",
  "risk_factors": {
    "knee_angle_risk": 25.5,
    "knee_valgus_risk": 15.2,
    "landing_mechanics_risk": 8.7,
    "overall_acl_risk": 16.5,
    "risk_level": "LOW"
  },
  "recommendations": [
    "Good landing mechanics - maintain current form",
    "Monitor knee alignment during landing"
  ]
}
```

### Job Status
```json
{
  "status": "processing",
  "video_filename": "example.mp4",
  "progress": 45.2,
  "start_time": "2025-08-26T17:00:00.000Z",
  "total_frames": 120,
  "frames_processed": 54
}
```

## Error Handling

The integration includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **API Errors**: User-friendly error messages
- **Validation Errors**: Input validation and feedback
- **Timeout Handling**: Graceful timeout management

## Performance Features

- **Real-time Updates**: Live progress tracking
- **Background Processing**: Non-blocking video analysis
- **Caching**: Intelligent data caching
- **Optimistic Updates**: Immediate UI feedback

## Security Considerations

- **CORS Configuration**: Proper cross-origin setup
- **Input Validation**: Server-side validation
- **Error Sanitization**: Safe error message display
- **Rate Limiting**: Respectful API usage

## Troubleshooting

### Common Issues

1. **Server Not Responding**
   - Check if backend server is running on port 5004
   - Verify MediaPipe server is running on port 5001
   - Check firewall settings

2. **CORS Errors**
   - Ensure backend has CORS properly configured
   - Check API URL configuration

3. **Video Not Found**
   - Verify video files exist in the correct directory
   - Check file naming conventions
   - Ensure proper file permissions

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

## Future Enhancements

- **Real-time Video Streaming**: Live analysis capabilities
- **Batch Processing**: Multiple video analysis
- **Advanced Analytics**: Machine learning insights
- **Mobile Support**: Responsive design improvements
- **Offline Mode**: Local processing capabilities

## Support

For issues or questions about the API integration:

1. Check the backend server logs
2. Verify API endpoint responses
3. Review the browser console for errors
4. Test individual API endpoints with curl

## Contributing

To extend the API integration:

1. Add new endpoints to `src/lib/api.ts`
2. Update TypeScript interfaces
3. Extend the React hook in `src/hooks/useGymnasticsAPI.ts`
4. Add UI components as needed
5. Update documentation
