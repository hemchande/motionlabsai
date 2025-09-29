#!/usr/bin/env python3
"""
Cloudflare Stream Frame Timestamp Extraction Test Script

This script tests extracting frame timestamps from Cloudflare Stream videos
and correlates them with analytics frame data.
"""

import cv2
import numpy as np
import requests
import json
import time
from datetime import datetime
import os
from typing import List, Dict, Optional, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CloudflareFrameExtractor:
    def __init__(self, video_url: str = None, video_id: str = None):
        """
        Initialize the frame extractor with either a video URL or ID
        
        Args:
            video_url: Full Cloudflare Stream video URL
            video_id: Cloudflare Stream video ID
        """
        self.video_url = video_url
        self.video_id = video_id
        self.cap = None
        self.frame_data = []
        self.total_frames = 0
        self.fps = 0
        self.duration = 0
        
    def get_stream_url(self) -> Optional[str]:
        """
        Get the actual streamable URL for the video
        
        Returns:
            Streamable URL or None if not found
        """
        if self.video_url:
            return self.video_url
            
        if self.video_id:
            # Try different Cloudflare Stream URL patterns
            possible_urls = [
                f"https://customer-{self.video_id}.cloudflarestream.com/{self.video_id}/downloads/default.mp4",
                f"https://iframe.cloudflarestream.com/{self.video_id}",
                f"https://stream.cloudflare.com/videos/{self.video_id}",
            ]
            
            for url in possible_urls:
                try:
                    response = requests.head(url, timeout=10)
                    if response.status_code == 200:
                        logger.info(f"Found working stream URL: {url}")
                        return url
                except requests.RequestException as e:
                    logger.debug(f"URL {url} failed: {e}")
                    continue
                    
        return None
    
    def load_video(self) -> bool:
        """
        Load the video for frame extraction
        
        Returns:
            True if successful, False otherwise
        """
        stream_url = self.get_stream_url()
        
        if not stream_url:
            logger.error("Could not find a working stream URL")
            return False
            
        try:
            # Try to open with OpenCV
            self.cap = cv2.VideoCapture(stream_url)
            
            if not self.cap.isOpened():
                logger.error(f"Failed to open video: {stream_url}")
                return False
                
            # Get video properties
            self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            self.fps = self.cap.get(cv2.CAP_PROP_FPS)
            self.duration = self.total_frames / self.fps if self.fps > 0 else 0
            
            logger.info(f"Video loaded successfully:")
            logger.info(f"  - Total frames: {self.total_frames}")
            logger.info(f"  - FPS: {self.fps:.2f}")
            logger.info(f"  - Duration: {self.duration:.2f} seconds")
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading video: {e}")
            return False
    
    def extract_frame_timestamps(self, sample_rate: int = 30) -> List[Dict]:
        """
        Extract frame timestamps at regular intervals
        
        Args:
            sample_rate: Extract every Nth frame (default: 30 frames)
            
        Returns:
            List of frame data with timestamps
        """
        if not self.cap or not self.cap.isOpened():
            logger.error("Video not loaded")
            return []
            
        frame_data = []
        frame_count = 0
        
        logger.info(f"Extracting frame timestamps (every {sample_rate} frames)...")
        
        while True:
            ret, frame = self.cap.read()
            
            if not ret:
                break
                
            # Only process every sample_rate frames
            if frame_count % sample_rate == 0:
                timestamp_ms = (frame_count / self.fps) * 1000 if self.fps > 0 else 0
                
                frame_info = {
                    'frame_number': frame_count + 1,
                    'timestamp': timestamp_ms,
                    'video_time': frame_count / self.fps if self.fps > 0 else 0,
                    'extracted_at': datetime.now().isoformat()
                }
                
                frame_data.append(frame_info)
                
                if len(frame_data) % 100 == 0:
                    logger.info(f"Extracted {len(frame_data)} frames so far...")
            
            frame_count += 1
            
        # Reset video to beginning
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        logger.info(f"Frame extraction complete: {len(frame_data)} frames extracted")
        return frame_data
    
    def analyze_frame_at_time(self, target_time: float) -> Optional[Dict]:
        """
        Analyze frame at a specific time
        
        Args:
            target_time: Time in seconds to analyze
            
        Returns:
            Frame data or None if not found
        """
        if not self.cap or not self.cap.isOpened():
            logger.error("Video not loaded")
            return None
            
        # Seek to target time
        target_frame = int(target_time * self.fps) if self.fps > 0 else 0
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        
        ret, frame = self.cap.read()
        
        if not ret:
            logger.error(f"Could not read frame at time {target_time}s")
            return None
            
        timestamp_ms = target_time * 1000
        
        frame_info = {
            'frame_number': target_frame + 1,
            'timestamp': timestamp_ms,
            'video_time': target_time,
            'frame_shape': frame.shape,
            'extracted_at': datetime.now().isoformat()
        }
        
        return frame_info
    
    def generate_mock_analytics_data(self, frame_data: List[Dict]) -> List[Dict]:
        """
        Generate mock analytics data for frames
        
        Args:
            frame_data: List of frame data
            
        Returns:
            Enhanced frame data with mock analytics
        """
        enhanced_data = []
        
        for i, frame in enumerate(frame_data):
            # Generate mock analytics metrics
            analytics = {
                'acl_risk': np.random.uniform(0, 100),
                'left_knee_angle': np.random.uniform(0, 180),
                'right_knee_angle': np.random.uniform(0, 180),
                'elevation_angle': np.random.uniform(0, 45),
                'forward_lean': np.random.uniform(-30, 30),
                'landing_force': np.random.uniform(0, 2000),
                'tumbling_phase': np.random.choice(['approach', 'takeoff', 'flight', 'landing']),
                'quality_score': np.random.uniform(0, 100)
            }
            
            enhanced_frame = {
                **frame,
                'analytics': analytics
            }
            
            enhanced_data.append(enhanced_frame)
            
        logger.info(f"Generated mock analytics for {len(enhanced_data)} frames")
        return enhanced_data
    
    def save_frame_data(self, frame_data: List[Dict], filename: str = None) -> str:
        """
        Save frame data to JSON file
        
        Args:
            frame_data: Frame data to save
            filename: Output filename (optional)
            
        Returns:
            Path to saved file
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"cloudflare_frame_data_{timestamp}.json"
            
        with open(filename, 'w') as f:
            json.dump(frame_data, f, indent=2)
            
        logger.info(f"Frame data saved to: {filename}")
        return filename
    
    def cleanup(self):
        """Clean up resources"""
        if self.cap:
            self.cap.release()
            cv2.destroyAllWindows()

def test_frame_extraction():
    """Test the frame extraction functionality"""
    
    # Test with a sample video (replace with actual Cloudflare Stream video)
    test_video_id = "your-video-id-here"
    
    logger.info("Starting Cloudflare Stream frame extraction test")
    
    # Initialize extractor
    extractor = CloudflareFrameExtractor(video_id=test_video_id)
    
    try:
        # Load video
        if not extractor.load_video():
            logger.error("Failed to load video")
            return
            
        # Extract frame timestamps
        frame_data = extractor.extract_frame_timestamps(sample_rate=30)
        
        if not frame_data:
            logger.error("No frame data extracted")
            return
            
        # Generate mock analytics
        enhanced_data = extractor.generate_mock_analytics_data(frame_data)
        
        # Save data
        filename = extractor.save_frame_data(enhanced_data)
        
        # Test specific time analysis
        test_time = 5.0  # 5 seconds
        specific_frame = extractor.analyze_frame_at_time(test_time)
        
        if specific_frame:
            logger.info(f"Frame at {test_time}s: {specific_frame}")
        
        # Print summary
        logger.info("\n" + "="*50)
        logger.info("FRAME EXTRACTION SUMMARY")
        logger.info("="*50)
        logger.info(f"Total frames extracted: {len(enhanced_data)}")
        logger.info(f"Video duration: {extractor.duration:.2f} seconds")
        logger.info(f"Video FPS: {extractor.fps:.2f}")
        logger.info(f"Data saved to: {filename}")
        
        # Show sample frame data
        if enhanced_data:
            sample_frame = enhanced_data[0]
            logger.info(f"\nSample frame data:")
            logger.info(f"  Frame number: {sample_frame['frame_number']}")
            logger.info(f"  Timestamp: {sample_frame['timestamp']}ms")
            logger.info(f"  Video time: {sample_frame['video_time']:.2f}s")
            logger.info(f"  ACL Risk: {sample_frame['analytics']['acl_risk']:.1f}%")
            
    except Exception as e:
        logger.error(f"Error during frame extraction: {e}")
        
    finally:
        extractor.cleanup()

def test_with_local_video():
    """Test with a local video file for comparison"""
    
    logger.info("Testing with local video file...")
    
    # Use a local video file if available
    local_video_path = "test_video.mp4"  # Replace with actual path
    
    if not os.path.exists(local_video_path):
        logger.warning(f"Local video file not found: {local_video_path}")
        return
        
    extractor = CloudflareFrameExtractor(video_url=local_video_path)
    
    try:
        if extractor.load_video():
            frame_data = extractor.extract_frame_timestamps(sample_rate=60)
            enhanced_data = extractor.generate_mock_analytics_data(frame_data)
            filename = extractor.save_frame_data(enhanced_data, "local_video_frame_data.json")
            
            logger.info(f"Local video analysis complete: {filename}")
            
    except Exception as e:
        logger.error(f"Error with local video: {e}")
        
    finally:
        extractor.cleanup()

if __name__ == "__main__":
    print("Cloudflare Stream Frame Timestamp Extraction Test")
    print("=" * 60)
    
    # Test with Cloudflare Stream
    test_frame_extraction()
    
    print("\n" + "=" * 60)
    
    # Test with local video
    test_with_local_video()
    
    print("\nTest completed!")


