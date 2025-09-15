// API client for Gymnastics Analytics Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';

export interface HealthStatus {
  status: string;
  mediapipe_server: string;
  timestamp: string;
}

export interface VideoInfo {
  original_filename: string;
  processed_filename: string;
  file_size_mb: number;
  analysis_type: string;
  has_analytics: boolean;
}

export interface ProcessedVideosResponse {
  success: boolean;
  processed_videos: VideoInfo[];
}

export interface JobStatus {
  status: 'processing' | 'completed' | 'failed';
  video_filename: string;
  start_time: string;
  end_time?: string;
  progress: number;
  analytics_file?: string;
  total_frames?: number;
  frames_processed?: number;
  overlay_video?: string;
  overlay_success?: boolean;
  overlay_message?: string;
  error?: string;
}

export interface PerFrameJobStatus {
  success: boolean;
  job_id: string;
  message: string;
  video_filename: string;
}

export interface EnhancedFrameData {
  frame_number: number;
  timestamp: number;
  tumbling_detected: boolean;
  flight_phase: string;
  height_from_ground: number;
  elevation_angle: number;
  forward_lean_angle: number;
  tumbling_quality: number;
  landmark_confidence: number;
  acl_risk_factors: {
    knee_angle_risk: number;
    knee_valgus_risk: number;
    landing_mechanics_risk: number;
    overall_acl_risk: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  };
  acl_recommendations: string[];
  com_position?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface EnhancedStatistics {
  tumbling_detection: {
    total_tumbling_frames: number;
    tumbling_percentage: number;
    flight_phases: {
      ground: number;
      preparation: number;
      takeoff: number;
      flight: number;
      landing: number;
    };
  };
  acl_risk_analysis: {
    average_overall_risk: number;
    average_knee_angle_risk: number;
    average_knee_valgus_risk: number;
    average_landing_mechanics_risk: number;
    risk_level_distribution: {
      LOW: number;
      MODERATE: number;
      HIGH: number;
    };
    high_risk_frames: number;
  };
  movement_analysis: {
    average_elevation_angle: number;
    max_elevation_angle: number;
    average_forward_lean_angle: number;
    max_forward_lean_angle: number;
    average_height_from_ground: number;
    max_height_from_ground: number;
  };
  tumbling_quality: {
    average_quality: number;
    max_quality: number;
    quality_frames_count: number;
  };
}

export interface PerFrameStatistics {
  success: boolean;
  video_filename: string;
  total_frames: number;
  fps: number;
  frames_processed: number;
  frame_data: EnhancedFrameData[];
  processing_time: string;
  enhanced_analytics: boolean;
  enhanced_statistics: EnhancedStatistics;
}

export interface ACLRiskFactors {
  knee_angle_risk: number;
  knee_valgus_risk: number;
  landing_mechanics_risk: number;
  overall_acl_risk: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface ACLRiskAnalysis {
  success: boolean;
  video_filename: string;
  risk_factors: ACLRiskFactors;
  recommendations: string[];
  frame_analysis: any[];
}

export interface SummaryStatistics {
  success: boolean;
  total_videos: number;
  total_frames: number;
  average_acl_risk: number;
  risk_distribution: {
    low: number;
    moderate: number;
    high: number;
  };
  top_metrics: {
    average_elevation_angle: number;
    average_flight_time: number;
    average_landing_quality: number;
  };
}

class GymnasticsAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health');
  }

  // Get list of available videos
  async getVideoList(): Promise<(string | { filename?: string; name?: string; size_mb?: number; path?: string })[]> {
    const response = await this.request<{ videos: (string | { filename?: string; name?: string; size_mb?: number; path?: string })[] }>('/getVideoList');
    return response.videos;
  }

