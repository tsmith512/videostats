// Demo page HTML template for embedded Stream Player with analytics

export function getDemoPage(videoId: string, workerUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Analytics Demo</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .main-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .video-wrapper {
            position: relative;
            padding-top: 56.25%;
            background: #000;
        }
        
        iframe {
            border: none;
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
        }
        
        .stats-section {
            padding: 30px;
        }
        
        .section-title {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }
        
        #watched {
            position: relative;
            background: #e9ecef;
            height: 40px;
            width: 100%;
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        #watched div {
            position: absolute;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            transition: all 0.3s ease;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            color: white;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .status-container {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .status {
            padding: 12px 16px;
            border-radius: 6px;
            margin: 8px 0;
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
        }
        
        .info-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .info-card h2 {
            color: #667eea;
            margin-bottom: 15px;
        }
        
        .info-card ul {
            list-style: none;
            padding-left: 0;
        }
        
        .info-card li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
        }
        
        .info-card li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #667eea;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Video Analytics Demo</h1>
            <p>Real-time viewing pattern tracking with Cloudflare Stream</p>
        </div>

        <div class="main-card">
            <div class="video-wrapper">
                <iframe
                    src="https://customer-igynxd2rwhmuoxw8.cloudflarestream.com/${videoId}/iframe"
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowfullscreen="true"
                    id="stream-player"
                ></iframe>
            </div>

            <div class="stats-section">
                <h3 class="section-title">Watched Progress</h3>
                <div id="watched"></div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="rangeCount">0</div>
                        <div class="stat-label">Segments</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="coveragePercent">0%</div>
                        <div class="stat-label">Coverage</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="flushCount">0</div>
                        <div class="stat-label">Uploads</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="bucketCount">0</div>
                        <div class="stat-label">Buckets</div>
                    </div>
                </div>

                <h3 class="section-title">Activity Log</h3>
                <div class="status-container" id="statusContainer">
                    <div class="status info">
                        ⏳ Waiting for video to load...
                    </div>
                </div>
            </div>
        </div>

        <div class="info-card">
            <h2>How It Works</h2>
            <ul>
                <li>The Stream Player tracks which parts of the video you watch</li>
                <li>Every 10 seconds, viewing data is sent to the analytics endpoint</li>
                <li>Data is aggregated into 5-second buckets for efficient storage</li>
                <li>Each viewing session increments the video's <code>total_views</code> counter</li>
                <li>Try seeking around the video and watch the progress bar update!</li>
            </ul>
        </div>
    </div>

    <script src="https://embed.cloudflarestream.com/embed/sdk.latest.js"></script>
    <script>
        const ANALYTICS_ENDPOINT = '${workerUrl}';
        const VIDEO_ID = 'demo-${videoId}-' + Date.now();
        const FLUSH_INTERVAL = 10000;

        const player = Stream(document.getElementById('stream-player'));
        const watchedBar = document.getElementById('watched');
        
        let flushCount = 0;
        let lastSentRanges = [];

        player.addEventListener('timeupdate', () => {
            updateWatchedBar();
        });

        player.addEventListener('loadedmetadata', () => {
            showStatus('✓ Stream Player loaded successfully', 'success');
        });

        function updateWatchedBar() {
            watchedBar.innerHTML = '';

            if (!player || !player.played) return;

            for (let i = 0; i < player.played.length; i++) {
                const block = document.createElement('div');
                const startPercent = (player.played.start(i) / player.duration) * 100;
                const endPercent = (player.played.end(i) / player.duration) * 100;
                
                block.style.left = \`\${startPercent}%\`;
                block.style.right = \`\${100 - endPercent}%\`;
                
                watchedBar.appendChild(block);
            }

            document.getElementById('rangeCount').textContent = player.played.length;
            
            let totalWatched = 0;
            for (let i = 0; i < player.played.length; i++) {
                totalWatched += player.played.end(i) - player.played.start(i);
            }
            const coverage = player.duration > 0 ? (totalWatched / player.duration) * 100 : 0;
            document.getElementById('coveragePercent').textContent = coverage.toFixed(1) + '%';
        }

        function extractRanges() {
            const ranges = [];
            for (let i = 0; i < player.played.length; i++) {
                ranges.push({
                    startTime: player.played.start(i),
                    endTime: player.played.end(i)
                });
            }
            return ranges;
        }

        async function sendToAnalytics() {
            const ranges = extractRanges();
            
            if (ranges.length === 0 || JSON.stringify(ranges) === JSON.stringify(lastSentRanges)) {
                return;
            }

            try {
                const response = await fetch(\`\${ANALYTICS_ENDPOINT}/api/track\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        videoId: VIDEO_ID,
                        ranges: ranges
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to track views');
                }

                flushCount++;
                lastSentRanges = ranges;
                
                document.getElementById('flushCount').textContent = flushCount;
                document.getElementById('bucketCount').textContent = data.bucketsUpdated;
                
                showStatus(\`✓ Sent \${ranges.length} ranges, updated \${data.bucketsUpdated} buckets\`, 'success');

            } catch (error) {
                showStatus(\`✗ Error: \${error.message}\`, 'error');
                console.error('Analytics error:', error);
            }
        }

        function showStatus(message, type = 'info') {
            const container = document.getElementById('statusContainer');
            const status = document.createElement('div');
            status.className = \`status \${type}\`;
            status.textContent = message;
            
            container.insertBefore(status, container.firstChild);
            
            if (container.children.length > 5) {
                container.removeChild(container.lastChild);
            }
        }

        setInterval(sendToAnalytics, FLUSH_INTERVAL);

        window.addEventListener('beforeunload', () => {
            const ranges = extractRanges();
            if (ranges.length > 0) {
                navigator.sendBeacon(
                    \`\${ANALYTICS_ENDPOINT}/api/track\`,
                    JSON.stringify({ videoId: VIDEO_ID, ranges })
                );
            }
        });
    </script>
</body>
</html>`;
}
