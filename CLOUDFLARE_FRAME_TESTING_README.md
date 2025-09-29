# Cloudflare Stream Frame Timestamp Testing

This directory contains test scripts to extract frame timestamps from Cloudflare Stream videos and correlate them with analytics data.

## Test Scripts Overview

### 1. HTML/JavaScript Test (`test-cloudflare-frame-timestamps.html`)

**Purpose**: Interactive web-based testing of Cloudflare Stream frame extraction

**Features**:
- Load Cloudflare Stream videos via URL or ID
- Real-time frame timestamp extraction
- Interactive video controls
- Frame-by-frame analysis
- Visual frame information display
- Captured frame data logging

**Usage**:
1. Open `test-cloudflare-frame-timestamps.html` in a web browser
2. Enter a Cloudflare Stream video URL or ID
3. Click "Load Video" to initialize
4. Use controls to play/pause and seek
5. Click "Capture Frame Timestamp" to extract current frame data
6. Use "Start Frame Analysis" for continuous frame monitoring

**Requirements**:
- Modern web browser
- Cloudflare Stream video access
- Internet connection

### 2. Python Test (`test_cloudflare_frame_extraction.py`)

**Purpose**: Server-side frame extraction using OpenCV and requests

**Features**:
- Direct video stream access
- Frame timestamp extraction at configurable intervals
- Mock analytics data generation
- Frame analysis at specific timestamps
- JSON data export
- Comprehensive logging

**Usage**:
```bash
# Install dependencies
pip install opencv-python requests numpy

# Run the test
python test_cloudflare_frame_extraction.py
```

**Configuration**:
- Modify `test_video_id` variable with your Cloudflare Stream video ID
- Adjust `sample_rate` parameter for frame extraction frequency
- Customize mock analytics data generation

### 3. Node.js SDK Test (`test-cloudflare-sdk.js`)

**Purpose**: Testing with Cloudflare Stream SDK integration

**Features**:
- Mock Cloudflare Stream SDK implementation
- Frame data generation and management
- Time-based frame lookup
- Statistical analysis
- JSON data persistence
- Modular architecture

**Usage**:
```bash
# Install dependencies (if needed)
npm install

# Run the test
node test-cloudflare-sdk.js
```

**Configuration**:
- Update `videoId`, `apiToken`, and `accountId` variables
- Modify frame generation parameters
- Customize analytics data structure

## Frame Timestamp Structure

All scripts generate frame data with the following structure:

```json
{
  "frame_number": 150,
  "timestamp": 5000.0,
  "video_time": 5.0,
  "analytics": {
    "acl_risk": 75.3,
    "left_knee_angle": 165.2,
    "right_knee_angle": 170.8,
    "elevation_angle": 25.4,
    "forward_lean": -12.1,
    "landing_force": 1456.7,
    "tumbling_phase": "landing",
    "quality_score": 82.5,
    "confidence": 94.2
  },
  "extracted_at": "2024-01-15T10:30:45.123Z"
}
```

## Key Metrics Explained

### Frame Information
- **frame_number**: Sequential frame number (1-based)
- **timestamp**: Frame timestamp in milliseconds
- **video_time**: Frame time in seconds
- **extracted_at**: When the frame was processed

### Analytics Metrics
- **acl_risk**: ACL injury risk percentage (0-100)
- **left_knee_angle**: Left knee bend angle in degrees
- **right_knee_angle**: Right knee bend angle in degrees
- **elevation_angle**: Body elevation angle in degrees
- **forward_lean**: Forward/backward lean in degrees
- **landing_force**: Estimated landing force in Newtons
- **tumbling_phase**: Current tumbling phase
- **quality_score**: Overall movement quality (0-100)
- **confidence**: Analysis confidence level (0-100)

## Integration with AutoAnalyzedVideoPlayer

These test scripts help understand how to:

1. **Extract Frame Timestamps**: Get precise timestamps for each frame
2. **Correlate with Analytics**: Match frame timestamps with analytics data
3. **Handle Video Seeking**: Implement accurate frame seeking
4. **Update Real-time**: Sync frame changes with analytics updates

### Integration Steps

1. **Load Video**: Initialize Cloudflare Stream video
2. **Generate Frame Data**: Extract timestamps at regular intervals
3. **Create Analytics Mapping**: Map frame timestamps to analytics data
4. **Implement Seeking**: Use timestamps for accurate frame seeking
5. **Update UI**: Sync frame changes with analytics display

## Testing Scenarios

### Scenario 1: Frame-by-Frame Navigation
- Load video and extract frame timestamps
- Test clicking through frames
- Verify analytics update with each frame
- Check timestamp accuracy

### Scenario 2: Video Playback Sync
- Start video playback
- Monitor frame timestamps during playback
- Verify analytics update in real-time
- Test pause/resume functionality

### Scenario 3: Seeking Accuracy
- Seek to specific timestamps
- Verify correct frame is displayed
- Check analytics match the frame
- Test seeking to frame boundaries

### Scenario 4: Frame Timestep Progression
- Start automatic frame progression
- Monitor frame advancement
- Verify smooth transitions
- Check analytics updates

## Troubleshooting

### Common Issues

1. **Video Not Loading**
   - Check video URL/ID format
   - Verify Cloudflare Stream access
   - Check network connectivity

2. **Frame Data Missing**
   - Verify video duration and FPS
   - Check sample rate settings
   - Ensure video is fully loaded

3. **Analytics Not Updating**
   - Check frame timestamp matching
   - Verify analytics data structure
   - Test with mock data first

4. **Seeking Inaccuracy**
   - Check timestamp precision
   - Verify frame rate calculations
   - Test with different video formats

### Debug Tips

- Enable console logging in browser
- Use browser developer tools
- Check network requests
- Verify video metadata
- Test with sample videos first

## Performance Considerations

### Frame Extraction
- Use appropriate sample rates (30-60 frames)
- Consider video duration and resolution
- Implement caching for large datasets
- Use background processing for long videos

### Real-time Updates
- Limit update frequency to prevent lag
- Use efficient data structures
- Implement debouncing for rapid changes
- Consider Web Workers for heavy processing

### Memory Management
- Clear unused frame data
- Implement pagination for large datasets
- Use streaming for long videos
- Monitor memory usage

## Future Enhancements

1. **Real Analytics Integration**: Replace mock data with actual pose detection
2. **Performance Optimization**: Implement efficient frame caching
3. **Advanced Seeking**: Add frame interpolation and smoothing
4. **Export Functionality**: Add frame data export options
5. **Visualization**: Create frame timeline visualizations
6. **Batch Processing**: Support multiple video analysis

## Contributing

When adding new features:

1. Follow existing code structure
2. Add comprehensive logging
3. Include error handling
4. Update documentation
5. Test with various video formats
6. Consider performance implications

## License

These test scripts are part of the gymnastics analytics project and follow the same licensing terms.


