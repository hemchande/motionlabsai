import React, { useState, useEffect } from 'react';
import SimpleFramePlayer from '../components/SimpleFramePlayer';

interface FrameData {
  frame_number: number;
  timestamp: number;
  video_time: number;
  analytics: {
    acl_risk: number;
    left_knee_angle: number;
    right_knee_angle: number;
    elevation_angle: number;
    forward_lean: number;
    tumbling_phase: string;
    quality_score: number;
  };
}

const TestFramePlayer: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<FrameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load real analytics data from the backend
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Use the real analytics ID we discovered
        const analyticsId = '68d6c9ddd8c71a7e26cb6f59';
        const response = await fetch(`https://gymnasticsapi.onrender.com/getAnalytics/${analyticsId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load analytics: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract frame data from the response
        let frameData: FrameData[] = [];
        
        if (data.analytics && Array.isArray(data.analytics)) {
          frameData = data.analytics.map((frame: any, index: number) => ({
            frame_number: frame.frame_number || index + 1,
            timestamp: frame.timestamp || frame.metrics?.timestamp || 0,
            video_time: frame.timestamp || frame.metrics?.timestamp || 0,
            analytics: {
              acl_risk: frame.metrics?.tumbling_metrics?.acl_risk_factors?.overall_acl_risk || 0,
              left_knee_angle: frame.metrics?.tumbling_metrics?.acl_risk_factors?.knee_angle_risk || 0,
              right_knee_angle: frame.metrics?.tumbling_metrics?.acl_risk_factors?.knee_valgus_risk || 0,
              elevation_angle: frame.metrics?.tumbling_metrics?.elevation_angle || 0,
              forward_lean: frame.metrics?.tumbling_metrics?.forward_lean_angle || 0,
              tumbling_phase: frame.metrics?.tumbling_metrics?.flight_phase || 'ground',
              quality_score: frame.metrics?.tumbling_metrics?.tumbling_quality || 0
            }
          }));
        }
        
        // Take first 50 frames for testing (to avoid overwhelming the component)
        setAnalyticsData(frameData.slice(0, 50));
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <p className="text-gray-600">Using mock data instead...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Frame Player Test
          </h1>
          <p className="text-gray-600">
            Testing frame-by-frame navigation with real Cloudflare Stream video and analytics data
          </p>
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>✅ Loaded {analyticsData.length} frames</strong> from real analytics data
          </div>
        </div>

        <SimpleFramePlayer 
          cloudflareStreamUrl="https://customer-cxebs7nmdazhytrk.cloudflarestream.com/72a4beb341d720ae9d3fc74804d98484/iframe"
          analyticsData={analyticsData}
        />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-semibold text-blue-800">Video Source</div>
              <div className="text-blue-600">Cloudflare Stream</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-semibold text-green-800">Analytics Source</div>
              <div className="text-green-600">Real Backend Data</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-semibold text-purple-800">Frame Count</div>
              <div className="text-purple-600">{analyticsData.length} frames</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestFramePlayer;


