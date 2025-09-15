'use client';

import { useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import UploadCenter from '@/components/UploadCenter';

interface UploadedVideo {
  id: string;
  name: string;
  file: File;
  url: string;
  athlete: string;
  event: string;
  session: string;
  notes: string;
  uploadDate: string;
  duration?: string;
  size: number;
  status: string;
  motionIQ?: number;
  analysisJobId?: string;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  analysisProgress?: number;
  perFrameJobId?: string;
  perFrameStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  perFrameProgress?: number;
}

export default function UploadDemoPage() {
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);

  const handleVideoUpload = (video: UploadedVideo) => {
    setUploadedVideos(prev => {
      const existingIndex = prev.findIndex(v => v.id === video.id);
      if (existingIndex >= 0) {
        // Update existing video
        const updated = [...prev];
        updated[existingIndex] = video;
        return updated;
      } else {
        // Add new video
        return [...prev, video];
      }
    });
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Frame-by-Frame Analysis Demo
          </h1>
          <p className="text-gray-600">
            Upload videos and run both standard and frame-by-frame analysis with real-time progress tracking.
          </p>
        </div>

        <UploadCenter 
          onVideoUpload={handleVideoUpload}
          uploadedVideos={uploadedVideos}
        />

        {/* Demo Instructions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">How to Test Frame-by-Frame Analysis:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Upload a video file using the drag-and-drop area or file browser</li>
            <li>Fill in the metadata (athlete name, event, session, notes)</li>
            <li>Switch to the "Analysis Jobs" tab to see your uploaded video</li>
            <li>Click "Start Analysis" to run standard analysis</li>
            <li>Click "Start Per-Frame" to run frame-by-frame analysis</li>
            <li>Monitor real-time progress with progress bars</li>
            <li>Download completed analysis videos from the "Results" tab</li>
          </ol>
        </div>

        {/* Backend Status */}
        <div className="mt-8 p-6 bg-gray-100 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Backend Status:</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">API Server: Running on port 5004</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">MediaPipe Server: May be starting up</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Note: Frame-by-frame analysis requires both servers to be running. 
            The MediaPipe server may take a moment to start up.
          </p>
        </div>
      </div>
    </LayoutWrapper>
  );
}
