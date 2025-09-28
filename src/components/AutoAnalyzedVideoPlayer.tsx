<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enable Cloudflare Download Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .status {
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: 500;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .debug-log {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        .debug-log .log-entry {
            margin: 2px 0;
            padding: 2px 0;
        }
        .debug-log .log-entry.error {
            color: #dc3545;
        }
        .debug-log .log-entry.success {
            color: #28a745;
        }
        .debug-log .log-entry.info {
            color: #007bff;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #0056b3;
        }
        .video-container {
            position: relative;
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <h1>🎬 Enable Cloudflare Download Test</h1>
    <p>Test enabling downloads and frame-by-frame navigation</p>
    
    <div class="container">
        <h2>📹 Step 1: Enable Download</h2>
        <div id="status1" class="status info">
            Ready to enable download for video...
        </div>
        
        <button onclick="enableDownload()">Enable Download</button>
        <button onclick="checkDownloadStatus()">Check Download Status</button>
        <button onclick="testDownloadUrl()">Test Download URL</button>
        
        <div id="downloadInfo" style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; display: none;">
            <strong>Download URL:</strong> <span id="downloadUrl"></span><br>
            <strong>Status:</strong> <span id="downloadStatus"></span>
        </div>
    </div>

    <div class="container">
        <h2>📹 Step 2: Test Frame-by-Frame Navigation</h2>
        <div id="status2" class="status info">
            Waiting for download URL...
        </div>
        
        <div class="video-container">
            <video id="video" controls width="100%" height="400" style="background: black;" crossorigin="anonymous" preload="metadata">
                <source src="" type="video/mp4" id="videoSource">
                Your browser does not support the video tag.
            </video>
        </div>
        
        <div style="margin: 15px 0;">
            <button onclick="tryDirectVideo()">Try Direct Video Load</button>
            <button onclick="tryProxyVideo()">Try Proxy Video Load</button>
            <button onclick="openInNewTab()">Open in New Tab</button>
        </div>
        
        <div style="margin: 15px 0;">
            <button onclick="goToNextFrame()">Next Frame</button>
            <button onclick="goToPreviousFrame()">Previous Frame</button>
            <button onclick="togglePlayPause()">Play/Pause</button>
        </div>
        
        <div id="frameInfo" style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <strong>Current Frame:</strong> <span id="currentFrame">0</span> / <span id="totalFrames">314</span><br>
            <strong>Video Time:</strong> <span id="videoTime">0.000s</span>
        </div>
    </div>

    <div class="container">
        <h2>🔍 Debug Log</h2>
        <div id="debug-log" class="debug-log"></div>
    </div>

    <script>
        // Configuration - Using PROCESSED video (post-analysis with overlays)
        const ACCOUNT_ID = 'f2b0714a082195118f53d0b8327f6635';
        const VIDEO_ID = '0dcb9daa132905082aa699d4e984c214'; // Processed video with analytics overlays
        const API_TOKEN = 'DEmkpIDn5SLgpjTOoDqYrPivnOpD9gnqbVICwzTQ';
        
        let downloadUrl = null;
        let currentFrameIndex = 0;
        let frameData = [];
        let isPlaying = false;
        let frameInterval = null;

        // Debug logging
        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logElement = document.getElementById('debug-log');
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            logEntry.innerHTML = `[${timestamp}] ${message}`;
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight;
            console.log(`[${type.toUpperCase()}] ${message}`);
        }

        // Show status message
        function showStatus(statusId, message, type = 'info') {
            const statusElement = document.getElementById(statusId);
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }

        // Enable download
        async function enableDownload() {
            log(`Enabling download for video ${VIDEO_ID}...`);
            showStatus('status1', 'Enabling download...', 'info');
            
            try {
                const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${VIDEO_ID}/downloads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_TOKEN}`
                    },
                    body: JSON.stringify({})
                });
                
                const data = await response.json();
                log('API Response: ' + JSON.stringify(data, null, 2));
                
                if (data.success) {
                    log('✅ Download enabled successfully!', 'success');
                    showStatus('status1', '✅ Download enabled successfully!', 'success');
                    
                    // Check download status
                    setTimeout(() => {
                        checkDownloadStatus();
                    }, 2000);
                } else {
                    log(`❌ Failed to enable download: ${data.errors ? data.errors.map(e => e.message).join(', ') : 'Unknown error'}`, 'error');
                    showStatus('status1', `❌ Failed to enable download: ${data.errors ? data.errors.map(e => e.message).join(', ') : 'Unknown error'}`, 'error');
                }
                
            } catch (error) {
                log(`❌ Network Error: ${error.message}`, 'error');
                showStatus('status1', `❌ Network Error: ${error.message}`, 'error');
            }
        }

        // Check download status
        async function checkDownloadStatus() {
            log(`Checking download status for video ${VIDEO_ID}...`);
            showStatus('status1', 'Checking download status...', 'info');
            
            try {
                const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/${VIDEO_ID}/downloads`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API_TOKEN}`
                    }
                });
                
                const data = await response.json();
                log('Download Status Response: ' + JSON.stringify(data, null, 2));
                
                if (data.success && data.result) {
                    const downloads = data.result;
                    if (downloads.default) {
                        downloadUrl = downloads.default.url;
                        log(`✅ Download URL found: ${downloadUrl}`, 'success');
                        showStatus('status1', '✅ Download URL ready!', 'success');
                        
                        // Show download info
                        document.getElementById('downloadUrl').textContent = downloadUrl;
                        document.getElementById('downloadStatus').textContent = 'Ready';
                        document.getElementById('downloadInfo').style.display = 'block';
                        
                        // Load video
                        loadVideo();
                    } else {
                        log('⚠️ Download URL not found in response', 'error');
                        showStatus('status1', '⚠️ Download URL not found', 'error');
                    }
                } else {
                    log(`❌ Failed to get download status: ${data.errors ? data.errors.map(e => e.message).join(', ') : 'Unknown error'}`, 'error');
                    showStatus('status1', `❌ Failed to get download status`, 'error');
                }
                
            } catch (error) {
                log(`❌ Network Error: ${error.message}`, 'error');
                showStatus('status1', `❌ Network Error: ${error.message}`, 'error');
            }
        }

        // Test download URL accessibility
        async function testDownloadUrl() {
            if (!downloadUrl) {
                log('❌ No download URL available. Please enable download first.', 'error');
                return;
            }
            
            log(`🔍 Testing download URL: ${downloadUrl}`);
            showStatus('status1', 'Testing download URL...', 'info');
            
            try {
                const response = await fetch(downloadUrl, { method: 'HEAD' });
                log(`🔍 Download URL test result: ${response.status} ${response.statusText}`);
                log(`🔍 Content-Type: ${response.headers.get('content-type')}`);
                log(`🔍 Content-Length: ${response.headers.get('content-length')}`);
                log(`🔍 Last-Modified: ${response.headers.get('last-modified')}`);
                
                if (response.ok) {
                    log('✅ Download URL is accessible!', 'success');
                    showStatus('status1', '✅ Download URL is accessible!', 'success');
                } else {
                    log(`❌ Download URL not accessible: ${response.status}`, 'error');
                    showStatus('status1', `❌ Download URL not accessible: ${response.status}`, 'error');
                }
            } catch (error) {
                log(`❌ Download URL test failed: ${error.message}`, 'error');
                showStatus('status1', `❌ Download URL test failed: ${error.message}`, 'error');
            }
        }

        // Load video with download URL
        function loadVideo() {
            if (downloadUrl) {
                log(`Loading video with download URL: ${downloadUrl}`);
                
                const video = document.getElementById('video');
                const videoSource = document.getElementById('videoSource');
                
                // Add event listeners for debugging
                video.addEventListener('loadstart', () => {
                    log('🎬 Video load started');
                });
                
                video.addEventListener('loadedmetadata', () => {
                    log(`🎬 Video metadata loaded - Duration: ${video.duration}s, Size: ${video.videoWidth}x${video.videoHeight}`);
                });
                
                video.addEventListener('loadeddata', () => {
                    log('🎬 Video data loaded - ready to play');
                    showStatus('status2', '✅ Video loaded - ready for frame-by-frame navigation!', 'success');
                });
                
                video.addEventListener('canplay', () => {
                    log('🎬 Video can start playing');
                });
                
                video.addEventListener('error', (e) => {
                    log(`❌ Video error: ${e.target.error?.code} - ${e.target.error?.message}`, 'error');
                    showStatus('status2', `❌ Video error: ${e.target.error?.message}`, 'error');
                });
                
                video.addEventListener('stalled', () => {
                    log('⚠️ Video stalled - network issue?', 'warning');
                });
                
                // Test if the download URL is accessible
                log('🔍 Testing download URL accessibility...');
                fetch(downloadUrl, { method: 'HEAD' })
                    .then(response => {
                        log(`🔍 Download URL test: ${response.status} ${response.statusText}`);
                        log(`🔍 Content-Type: ${response.headers.get('content-type')}`);
                        log(`🔍 Content-Length: ${response.headers.get('content-length')}`);
                        
                        if (response.ok) {
                            // Set the source and load
                            videoSource.src = downloadUrl;
                            video.load();
                        } else {
                            log(`❌ Download URL not accessible: ${response.status}`, 'error');
                            showStatus('status2', `❌ Download URL not accessible: ${response.status}`, 'error');
                        }
                    })
                    .catch(error => {
                        log(`❌ Download URL test failed: ${error.message}`, 'error');
                        showStatus('status2', `❌ Download URL test failed: ${error.message}`, 'error');
                    });
                
                // Generate mock frame data
                generateFrameData();
            } else {
                log('❌ No download URL available', 'error');
                showStatus('status2', '❌ No download URL available', 'error');
            }
        }

        // Try direct video load (bypass CORS)
        function tryDirectVideo() {
            if (!downloadUrl) {
                log('❌ No download URL available', 'error');
                return;
            }
            
            log('🎬 Trying direct video load...');
            const video = document.getElementById('video');
            const videoSource = document.getElementById('videoSource');
            
            // Remove crossorigin attribute
            video.removeAttribute('crossorigin');
            videoSource.src = downloadUrl;
            video.load();
        }

        // Try proxy video load through backend
        function tryProxyVideo() {
            if (!downloadUrl) {
                log('❌ No download URL available', 'error');
                return;
            }
            
            log('🎬 Trying proxy video load through backend...');
            const video = document.getElementById('video');
            const videoSource = document.getElementById('videoSource');
            
            // Try to proxy through the backend
            const proxyUrl = `http://localhost:5004/proxyVideo?url=${encodeURIComponent(downloadUrl)}`;
            log(`🎬 Proxy URL: ${proxyUrl}`);
            
            videoSource.src = proxyUrl;
            video.load();
        }

        // Open video in new tab
        function openInNewTab() {
            if (!downloadUrl) {
                log('❌ No download URL available', 'error');
                return;
            }
            
            log('🎬 Opening video in new tab...');
            window.open(downloadUrl, '_blank');
        }

        // Generate mock frame data
        function generateFrameData() {
            frameData = [];
            for (let i = 0; i < 314; i++) {
                frameData.push({
                    frame_number: i + 1,
                    timestamp: i * 0.033, // ~30 FPS
                    video_time: i * 0.033
                });
            }
            log(`Generated ${frameData.length} frame data points`);
            updateFrameDisplay();
        }

        // Frame navigation
        function goToNextFrame() {
            if (currentFrameIndex < frameData.length - 1) {
                currentFrameIndex++;
                seekToFrameTime();
                updateFrameDisplay();
            }
        }

        function goToPreviousFrame() {
            if (currentFrameIndex > 0) {
                currentFrameIndex--;
                seekToFrameTime();
                updateFrameDisplay();
            }
        }

        function seekToFrameTime() {
            const video = document.getElementById('video');
            const frame = frameData[currentFrameIndex];
            if (video && frame) {
                log(`Seeking to frame ${frame.frame_number} at time ${frame.video_time}s`);
                video.currentTime = frame.video_time;
            }
        }

        function updateFrameDisplay() {
            const frame = frameData[currentFrameIndex];
            if (frame) {
                document.getElementById('currentFrame').textContent = frame.frame_number;
                document.getElementById('videoTime').textContent = frame.video_time.toFixed(3) + 's';
            }
        }

        function togglePlayPause() {
            const video = document.getElementById('video');
            if (video.paused) {
                video.play();
                log('Video playing');
            } else {
                video.pause();
                log('Video paused');
            }
        }

        // Initialize
        window.addEventListener('load', () => {
            log('Enable Download Test initialized');
            log('Click "Enable Download" to start');
        });
    </script>
</body>
</html>
