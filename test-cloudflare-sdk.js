#!/usr/bin/env node

/**
 * Cloudflare Stream SDK Frame Timestamp Extraction Test
 * 
 * This script tests extracting frame timestamps from Cloudflare Stream videos
 * using the official Cloudflare Stream SDK and correlates them with analytics data.
 */

const fs = require('fs');
const path = require('path');

// Mock Cloudflare Stream SDK (replace with actual SDK)
class CloudflareStreamSDK {
    constructor(apiToken, accountId) {
        this.apiToken = apiToken;
        this.accountId = accountId;
        this.baseUrl = 'https://api.cloudflare.com/client/v4';
    }

    async getVideo(videoId) {
        // Mock implementation - replace with actual SDK call
        console.log(`Fetching video data for ID: ${videoId}`);
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: videoId,
                    status: 'ready',
                    duration: 120.5, // Mock duration in seconds
                    fps: 30,
                    resolution: '1920x1080',
                    created: new Date().toISOString(),
                    thumbnail: `https://customer-${this.accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`
                });
            }, 1000);
        });
    }

    async getVideoStream(videoId) {
        // Mock implementation - replace with actual SDK call
        console.log(`Getting stream URL for video ID: ${videoId}`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    streamUrl: `https://customer-${this.accountId}.cloudflarestream.com/${videoId}/downloads/default.mp4`,
                    embedUrl: `https://iframe.cloudflarestream.com/${videoId}`,
                    hlsUrl: `https://customer-${this.accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
                });
            }, 500);
        });
    }
}

class FrameTimestampExtractor {
    constructor(sdk) {
        this.sdk = sdk;
        this.frameData = [];
    }

    /**
     * Generate mock frame data based on video properties
     */
    generateMockFrameData(videoInfo, sampleRate = 30) {
        const { duration, fps } = videoInfo;
        const totalFrames = Math.floor(duration * fps);
        const frameData = [];

        console.log(`Generating mock frame data for ${totalFrames} frames at ${fps} FPS`);

        for (let i = 0; i < totalFrames; i += sampleRate) {
            const timestamp = (i / fps) * 1000; // Convert to milliseconds
            const videoTime = i / fps;

            const frameInfo = {
                frame_number: i + 1,
                timestamp: timestamp,
                video_time: videoTime,
                analytics: {
                    acl_risk: Math.random() * 100,
                    left_knee_angle: Math.random() * 180,
                    right_knee_angle: Math.random() * 180,
                    elevation_angle: Math.random() * 45,
                    forward_lean: Math.random() * 60 - 30,
                    landing_force: Math.random() * 2000,
                    tumbling_phase: this.getRandomTumblingPhase(),
                    quality_score: Math.random() * 100,
                    confidence: Math.random() * 100
                },
                extracted_at: new Date().toISOString()
            };

            frameData.push(frameInfo);
        }

        this.frameData = frameData;
        console.log(`Generated ${frameData.length} frame data points`);
        return frameData;
    }

    getRandomTumblingPhase() {
        const phases = ['approach', 'takeoff', 'flight', 'landing', 'stabilization'];
        return phases[Math.floor(Math.random() * phases.length)];
    }

    /**
     * Find frame data for a specific timestamp
     */
    findFrameAtTime(targetTime) {
        const targetTimestamp = targetTime * 1000; // Convert to milliseconds
        
        // Find closest frame
        let closestFrame = null;
        let minDifference = Infinity;

        for (const frame of this.frameData) {
            const difference = Math.abs(frame.timestamp - targetTimestamp);
            if (difference < minDifference) {
                minDifference = difference;
                closestFrame = frame;
            }
        }

        return closestFrame;
    }

    /**
     * Analyze frames in a time range
     */
    analyzeTimeRange(startTime, endTime) {
        const startTimestamp = startTime * 1000;
        const endTimestamp = endTime * 1000;

        return this.frameData.filter(frame => 
            frame.timestamp >= startTimestamp && frame.timestamp <= endTimestamp
        );
    }

    /**
     * Get frame statistics
     */
    getFrameStatistics() {
        if (this.frameData.length === 0) {
            return null;
        }

        const aclRisks = this.frameData.map(f => f.analytics.acl_risk);
        const kneeAngles = this.frameData.map(f => f.analytics.left_knee_angle);
        const qualityScores = this.frameData.map(f => f.analytics.quality_score);

        return {
            total_frames: this.frameData.length,
            time_span: {
                start: this.frameData[0].video_time,
                end: this.frameData[this.frameData.length - 1].video_time,
                duration: this.frameData[this.frameData.length - 1].video_time - this.frameData[0].video_time
            },
            acl_risk: {
                min: Math.min(...aclRisks),
                max: Math.max(...aclRisks),
                avg: aclRisks.reduce((a, b) => a + b, 0) / aclRisks.length
            },
            knee_angle: {
                min: Math.min(...kneeAngles),
                max: Math.max(...kneeAngles),
                avg: kneeAngles.reduce((a, b) => a + b, 0) / kneeAngles.length
            },
            quality: {
                min: Math.min(...qualityScores),
                max: Math.max(...qualityScores),
                avg: qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
            }
        };
    }

    /**
     * Save frame data to JSON file
     */
    saveFrameData(filename = null) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `cloudflare_frame_data_${timestamp}.json`;
        }

        const data = {
            metadata: {
                generated_at: new Date().toISOString(),
                total_frames: this.frameData.length,
                sample_rate: 30,
                source: 'cloudflare_stream_mock'
            },
            frame_data: this.frameData,
            statistics: this.getFrameStatistics()
        };

        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`Frame data saved to: ${filename}`);
        return filename;
    }

    /**
     * Load frame data from JSON file
     */
    loadFrameData(filename) {
        try {
            const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
            this.frameData = data.frame_data || [];
            console.log(`Loaded ${this.frameData.length} frames from ${filename}`);
            return true;
        } catch (error) {
            console.error(`Error loading frame data: ${error.message}`);
            return false;
        }
    }
}

/**
 * Test the frame extraction functionality
 */
async function testFrameExtraction() {
    console.log('Starting Cloudflare Stream Frame Timestamp Extraction Test');
    console.log('=' .repeat(60));

    // Initialize SDK (replace with actual credentials)
    const sdk = new CloudflareStreamSDK('your-api-token', 'your-account-id');
    
    // Test video ID (replace with actual video ID)
    const videoId = 'your-video-id-here';
    
    try {
        // Get video information
        console.log(`\n1. Fetching video information for ID: ${videoId}`);
        const videoInfo = await sdk.getVideo(videoId);
        console.log('Video Info:', videoInfo);

        // Get stream URLs
        console.log('\n2. Getting stream URLs...');
        const streamInfo = await sdk.getVideoStream(videoId);
        console.log('Stream Info:', streamInfo);

        // Initialize frame extractor
        console.log('\n3. Initializing frame extractor...');
        const extractor = new FrameTimestampExtractor(sdk);

        // Generate mock frame data
        console.log('\n4. Generating mock frame data...');
        const frameData = extractor.generateMockFrameData(videoInfo, 30);
        
        // Test frame lookup
        console.log('\n5. Testing frame lookup...');
        const testTime = 5.0; // 5 seconds
        const frameAtTime = extractor.findFrameAtTime(testTime);
        if (frameAtTime) {
            console.log(`Frame at ${testTime}s:`, {
                frame_number: frameAtTime.frame_number,
                timestamp: frameAtTime.timestamp,
                acl_risk: frameAtTime.analytics.acl_risk.toFixed(1)
            });
        }

        // Test time range analysis
        console.log('\n6. Testing time range analysis...');
        const rangeFrames = extractor.analyzeTimeRange(10, 15); // 10-15 seconds
        console.log(`Frames in range 10-15s: ${rangeFrames.length}`);

        // Get statistics
        console.log('\n7. Generating statistics...');
        const stats = extractor.getFrameStatistics();
        console.log('Frame Statistics:', JSON.stringify(stats, null, 2));

        // Save data
        console.log('\n8. Saving frame data...');
        const filename = extractor.saveFrameData();

        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✓ Video loaded: ${videoInfo.id}`);
        console.log(`✓ Frames generated: ${frameData.length}`);
        console.log(`✓ Data saved: ${filename}`);
        console.log(`✓ Duration: ${videoInfo.duration}s`);
        console.log(`✓ FPS: ${videoInfo.fps}`);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

/**
 * Test with sample data
 */
function testWithSampleData() {
    console.log('\nTesting with sample data...');
    
    const extractor = new FrameTimestampExtractor(null);
    
    // Create sample video info
    const sampleVideoInfo = {
        id: 'sample-video',
        duration: 60.0,
        fps: 30,
        resolution: '1920x1080'
    };
    
    // Generate frame data
    const frameData = extractor.generateMockFrameData(sampleVideoInfo, 10);
    
    // Test various functions
    console.log(`Generated ${frameData.length} sample frames`);
    
    const frameAt5s = extractor.findFrameAtTime(5.0);
    console.log('Frame at 5s:', frameAt5s?.frame_number);
    
    const rangeFrames = extractor.analyzeTimeRange(0, 10);
    console.log(`Frames in 0-10s range: ${rangeFrames.length}`);
    
    const stats = extractor.getFrameStatistics();
    console.log('Sample statistics:', stats);
    
    const filename = extractor.saveFrameData('sample_frame_data.json');
    console.log(`Sample data saved: ${filename}`);
}

// Run tests
if (require.main === module) {
    console.log('Cloudflare Stream Frame Timestamp Extraction Test');
    console.log('Node.js Version:', process.version);
    console.log('='.repeat(60));
    
    // Test with sample data first
    testWithSampleData();
    
    // Test with Cloudflare Stream (requires actual credentials)
    // testFrameExtraction();
    
    console.log('\nTest completed!');
}

module.exports = {
    CloudflareStreamSDK,
    FrameTimestampExtractor
};


