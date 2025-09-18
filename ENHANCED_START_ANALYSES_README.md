# Enhanced Start Analyses Functionality

## Overview

The gymnastics-analytics application now features a comprehensive start analyses system with advanced background processing capabilities. This system provides real-time job tracking, error handling, retry mechanisms, and a user-friendly interface for monitoring analysis progress.

## Key Features

### 1. Enhanced ProcessingContext
- **Job Management**: Track multiple analysis jobs simultaneously
- **Error Handling**: Automatic retry logic with configurable max retries
- **Progress Tracking**: Real-time progress updates for both standard and per-frame analysis
- **Result Storage**: Store analysis results including analytics files and overlay videos
- **Duration Tracking**: Monitor job execution time

### 2. GlobalProcessingIndicator
- **Bottom-Right Widget**: Always-visible processing status indicator
- **Expandable Interface**: Click to expand and see detailed job information
- **Visual Status Indicators**: Color-coded status badges and progress bars
- **Action Buttons**: Download results, retry failed jobs, clear completed jobs
- **Real-time Updates**: Automatic polling and status updates

### 3. Start Analyses Buttons
- **Standard Analysis**: Basic video analysis with skeleton overlay
- **Per-Frame Analysis**: Advanced frame-by-frame analysis with detailed metrics
- **Integrated Across Dashboards**: Available in UploadCenter, CoachDashboard, and AthleteDashboard
- **Automatic Processing**: Jobs are automatically added to the global processing context

## Components

### ProcessingContext (`src/contexts/ProcessingContext.tsx`)
```typescript
interface ProcessingJob {
  id: string;
  videoName: string;
  type: 'analysis' | 'perFrame';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: {
    analyticsFile?: string;
    overlayVideo?: string;
    totalFrames?: number;
    framesProcessed?: number;
  };
  retryCount?: number;
  maxRetries?: number;
}
```

**Key Methods:**
- `addJob()`: Add new analysis job
- `updateJob()`: Update job status and progress
- `removeJob()`: Remove job from tracking
- `retryJob()`: Retry failed job
- `clearCompletedJobs()`: Remove all completed jobs
- `clearFailedJobs()`: Remove all failed jobs

### GlobalProcessingIndicator (`src/components/GlobalProcessingIndicator.tsx`)
- Fixed position in bottom-right corner
- Expandable/collapsible interface
- Real-time job status updates
- Download buttons for completed jobs
- Retry buttons for failed jobs
- Clear buttons for job cleanup

### ProcessingStatusBadge (`src/components/ProcessingStatusBadge.tsx`)
- Reusable status indicator component
- Color-coded status display
- Progress percentage display
- Type-specific labeling (Standard/Per-Frame)

## Usage

### Starting Analysis Jobs

#### From UploadCenter:
```typescript
const startAnalysis = async (video: UploadedVideo) => {
  const response = await gymnasticsAPI.analyzeVideo(video.name);
  if (response.success) {
    addJob({
      id: response.job_id,
      videoName: video.name,
      type: 'analysis',
      status: 'processing',
      progress: 0,
      maxRetries: 3
    });
  }
};
```

#### From CoachDashboard:
```typescript
const startAnalysis = async (videoFilename: string, videoId?: string) => {
  const analysisJob = await gymnasticsAPI.analyzeVideo(videoFilename);
  if (analysisJob.job_id) {
    addJob({
      id: analysisJob.job_id,
      videoName: videoFilename,
      type: 'analysis',
      status: 'processing',
      progress: 0,
      maxRetries: 3
    });
  }
};
```

### Monitoring Jobs

The GlobalProcessingIndicator automatically appears when jobs are active and provides:

1. **Collapsed View**: Shows summary of active jobs
2. **Expanded View**: Detailed job information with actions
3. **Status Updates**: Real-time progress and status changes
4. **Error Handling**: Clear error messages and retry options

### Job Lifecycle

1. **Job Creation**: Job added to ProcessingContext with 'processing' status
2. **Progress Updates**: Real-time polling updates job progress
3. **Completion**: Job marked as 'completed' with results
4. **Error Handling**: Failed jobs marked as 'failed' with error details
5. **Retry Logic**: Failed jobs can be retried up to maxRetries times
6. **Cleanup**: Completed/failed jobs can be cleared from the system

## API Integration

### Standard Analysis
- **Endpoint**: `/analyzeVideo`
- **Method**: POST
- **Response**: `{ success: boolean, job_id: string, message: string }`
- **Processing Time**: ~3 seconds (simulated)

