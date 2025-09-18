#!/usr/bin/env python3
"""
Database Cleanup Script for Gymnastics Analytics
Helps free up MongoDB Atlas storage space by removing old/large files
"""

import requests
import json
from datetime import datetime, timedelta

API_BASE = "http://localhost:5004"

def get_sessions():
    """Get all sessions from the API"""
    try:
        response = requests.get(f"{API_BASE}/getSessions")
        if response.status_code == 200:
            return response.json().get('sessions', [])
        else:
            print(f"❌ Failed to get sessions: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting sessions: {e}")
        return []

def analyze_storage_usage(sessions):
    """Analyze storage usage by sessions"""
    total_video_size = 0
    total_analytics_size = 0
    large_files = []
    
    print("📊 Storage Usage Analysis:")
    print("=" * 50)
    
    for i, session in enumerate(sessions):
        video_size = session.get('video_size', 0)
        analytics_size = session.get('analytics_size', 0)
        total_size = video_size + analytics_size
        
        total_video_size += video_size
        total_analytics_size += analytics_size
        
        if total_size > 10 * 1024 * 1024:  # Files larger than 10MB
            large_files.append({
                'session_id': session.get('_id'),
                'filename': session.get('processed_video_filename', session.get('original_filename', 'Unknown')),
                'video_size_mb': video_size / 1024 / 1024,
                'analytics_size_mb': analytics_size / 1024 / 1024,
                'total_size_mb': total_size / 1024 / 1024,
                'date': session.get('created_at', 'Unknown')
            })
    
    print(f"Total Sessions: {len(sessions)}")
    print(f"Total Video Size: {total_video_size / 1024 / 1024:.2f} MB")
    print(f"Total Analytics Size: {total_analytics_size / 1024 / 1024:.2f} MB")
    print(f"Total Storage Used: {(total_video_size + total_analytics_size) / 1024 / 1024:.2f} MB")
    print()
    
    if large_files:
        print("🔍 Large Files (>10MB):")
        print("-" * 50)
        for file_info in sorted(large_files, key=lambda x: x['total_size_mb'], reverse=True):
            print(f"📁 {file_info['filename']}")
            print(f"   Size: {file_info['total_size_mb']:.2f} MB (Video: {file_info['video_size_mb']:.2f} MB, Analytics: {file_info['analytics_size_mb']:.2f} MB)")
            print(f"   Date: {file_info['date']}")
            print(f"   Session ID: {file_info['session_id']}")
            print()
    
    return large_files

def suggest_cleanup(large_files):
    """Suggest which files to delete"""
    print("💡 Cleanup Suggestions:")
    print("=" * 50)
    
    if not large_files:
        print("✅ No large files found. Storage usage is reasonable.")
        return
    
    # Sort by size (largest first)
    large_files.sort(key=lambda x: x['total_size_mb'], reverse=True)
    
    print("🗑️  Recommended deletions (largest files first):")
    print()
    
    total_savings = 0
    for i, file_info in enumerate(large_files[:5]):  # Top 5 largest files
        savings_mb = file_info['total_size_mb']
        total_savings += savings_mb
        print(f"{i+1}. {file_info['filename']}")
        print(f"   💾 Would save: {savings_mb:.2f} MB")
        print(f"   📅 Date: {file_info['date']}")
        print(f"   🆔 Session ID: {file_info['session_id']}")
        print()
    
    print(f"💰 Total potential savings: {total_savings:.2f} MB")
    print()
    print("⚠️  Note: This script only analyzes. To actually delete files,")
    print("   you would need to implement a delete endpoint in the API.")

def main():
    print("🧹 Gymnastics Analytics Database Cleanup Tool")
    print("=" * 50)
    print()
    
    # Get sessions
    print("📥 Fetching sessions from API...")
    sessions = get_sessions()
    
    if not sessions:
        print("❌ No sessions found or API not accessible")
        return
    
    print(f"✅ Found {len(sessions)} sessions")
    print()
    
    # Analyze storage
    large_files = analyze_storage_usage(sessions)
    
    # Suggest cleanup
    suggest_cleanup(large_files)
    
    print("🔧 Next Steps:")
    print("1. Review the large files listed above")
    print("2. Consider deleting old test files or duplicates")
    print("3. Upgrade MongoDB Atlas plan if needed")
    print("4. Implement a delete endpoint in the API for cleanup")

if __name__ == "__main__":
    main()


