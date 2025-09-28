#!/usr/bin/env python3
"""
Test script to fetch sessions from production server and test Cloudflare Stream integration
"""

import requests
import json
import re
from datetime import datetime

# Configuration
API_BASE_URL = 'https://gymnasticsapi.onrender.com'

def log(message, level='INFO'):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] {level}: {message}")

def test_api_connection():
    """Test basic API connection"""
    try:
        log("Testing API connection...")
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            log("✅ API connection successful", 'SUCCESS')
            return True
        else:
            log(f"❌ API health check failed: {response.status_code}", 'ERROR')
            return False
    except Exception as e:
        log(f"❌ API connection failed: {e}", 'ERROR')
        return False

def fetch_sessions():
    """Fetch sessions from production server"""
    try:
        log("Fetching sessions from production server...")
        response = requests.get(f"{API_BASE_URL}/getSessions", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('sessions'):
                sessions = data['sessions']
                log(f"✅ Found {len(sessions)} sessions", 'SUCCESS')
                return sessions
            else:
                log("❌ No sessions found in response", 'ERROR')
                return []
        else:
            log(f"❌ Failed to fetch sessions: {response.status_code}", 'ERROR')
            return []
    except Exception as e:
        log(f"❌ Error fetching sessions: {e}", 'ERROR')
        return []

def analyze_sessions(sessions):
    """Analyze sessions for Cloudflare Stream URLs"""
    log("Analyzing sessions for Cloudflare Stream URLs...")
    
    cloudflare_sessions = []
    
    for i, session in enumerate(sessions):
        log(f"Session {i+1}: {session.get('processed_video_filename', 'Unknown')}")
        
        # Check for Cloudflare Stream URLs
        cloudflare_url = session.get('cloudflare_stream_url') or session.get('processed_video_url')
        
        if cloudflare_url and 'cloudflarestream.com' in cloudflare_url:
            log(f"  ✅ Cloudflare Stream URL found: {cloudflare_url}", 'SUCCESS')
            
            # Extract video ID
            video_id_match = re.search(r'/([a-f0-9]{32})/iframe', cloudflare_url)
            if video_id_match:
                video_id = video_id_match.group(1)
                log(f"  📹 Video ID: {video_id}", 'INFO')
                
                cloudflare_sessions.append({
                    'session': session,
                    'video_id': video_id,
                    'cloudflare_url': cloudflare_url
                })
            else:
                log(f"  ❌ Could not extract video ID from URL", 'ERROR')
        else:
            log(f"  ❌ No Cloudflare Stream URL found", 'ERROR')
    
    log(f"Found {len(cloudflare_sessions)} sessions with Cloudflare Stream URLs", 'SUCCESS')
    return cloudflare_sessions

def test_cloudflare_url(cloudflare_url):
    """Test if Cloudflare Stream URL is accessible"""
    try:
        log(f"Testing Cloudflare Stream URL: {cloudflare_url}")
        response = requests.head(cloudflare_url, timeout=10)
        
        if response.status_code == 200:
            log("✅ Cloudflare Stream URL is accessible", 'SUCCESS')
            return True
        else:
            log(f"❌ Cloudflare Stream URL returned: {response.status_code}", 'ERROR')
            return False
    except Exception as e:
        log(f"❌ Error testing Cloudflare URL: {e}", 'ERROR')
        return False

def generate_html_test(cloudflare_sessions):
    """Generate HTML test file with working sessions"""
    if not cloudflare_sessions:
        log("No Cloudflare sessions to generate HTML test", 'WARNING')
        return
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Stream Test - Working Sessions</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .container {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }}
        .video-container {{ position: relative; width: 100%; max-width: 800px; margin: 20px auto; }}
        button {{ padding: 10px 20px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; margin: 5px; }}
        button:hover {{ background: #0056b3; }}
        .status {{ padding: 10px; border-radius: 4px; margin: 10px 0; }}
        .status.success {{ background: #d4edda; color: #155724; }}
        .status.error {{ background: #f8d7da; color: #721c24; }}
        .session-item {{ padding: 10px; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px; }}
    </style>
</head>
<body>
    <h1>Cloudflare Stream Test - Working Sessions</h1>
    <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    
    <div class="container">
        <h2>Available Sessions ({len(cloudflare_sessions)})</h2>
"""
    
    for i, session_data in enumerate(cloudflare_sessions):
        session = session_data['session']
        video_id = session_data['video_id']
        cloudflare_url = session_data['cloudflare_url']
        
        html_content += f"""
        <div class="session-item">
            <h3>Session {i+1}: {session.get('processed_video_filename', 'Unknown')}</h3>
            <p><strong>Video ID:</strong> {video_id}</p>
            <p><strong>Cloudflare URL:</strong> {cloudflare_url}</p>
            <button onclick="loadVideo('{video_id}', '{session.get('processed_video_filename', 'Unknown')}')">
                Load Video {i+1}
            </button>
        </div>
"""
    
    html_content += """
    </div>
    
    <div class="container">
        <h2>Video Player</h2>
        <div class="video-container">
            <div id="video-player"></div>
        </div>
        <div id="status" class="status" style="display: none;"></div>
    </div>

    <script>
        let currentPlayer = null;
        
        function showStatus(message, type = 'success') {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';
        }
        
        async function loadVideo(videoId, title) {
            try {
                showStatus(`Loading video: ${title}...`, 'success');
                
                // Clear existing player
                const playerContainer = document.getElementById('video-player');
                playerContainer.innerHTML = '';
                
                // Create stream element
                const streamElement = document.createElement('stream');
                streamElement.setAttribute('id', videoId);
                streamElement.style.width = '100%';
                streamElement.style.height = '400px';
                streamElement.style.borderRadius = '8px';
                
                playerContainer.appendChild(streamElement);
                
                // Load Cloudflare Stream SDK if not already loaded
                if (!window.Stream) {
                    const script = document.createElement('script');
                    script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
                    script.async = true;
                    script.onload = () => {
                        initializePlayer(videoId, streamElement);
                    };
                    document.head.appendChild(script);
                } else {
                    initializePlayer(videoId, streamElement);
                }
                
            } catch (error) {
                showStatus(`Error: ${error.message}`, 'error');
            }
        }
        
        function initializePlayer(videoId, streamElement) {
            try {
                currentPlayer = window.Stream(streamElement);
                
                currentPlayer.addEventListener('loadeddata', () => {
                    showStatus(`Video loaded successfully: ${videoId}`, 'success');
                });
                
                currentPlayer.addEventListener('error', (e) => {
                    showStatus(`Video error: ${e.message || 'Unknown error'}`, 'error');
                });
                
            } catch (error) {
                showStatus(`Player error: ${error.message}`, 'error');
            }
        }
    </script>
</body>
</html>
"""
    
    # Write HTML file
    filename = f"cloudflare_test_working_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    with open(filename, 'w') as f:
        f.write(html_content)
    
    log(f"✅ Generated HTML test file: {filename}", 'SUCCESS')
    return filename

def main():
    """Main test function"""
    log("Starting Cloudflare Stream API test...")
    
    # Test API connection
    if not test_api_connection():
        log("❌ API connection failed, exiting", 'ERROR')
        return
    
    # Fetch sessions
    sessions = fetch_sessions()
    if not sessions:
        log("❌ No sessions found, exiting", 'ERROR')
        return
    
    # Analyze sessions
    cloudflare_sessions = analyze_sessions(sessions)
    if not cloudflare_sessions:
        log("❌ No Cloudflare Stream sessions found", 'ERROR')
        return
    
    # Test first Cloudflare URL
    if cloudflare_sessions:
        first_session = cloudflare_sessions[0]
        test_cloudflare_url(first_session['cloudflare_url'])
    
    # Generate HTML test file
    html_file = generate_html_test(cloudflare_sessions)
    
    log("✅ Test completed successfully!", 'SUCCESS')
    log(f"📄 Open {html_file} in your browser to test Cloudflare Stream videos", 'INFO')

if __name__ == "__main__":
    main()