### Per-Frame Analysis
- **Endpoint**: `/analyzeVideoPerFrame`
- **Method**: POST
- **Response**: `{ success: boolean, job_id: string, message: string }`
- **Processing Time**: Variable (depends on video length)
- **Status Polling**: `/getJobStatus?job_id={jobId}`

## Error Handling

### Automatic Retry Logic
- Jobs automatically retry on failure
- Configurable max retries (default: 3)
- Exponential backoff between retries
- Clear error messages for users

### Common Error Scenarios
1. **API Server Unavailable**: Jobs marked as failed with clear message
2. **MediaPipe Server Down**: Per-frame analysis falls back to standard analysis
3. **Network Issues**: Automatic retry with increasing delays
4. **Job Timeout**: Jobs marked as failed after 30 seconds

## Testing

### ProcessingTestPanel
A comprehensive test component is available for testing the processing system:

```typescript
// Create test jobs
createTestJob('analysis');     // Standard analysis
createTestJob('perFrame');     // Per-frame analysis

// Monitor job status
console.log(activeJobs);       // All active jobs
console.log(isProcessing);     // Processing status
console.log(hasErrors);        // Error status
```

### Test Features
- Create test analysis jobs
- Monitor job statistics
- Test retry functionality
- Clear completed/failed jobs
- Simulate job completion

## Best Practices

### Job Management
1. **Set Appropriate Max Retries**: Default is 3, adjust based on use case
2. **Monitor Job Status**: Use the GlobalProcessingIndicator for real-time updates
3. **Handle Errors Gracefully**: Provide clear error messages to users
4. **Clean Up Completed Jobs**: Regularly clear old completed jobs

### Performance
1. **Limit Concurrent Jobs**: Avoid overwhelming the API server
2. **Use Appropriate Polling Intervals**: Default is 2 seconds
3. **Handle Large Videos**: Per-frame analysis can take significant time
4. **Provide Progress Feedback**: Show progress bars and status updates

### User Experience
1. **Clear Status Indicators**: Use color-coded badges and icons
2. **Actionable Error Messages**: Provide retry options for failed jobs
3. **Download Results**: Make completed analysis easily accessible
4. **Non-blocking Interface**: Allow users to continue working while jobs process

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:5004  # API server URL
```

### Polling Configuration
```typescript
// In ProcessingContext.tsx
const POLLING_INTERVAL = 2000;  // 2 seconds
const MAX_RETRIES = 3;          // Default max retries
const JOB_TIMEOUT = 30000;      // 30 seconds
```

## Troubleshooting

### Common Issues

1. **Jobs Not Starting**
   - Check API server connectivity
   - Verify video file exists
   - Check console for error messages

2. **Jobs Stuck in Processing**
   - Check API server status
   - Verify job ID is valid
   - Check network connectivity

3. **GlobalProcessingIndicator Not Showing**
   - Ensure ProcessingProvider is wrapped around the app
   - Check if jobs are actually being created
   - Verify component is imported in layout

4. **Download Not Working**
   - Check if job is completed
   - Verify result files exist
   - Check API server file serving

### Debug Information
```typescript
// Access processing context for debugging
const { activeJobs, isProcessing, hasErrors } = useProcessing();
console.log('Active Jobs:', activeJobs);
console.log('Is Processing:', isProcessing);
console.log('Has Errors:', hasErrors);
```

## Future Enhancements

### Planned Features
1. **Job Queuing**: Queue jobs when API server is busy
2. **Batch Processing**: Process multiple videos simultaneously
3. **Job Scheduling**: Schedule analysis jobs for later execution
4. **Advanced Retry Logic**: Exponential backoff and circuit breakers
5. **Job History**: Persistent job history and analytics
6. **WebSocket Updates**: Real-time updates via WebSocket instead of polling

### Performance Improvements
1. **Optimistic Updates**: Update UI before API confirmation
2. **Caching**: Cache job status and results
3. **Lazy Loading**: Load job details on demand
4. **Virtual Scrolling**: Handle large numbers of jobs efficiently

## Conclusion

The enhanced start analyses functionality provides a robust, user-friendly system for managing video analysis jobs. With comprehensive error handling, real-time progress tracking, and intuitive user interface, users can efficiently process gymnastics videos while maintaining full visibility into the analysis pipeline.

The system is designed to be scalable, maintainable, and user-friendly, providing a solid foundation for future enhancements and improvements.





