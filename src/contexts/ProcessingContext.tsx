'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { gymnasticsAPI } from '@/lib/api';

interface ProcessingJob {
  id: string;
  videoName: string;
  type: 'analysis' | 'perFrame';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: {
    analyticsFile?: string;
    overlayVideo?: string;
    totalFrames?: number;
    framesProcessed?: number;
  };
  retryCount?: number;
  maxRetries?: number;
}

interface ProcessingContextType {
  activeJobs: ProcessingJob[];
  addJob: (job: Omit<ProcessingJob, 'startTime' | 'retryCount'>) => void;
  updateJob: (jobId: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => ProcessingJob | undefined;
  retryJob: (jobId: string) => void;
  clearCompletedJobs: () => void;
  clearFailedJobs: () => void;
  isProcessing: boolean;
  hasErrors: boolean;
  completedJobsCount: number;
  failedJobsCount: number;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [activeJobs, setActiveJobs] = useState<ProcessingJob[]>([]);

  // Enhanced polling with better error handling and retry logic
  useEffect(() => {
    const pollJobs = async () => {
      const jobsToUpdate = activeJobs.filter(job => job.status === 'processing');
      
      for (const job of jobsToUpdate) {
        try {
          if (job.type === 'analysis') {
            // Standard analysis jobs complete immediately on the backend
            // Mark them as completed after a short delay to simulate processing
            const jobAge = Date.now() - job.startTime.getTime();
            if (jobAge > 3000) { // 3 seconds
              setActiveJobs(prev => prev.map(j => 
                j.id === job.id 
                  ? { 
                      ...j, 
                      status: 'completed', 
                      progress: 100,
                      endTime: new Date()
                    }
                  : j
              ));
            }
          } else if (job.type === 'perFrame') {
            // Per-frame analysis jobs can be polled for status
            try {
              const status = await gymnasticsAPI.getPerFrameJobStatus(job.id);
              
              setActiveJobs(prev => prev.map(j => 
                j.id === job.id 
                  ? { 
                      ...j, 
                      status: status.status, 
                      progress: status.progress || j.progress,
                      error: status.error,
                      result: {
                        analyticsFile: status.analytics_file,
                        overlayVideo: status.overlay_video,
                        totalFrames: status.total_frames,
                        framesProcessed: status.frames_processed
                      },
                      endTime: status.status === 'completed' || status.status === 'failed' ? new Date() : undefined
                    }
                  : j
              ));
            } catch (error) {
              console.error(`Error polling job ${job.id}:`, error);
              
              // Increment retry count
              const currentJob = activeJobs.find(j => j.id === job.id);
              const retryCount = (currentJob?.retryCount || 0) + 1;
              const maxRetries = currentJob?.maxRetries || 3;
              
              if (retryCount >= maxRetries) {
                // Mark job as failed after max retries
                setActiveJobs(prev => prev.map(j => 
                  j.id === job.id 
                    ? { 
                        ...j, 
                        status: 'failed', 
                        error: `Job failed after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        endTime: new Date()
                      }
                    : j
                ));
              } else {
                // Update retry count but keep processing
                setActiveJobs(prev => prev.map(j => 
                  j.id === job.id 
                    ? { ...j, retryCount }
                    : j
                ));
              }
            }
          }
        } catch (error) {
          console.error(`Unexpected error polling job ${job.id}:`, error);
        }
      }
    };

    if (activeJobs.some(job => job.status === 'processing')) {
      const interval = setInterval(pollJobs, 2000);
      return () => clearInterval(interval);
    }
  }, [activeJobs]);

  const addJob = useCallback((job: Omit<ProcessingJob, 'startTime' | 'retryCount'>) => {
    const newJob: ProcessingJob = {
      ...job,
      startTime: new Date(),
      retryCount: 0,
      maxRetries: job.maxRetries || 3
    };
    setActiveJobs(prev => [...prev, newJob]);
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<ProcessingJob>) => {
    setActiveJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setActiveJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getJob = useCallback((jobId: string) => {
    return activeJobs.find(job => job.id === jobId);
  }, [activeJobs]);

  const retryJob = useCallback((jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (job && job.status === 'failed') {
      setActiveJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              status: 'processing', 
              progress: 0, 
              error: undefined, 
              retryCount: 0,
              startTime: new Date(),
              endTime: undefined
            }
          : j
      ));
    }
  }, [activeJobs]);

  const clearCompletedJobs = useCallback(() => {
    setActiveJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  const clearFailedJobs = useCallback(() => {
    setActiveJobs(prev => prev.filter(job => job.status !== 'failed'));
  }, []);

  const isProcessing = activeJobs.some(job => job.status === 'processing');
  const hasErrors = activeJobs.some(job => job.status === 'failed');
  const completedJobsCount = activeJobs.filter(job => job.status === 'completed').length;
  const failedJobsCount = activeJobs.filter(job => job.status === 'failed').length;

  return (
    <ProcessingContext.Provider value={{
      activeJobs,
      addJob,
      updateJob,
      removeJob,
      getJob,
      retryJob,
      clearCompletedJobs,
      clearFailedJobs,
      isProcessing,
      hasErrors,
      completedJobsCount,
      failedJobsCount
    }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}






