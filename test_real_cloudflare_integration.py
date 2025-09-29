#!/usr/bin/env python3
"""
Real Cloudflare Stream Integration Test Script

This script uses the actual backend server methods to:
1. Retrieve Cloudflare Stream videos and URLs
2. Get real analytics data from MongoDB
3. Debug timestamp/frame alignment issues
4. Test frame synchronization with video playback
"""

import requests
import json
import time
from datetime import datetime
import os
import sys
from typing import Dict, List, Optional, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RealCloudflareIntegrationTester:
    def __init__(self, backend_url: str = "https://gymnasticsapi.onrender.com"):
        """
        Initialize the tester with backend server URL
        
        Args:
            backend_url: URL of the gymnastics analytics backend server
        """
        self.backend_url = backend_url.rstrip('/')
        self.session = requests.Session()
        
        # Test server connectivity
        self.test_server_connection()
    
    def test_server_connection(self):
        """Test if the backend server is accessible"""
        try:
            response = self.session.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Backend server is accessible")
                return True
            else:
                logger.warning(f"⚠️ Backend server responded with status {response.status_code}")
                return False
        except requests.RequestException as e:
            logger.error(f"❌ Cannot connect to backend server: {e}")
            return False
    
    def get_sessions(self) -> List[Dict]:
        """Get all sessions from the backend"""
        try:
            response = self.session.get(f"{self.backend_url}/getSessions")
            if response.status_code == 200:
                data = response.json()
                
                # The API returns a dict with 'count' and 'sessions' keys
                if isinstance(data, dict) and 'sessions' in data:
                    sessions = data['sessions']
                    logger.info(f"✅ Retrieved {len(sessions)} sessions (total: {data.get('count', len(sessions))})")
                else:
                    # Fallback: treat as direct array
                    sessions = data if isinstance(data, list) else []
                    logger.info(f"✅ Retrieved {len(sessions)} sessions (direct array)")
                
                # Ensure sessions are dictionaries
                processed_sessions = []
                for session in sessions:
                    if isinstance(session, dict):
                        processed_sessions.append(session)
                    else:
                        logger.warning(f"⚠️ Unexpected session type: {type(session)}")
                        continue
                
                logger.info(f"📊 Processed {len(processed_sessions)} valid sessions")
                return processed_sessions
            else:
                logger.error(f"❌ Failed to get sessions: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"❌ Error getting sessions: {e}")
            return []
    
    def get_session_details(self, session_id: str) -> Optional[Dict]:
        """Get detailed session information"""
        try:
            response = self.session.get(f"{self.backend_url}/getSession/{session_id}")
            if response.status_code == 200:
                session = response.json()
                logger.info(f"✅ Retrieved session details for {session_id}")
                return session
            else:
                logger.error(f"❌ Failed to get session details: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"❌ Error getting session details: {e}")
            return None
    
    def get_analytics_data(self, analytics_id: str) -> Optional[Dict]:
        """Get analytics data for a specific analytics ID"""
        try:
            response = self.session.get(f"{self.backend_url}/getAnalytics/{analytics_id}")
            if response.status_code == 200:
                analytics = response.json()
                logger.info(f"✅ Retrieved analytics data for {analytics_id}")
                return analytics
            else:
                logger.error(f"❌ Failed to get analytics: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"❌ Error getting analytics: {e}")
            return None
    
    def get_per_frame_statistics(self, video_filename: str) -> Optional[Dict]:
        """Get per-frame statistics for a video"""
        try:
            response = self.session.get(
                f"{self.backend_url}/getPerFrameStatistics",
                params={"video_filename": video_filename}
            )
            if response.status_code == 200:
                stats = response.json()
                logger.info(f"✅ Retrieved per-frame statistics for {video_filename}")
                return stats
            else:
                logger.error(f"❌ Failed to get per-frame statistics: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"❌ Error getting per-frame statistics: {e}")
            return None
    
    def analyze_video_timestamps(self, analytics_data: Dict) -> Dict:
        """
        Analyze timestamp structure and alignment in analytics data
        
        Args:
            analytics_data: Analytics data from backend
            
        Returns:
            Analysis results with timestamp information
        """
        analysis = {
            "total_frames": 0,
            "timestamp_info": {},
            "frame_structure": {},
            "alignment_issues": [],
            "recommendations": []
        }
        
        try:
            # Extract frame data
            frame_data = []
            if isinstance(analytics_data, list):
                frame_data = analytics_data
            elif isinstance(analytics_data, dict) and 'analytics' in analytics_data:
                frame_data = analytics_data['analytics']
            elif isinstance(analytics_data, dict) and 'frame_data' in analytics_data:
                frame_data = analytics_data['frame_data']
            
            if not frame_data:
                analysis["alignment_issues"].append("No frame data found in analytics")
                return analysis
            
            analysis["total_frames"] = len(frame_data)
            
            # Analyze timestamp structure
            timestamps = []
            frame_numbers = []
            relative_timestamps = []
            
            for i, frame in enumerate(frame_data[:100]):  # Analyze first 100 frames
                frame_num = frame.get('frame_number', i)
                frame_numbers.append(frame_num)
                
                # Check for timestamp in different locations
                timestamp = None
                if 'timestamp' in frame:
                    timestamp = frame['timestamp']
                elif 'metrics' in frame and 'timestamp' in frame['metrics']:
                    timestamp = frame['metrics']['timestamp']
                
                if timestamp:
                    timestamps.append(timestamp)
                    
                    # Check for relative timestamp
                    if 'metrics' in frame and 'relative_timestamp' in frame['metrics']:
                        relative_timestamps.append(frame['metrics']['relative_timestamp'])
                    elif 'relative_timestamp' in frame:
                        relative_timestamps.append(frame['relative_timestamp'])
            
            # Analyze timestamp patterns
            if timestamps:
                analysis["timestamp_info"] = {
                    "first_timestamp": timestamps[0],
                    "last_timestamp": timestamps[-1],
                    "timestamp_range": timestamps[-1] - timestamps[0],
                    "timestamp_type": "unix" if timestamps[0] > 1000000000 else "relative",
                    "sample_timestamps": timestamps[:5]
                }
                
                # Check for timestamp consistency
                if len(timestamps) > 1:
                    intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
                    analysis["timestamp_info"]["average_interval"] = sum(intervals) / len(intervals)
                    analysis["timestamp_info"]["interval_variance"] = max(intervals) - min(intervals)
            
            if relative_timestamps:
                analysis["timestamp_info"]["relative_timestamps"] = {
                    "first_relative": relative_timestamps[0],
                    "last_relative": relative_timestamps[-1],
                    "relative_range": relative_timestamps[-1] - relative_timestamps[0],
                    "sample_relative": relative_timestamps[:5]
                }
            
            # Check frame number consistency
            if frame_numbers:
                expected_frame_numbers = list(range(min(frame_numbers), min(frame_numbers) + len(frame_numbers)))
                if frame_numbers != expected_frame_numbers:
                    analysis["alignment_issues"].append("Frame numbers are not sequential")
                
                analysis["frame_structure"] = {
                    "first_frame": min(frame_numbers),
                    "last_frame": max(frame_numbers),
                    "frame_count": len(frame_numbers),
                    "frame_interval": frame_numbers[1] - frame_numbers[0] if len(frame_numbers) > 1 else 1
                }
            
            # Generate recommendations
            if not timestamps:
                analysis["recommendations"].append("Add timestamps to frame data")
            
            if not relative_timestamps:
                analysis["recommendations"].append("Convert timestamps to relative time for video sync")
            
            if analysis["timestamp_info"].get("timestamp_type") == "unix":
                analysis["recommendations"].append("Convert Unix timestamps to relative time")
            
            if analysis["timestamp_info"].get("interval_variance", 0) > 1.0:
                analysis["recommendations"].append("Timestamp intervals are inconsistent - check frame rate")
            
        except Exception as e:
            analysis["alignment_issues"].append(f"Error analyzing timestamps: {str(e)}")
            logger.error(f"Error analyzing timestamps: {e}")
        
        return analysis
    
    def generate_frame_timestamp_mapping(self, analytics_data: Dict, video_fps: float = 30.0) -> Dict:
        """
        Generate a mapping between frame numbers and timestamps for video synchronization
        
        Args:
            analytics_data: Analytics data from backend
            video_fps: Video frame rate (default 30 FPS)
            
        Returns:
            Frame timestamp mapping
        """
        mapping = {
            "frame_to_timestamp": {},
            "timestamp_to_frame": {},
            "frame_to_video_time": {},
            "video_time_to_frame": {},
            "metadata": {
                "fps": video_fps,
                "total_frames": 0,
                "video_duration": 0
            }
        }
        
        try:
            # Extract frame data
            frame_data = []
            if isinstance(analytics_data, list):
                frame_data = analytics_data
            elif isinstance(analytics_data, dict) and 'analytics' in analytics_data:
                frame_data = analytics_data['analytics']
            elif isinstance(analytics_data, dict) and 'frame_data' in analytics_data:
                frame_data = analytics_data['frame_data']
            
            if not frame_data:
                return mapping
            
            mapping["metadata"]["total_frames"] = len(frame_data)
            
            for frame in frame_data:
                frame_num = frame.get('frame_number', 0)
                
                # Get timestamp
                timestamp = None
                if 'timestamp' in frame:
                    timestamp = frame['timestamp']
                elif 'metrics' in frame and 'timestamp' in frame['metrics']:
                    timestamp = frame['metrics']['timestamp']
                
                if timestamp:
                    # Calculate video time (seconds)
                    if timestamp > 1000000000:  # Unix timestamp
                        # Convert to relative time (this should be done by backend)
                        video_time = timestamp / 1000  # Convert to seconds
                    else:  # Relative timestamp
                        video_time = timestamp
                    
                    # Store mappings
                    mapping["frame_to_timestamp"][frame_num] = timestamp
                    mapping["timestamp_to_frame"][timestamp] = frame_num
                    mapping["frame_to_video_time"][frame_num] = video_time
                    mapping["video_time_to_frame"][video_time] = frame_num
            
            # Calculate video duration
            if mapping["frame_to_video_time"]:
                max_time = max(mapping["frame_to_video_time"].values())
                mapping["metadata"]["video_duration"] = max_time
            
            logger.info(f"✅ Generated frame mapping for {len(frame_data)} frames")
            
        except Exception as e:
            logger.error(f"Error generating frame mapping: {e}")
        
        return mapping
    
    def test_cloudflare_stream_integration(self):
        """Test the complete Cloudflare Stream integration workflow"""
        logger.info("🧪 Starting Cloudflare Stream Integration Test")
        
        # Step 1: Get all sessions
        sessions = self.get_sessions()
        if not sessions:
            logger.error("❌ No sessions found - cannot test integration")
            return
        
        logger.info(f"📊 Found {len(sessions)} sessions")
        
        # Step 2: Find sessions with Cloudflare Stream videos
        cloudflare_sessions = []
        for session in sessions:
            if (session.get('meta', {}).get('cloudflare_stream_id') or 
                session.get('meta', {}).get('cloudflare_uid')):
                cloudflare_sessions.append(session)
        
        if not cloudflare_sessions:
            logger.warning("⚠️ No sessions with Cloudflare Stream videos found")
            # Test with any session that has analytics
            for session in sessions:
                if session.get('analytics_id'):
                    cloudflare_sessions.append(session)
                    break
        
        if not cloudflare_sessions:
            logger.error("❌ No sessions with analytics found")
            return
        
        # Step 3: Test with first available session
        test_session = cloudflare_sessions[0]
        session_id = test_session['_id']
        logger.info(f"🎯 Testing with session: {session_id}")
        
        # Step 4: Get detailed session information
        session_details = self.get_session_details(session_id)
        if not session_details:
            logger.error("❌ Failed to get session details")
            return
        
        # Step 5: Get analytics data
        analytics_id = (session_details.get('analytics_id') or 
                       session_details.get('gridfs_analytics_id'))
        if not analytics_id:
            logger.error("❌ No analytics ID found in session")
            logger.info(f"Available session keys: {list(session_details.keys())}")
            return
        
        logger.info(f"📊 Getting analytics for ID: {analytics_id}")
        analytics_data = self.get_analytics_data(analytics_id)
        if not analytics_data:
            logger.error("❌ Failed to get analytics data")
            return
        
        # Step 6: Analyze timestamp structure
        logger.info("🔍 Analyzing timestamp structure...")
        timestamp_analysis = self.analyze_video_timestamps(analytics_data)
        
        # Step 7: Generate frame mapping
        logger.info("🗺️ Generating frame timestamp mapping...")
        frame_mapping = self.generate_frame_timestamp_mapping(analytics_data)
        
        # Step 8: Display results
        self.display_integration_results(test_session, session_details, analytics_data, 
                                       timestamp_analysis, frame_mapping)
        
        # Step 9: Test video filename-based analytics
        video_filename = session_details.get('original_filename') or session_details.get('processed_video_filename')
        if video_filename:
            logger.info(f"🎬 Testing per-frame statistics for: {video_filename}")
            per_frame_stats = self.get_per_frame_statistics(video_filename)
            if per_frame_stats:
                logger.info("✅ Per-frame statistics retrieved successfully")
                # Compare with analytics data
                self.compare_analytics_sources(analytics_data, per_frame_stats)
        
        return {
            "session": test_session,
            "session_details": session_details,
            "analytics_data": analytics_data,
            "timestamp_analysis": timestamp_analysis,
            "frame_mapping": frame_mapping
        }
    
    def display_integration_results(self, session, session_details, analytics_data, 
                                  timestamp_analysis, frame_mapping):
        """Display the integration test results"""
        print("\n" + "="*80)
        print("CLOUDFLARE STREAM INTEGRATION TEST RESULTS")
        print("="*80)
        
        # Session Information
        print(f"\n📋 SESSION INFORMATION:")
        print(f"   Session ID: {session['_id']}")
        print(f"   Original Filename: {session_details.get('original_filename', 'N/A')}")
        print(f"   Processed Filename: {session_details.get('processed_video_filename', 'N/A')}")
        print(f"   Analytics ID: {session_details.get('analytics_id', 'N/A')}")
        
        # Cloudflare Stream Information
        meta = session_details.get('meta', {})
        if meta.get('cloudflare_stream_id'):
            print(f"   Cloudflare Stream ID: {meta['cloudflare_stream_id']}")
        if meta.get('cloudflare_uid'):
            print(f"   Cloudflare UID: {meta['cloudflare_uid']}")
        
        # Analytics Structure
        print(f"\n📊 ANALYTICS STRUCTURE:")
        print(f"   Total Frames: {timestamp_analysis['total_frames']}")
        
        if timestamp_analysis['timestamp_info']:
            ts_info = timestamp_analysis['timestamp_info']
            print(f"   First Timestamp: {ts_info.get('first_timestamp', 'N/A')}")
            print(f"   Last Timestamp: {ts_info.get('last_timestamp', 'N/A')}")
            print(f"   Timestamp Range: {ts_info.get('timestamp_range', 'N/A')}")
            print(f"   Timestamp Type: {ts_info.get('timestamp_type', 'N/A')}")
            if 'average_interval' in ts_info:
                print(f"   Average Interval: {ts_info['average_interval']:.3f}")
        
        # Frame Mapping
        if frame_mapping['metadata']['total_frames'] > 0:
            print(f"\n🗺️ FRAME MAPPING:")
            print(f"   Total Frames: {frame_mapping['metadata']['total_frames']}")
            print(f"   Video Duration: {frame_mapping['metadata']['video_duration']:.2f} seconds")
            print(f"   FPS: {frame_mapping['metadata']['fps']}")
            
            # Show sample mappings
            sample_frames = list(frame_mapping['frame_to_video_time'].keys())[:5]
            print(f"   Sample Frame Mappings:")
            for frame_num in sample_frames:
                video_time = frame_mapping['frame_to_video_time'][frame_num]
                print(f"     Frame {frame_num}: {video_time:.3f}s")
        
        # Issues and Recommendations
        if timestamp_analysis['alignment_issues']:
            print(f"\n⚠️ ALIGNMENT ISSUES:")
            for issue in timestamp_analysis['alignment_issues']:
                print(f"   - {issue}")
        
        if timestamp_analysis['recommendations']:
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in timestamp_analysis['recommendations']:
                print(f"   - {rec}")
        
        print("\n" + "="*80)
    
    def compare_analytics_sources(self, analytics_data, per_frame_stats):
        """Compare analytics from different sources"""
        print(f"\n🔍 ANALYTICS SOURCE COMPARISON:")
        
        # Extract frame counts
        analytics_frames = 0
        if isinstance(analytics_data, list):
            analytics_frames = len(analytics_data)
        elif isinstance(analytics_data, dict) and 'analytics' in analytics_data:
            analytics_frames = len(analytics_data['analytics'])
        
        per_frame_frames = 0
        if isinstance(per_frame_stats, list):
            per_frame_frames = len(per_frame_stats)
        elif isinstance(per_frame_stats, dict) and 'frame_data' in per_frame_stats:
            per_frame_frames = len(per_frame_stats['frame_data'])
        
        print(f"   Analytics API frames: {analytics_frames}")
        print(f"   Per-frame API frames: {per_frame_frames}")
        
        if analytics_frames != per_frame_frames:
            print(f"   ⚠️ Frame count mismatch between sources")
        else:
            print(f"   ✅ Frame counts match between sources")

def main():
    """Main test function"""
    print("Cloudflare Stream Integration Test")
    print("="*50)
    
    # Initialize tester
    tester = RealCloudflareIntegrationTester()
    
    # Run integration test
    results = tester.test_cloudflare_stream_integration()
    
    if results:
        print("\n✅ Integration test completed successfully!")
        
        # Save results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"cloudflare_integration_test_results_{timestamp}.json"
        
        # Convert results to JSON-serializable format
        json_results = {
            "test_timestamp": timestamp,
            "session_id": results["session"]["_id"],
            "analytics_id": results["session_details"].get("analytics_id"),
            "total_frames": results["timestamp_analysis"]["total_frames"],
            "timestamp_analysis": results["timestamp_analysis"],
            "frame_mapping_metadata": results["frame_mapping"]["metadata"]
        }
        
        with open(results_file, 'w') as f:
            json.dump(json_results, f, indent=2)
        
        print(f"📁 Results saved to: {results_file}")
    else:
        print("\n❌ Integration test failed!")

if __name__ == "__main__":
    main()
