import { useState, useCallback } from 'react';
import { gymnasticsAPI, type JobStatus, type PerFrameJobStatus, type ProcessedVideosResponse, type ACLRiskAnalysis, type SummaryStatistics } from '@/lib/api';

export interface UseGymnasticsAPIState {
  loading: boolean;
  error: string | null;
  healthStatus: any;
  videoList: (string | { filename?: string; name?: string; size_mb?: number; path?: string })[];
  processedVideos: ProcessedVideosResponse | null;
  currentJob: JobStatus | null;
  aclRiskAnalysis: ACLRiskAnalysis | null;
  summaryStatistics: SummaryStatistics | null;
}

export interface UseGymnasticsAPIActions {
  checkHealth: () => Promise<void>;
  getVideoList: () => Promise<void>;
  getProcessedVideos: () => Promise<void>;
  analyzeVideo: (videoFilename: string) => Promise<void>;
  analyzeVideo1: (videoFilename: string, athleteName?: string, event?: string, sessionName?: string, userId?: string) => Promise<void>;
  analyzeVideoEnhanced: (videoFilename: string, athleteName?: string, event?: string, sessionName?: string, userId?: string) => Promise<void>;
  analyzeVideoPerFrame: (videoFilename: string) => Promise<string | null>;
  pollJobStatus: (jobId: string) => Promise<void>;
  getACLRiskAnalysis: (videoFilename: string) => Promise<void>;
  getSummaryStatistics: () => Promise<void>;
  downloadVideo: (videoFilename: string) => Promise<void>;
  downloadPerFrameVideo: (videoFilename: string) => Promise<void>;
  clearError: () => void;
}

export function useGymnasticsAPI(): UseGymnasticsAPIState & UseGymnasticsAPIActions {
  const [state, setState] = useState<UseGymnasticsAPIState>({
    loading: false,
    error: null,
    healthStatus: null,
    videoList: [],
    processedVideos: null,
    currentJob: null,
    aclRiskAnalysis: null,
    summaryStatistics: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const health = await gymnasticsAPI.checkHealth();
      setState(prev => ({ ...prev, healthStatus: health }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to check health');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getVideoList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const videos = await gymnasticsAPI.getVideoList();
      setState(prev => ({ ...prev, videoList: videos }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get video list');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getProcessedVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const processed = await gymnasticsAPI.getProcessedVideos();
      setState(prev => ({ ...prev, processedVideos: processed }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get processed videos');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const analyzeVideo = useCallback(async (videoFilename: string) => {
    try {
      setLoading(true);
      setError(null);
      await gymnasticsAPI.analyzeVideo(videoFilename);
      // Refresh processed videos after analysis
      await getProcessedVideos();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getProcessedVideos]);

  const analyzeVideo1 = useCallback(async (videoFilename: string, athleteName?: string, event?: string, sessionName?: string, userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      await gymnasticsAPI.analyzeVideo1(videoFilename, athleteName, event, sessionName, userId);
      // Refresh processed videos after analysis
      await getProcessedVideos();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze video with GridFS');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getProcessedVideos]);

  const analyzeVideoEnhanced = useCallback(async (videoFilename: string, athleteName?: string, event?: string, sessionName?: string, userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      await gymnasticsAPI.analyzeVideo1(videoFilename, athleteName, event, sessionName, userId);
      // Refresh processed videos after analysis
      await getProcessedVideos();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to analyze video with enhanced analytics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, getProcessedVideos]);

  const analyzeVideoPerFrame = useCallback(async (videoFilename: string): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await gymnasticsAPI.analyzeVideoPerFrame(videoFilename);
      setState(prev => ({ ...prev, currentJob: { status: 'processing', video_filename: videoFilename, start_time: new Date().toISOString(), progress: 0 } }));
      return result.job_id;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start per-frame analysis');
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await gymnasticsAPI.pollJobStatus(jobId, (jobStatus) => {
        setState(prev => ({ ...prev, currentJob: jobStatus }));
      });
      setState(prev => ({ ...prev, currentJob: status }));
      
      // If job completed successfully, refresh processed videos
      if (status.status === 'completed') {
        await getProcessedVideos();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to poll job status');
    }
  }, [setError, getProcessedVideos]);

  const getACLRiskAnalysis = useCallback(async (videoFilename: string) => {
    try {
      setLoading(true);
      setError(null);
      const analysis = await gymnasticsAPI.getACLRiskAnalysis(videoFilename);
      setState(prev => ({ ...prev, aclRiskAnalysis: analysis }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get ACL risk analysis');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getSummaryStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await gymnasticsAPI.getSummaryStatistics();
      setState(prev => ({ ...prev, summaryStatistics: stats }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get summary statistics');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const downloadVideo = useCallback(async (videoFilename: string) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await gymnasticsAPI.downloadVideo(videoFilename);
      gymnasticsAPI.createDownloadLink(blob, videoFilename);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download video');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const downloadPerFrameVideo = useCallback(async (videoFilename: string) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await gymnasticsAPI.downloadPerFrameVideo(videoFilename);
      gymnasticsAPI.createDownloadLink(blob, `per_frame_${videoFilename}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download per-frame video');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    ...state,
    checkHealth,
    getVideoList,
    getProcessedVideos,
    analyzeVideo,
    analyzeVideo1,
    analyzeVideoEnhanced,
    analyzeVideoPerFrame,
    pollJobStatus,
    getACLRiskAnalysis,
    getSummaryStatistics,
    downloadVideo,
    downloadPerFrameVideo,
    clearError,
  };
}