  // Upload a new video file
  async uploadVideo(videoFile: File): Promise<{ success: boolean; message: string; filename: string; size_mb: number }> {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    const response = await fetch(`${this.baseURL}/uploadVideo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get processed videos
  async getProcessedVideos(): Promise<ProcessedVideosResponse> {
    return this.request<ProcessedVideosResponse>('/getProcessedVideos');
  }

  // Analyze video (standard analysis)
  async analyzeVideo(videoFilename: string): Promise<{ 
    success: boolean; 
    message: string; 
    job_id: string; 
    output_video: string; 
    analytics_file: string 
  }> {
    return this.request('/analyzeVideo', {
      method: 'POST',
      body: JSON.stringify({ video_filename: videoFilename }),
    });
  }

  // Analyze video per frame (advanced analysis)
  async analyzeVideoPerFrame(videoFilename: string): Promise<PerFrameJobStatus> {
    return this.request<PerFrameJobStatus>('/analyzeVideoPerFrame', {
      method: 'POST',
      body: JSON.stringify({ video_filename: videoFilename }),
    });
  }

  // Get job status for per-frame analysis
  async getPerFrameJobStatus(jobId: string): Promise<JobStatus> {
    return this.request<JobStatus>(`/getJobStatus?job_id=${jobId}`);
  }

  // Get per-frame statistics
  async getPerFrameStatistics(videoFilename: string): Promise<PerFrameStatistics> {
    return this.request<PerFrameStatistics>(`/getPerFrameStatistics?video_filename=${videoFilename}`);
  }

  // Get enhanced frame statistics
  async getEnhancedFrameStatistics(videoFilename: string): Promise<PerFrameStatistics> {
    return this.request<PerFrameStatistics>(`/getPerFrameStatistics?video_filename=${videoFilename}`);
  }

  // Get detailed statistics for a video
  async getStatistics(videoFilename: string): Promise<any> {
    return this.request(`/getStatistics?video_filename=${videoFilename}`);
  }

  // Get summary statistics for all videos
  async getSummaryStatistics(): Promise<SummaryStatistics> {
    return this.request<SummaryStatistics>('/getSummaryStatistics');
  }

  // Get ACL risk analysis
  async getACLRiskAnalysis(videoFilename: string): Promise<ACLRiskAnalysis> {
    return this.request<ACLRiskAnalysis>(`/getACLRiskAnalysis?video_filename=${videoFilename}`);
  }

  // Download processed video
  async downloadVideo(videoFilename: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/downloadVideo?video_filename=${videoFilename}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    return response.blob();
  }

  // Download per-frame video (overlayed)
  async downloadPerFrameVideo(videoFilename: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/downloadPerFrameVideo?video_filename=${videoFilename}`);
    if (!response.ok) {
      throw new Error(`Failed to download per-frame video: ${response.statusText}`);
    }
    return response.blob();
  }

  // Helper method to create download link
  createDownloadLink(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return url;
  }

  // Poll job status until completion
  async pollJobStatus(jobId: string, onProgress?: (status: JobStatus) => void): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getPerFrameJobStatus(jobId);
          onProgress?.(status);
          
          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Job failed'));
          } else {
            // Continue polling
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  // Get all sessions
  async getSessions(): Promise<{ success: boolean; sessions: any[] }> {
    const response = await fetch(`${this.baseURL}/getSessions`);
    if (!response.ok) {
      throw new Error(`Failed to get sessions: ${response.status}`);
    }
    return response.json();
  }

  // Get sessions by user ID
  async getSessionsByUser(userId: string): Promise<{ success: boolean; sessions: any[] }> {
    const response = await fetch(`${this.baseURL}/getSessionsByUser/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get sessions for user: ${response.status}`);
    }
    return response.json();
  }
}

// Export singleton instance
export const gymnasticsAPI = new GymnasticsAPI();

// Export types for use in components
export type {
  HealthStatus,
  VideoInfo,
  ProcessedVideosResponse,
  JobStatus,
  PerFrameJobStatus,
  PerFrameStatistics,
  ACLRiskFactors,
  ACLRiskAnalysis,
  SummaryStatistics,
};
