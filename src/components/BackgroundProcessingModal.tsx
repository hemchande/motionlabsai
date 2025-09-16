'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Video, 
  BarChart3,
  X,
  RefreshCw
} from 'lucide-react';
import { useProcessing } from '@/contexts/ProcessingContext';

interface BackgroundProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackgroundProcessingModal({ isOpen, onClose }: BackgroundProcessingModalProps) {
  const { 
    activeJobs, 
    isProcessing, 
    hasErrors, 
    completedJobsCount, 
    failedJobsCount,
    clearCompletedJobs,
    clearFailedJobs,
    retryJob
  } = useProcessing();

  const [showDetails, setShowDetails] = useState(false);

  const processingJobs = activeJobs.filter(job => job.status === 'processing');
  const completedJobs = activeJobs.filter(job => job.status === 'completed');
  const failedJobs = activeJobs.filter(job => job.status === 'failed');

  const getJobIcon = (type: 'analysis' | 'perFrame') => {
    return type === 'analysis' ? <Video className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Activity className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span>Background Processing</span>
                  </CardTitle>
                  <CardDescription>
                    {isProcessing 
                      ? `${processingJobs.length} job${processingJobs.length !== 1 ? 's' : ''} currently processing`
                      : 'All processing jobs completed'
                    }
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {processingJobs.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Processing</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {completedJobsCount}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {failedJobsCount}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
                  </div>
                </div>

                {/* Toggle Details */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>

                {/* Job Details */}
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3"
                  >
                    {/* Processing Jobs */}
                    {processingJobs.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Currently Processing
                        </h4>
                        <div className="space-y-2">
                          {processingJobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getJobIcon(job.type)}
                                <div>
                                  <div className="font-medium text-sm">{job.videoName}</div>
                                  <div className="text-xs text-gray-500">
                                    {job.type === 'analysis' ? 'Standard Analysis' : 'Per-Frame Analysis'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(job.status)}
                                <div className="text-xs text-gray-500">
                                  {formatDuration(job.startTime)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Jobs */}
                    {completedJobs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            Recently Completed
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCompletedJobs}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {completedJobs.slice(0, 3).map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getJobIcon(job.type)}
                                <div>
                                  <div className="font-medium text-sm">{job.videoName}</div>
                                  <div className="text-xs text-gray-500">
                                    {job.type === 'analysis' ? 'Standard Analysis' : 'Per-Frame Analysis'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(job.status)}
                                <div className="text-xs text-gray-500">
                                  {formatDuration(job.startTime, job.endTime)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Failed Jobs */}
                    {failedJobs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            Failed Jobs
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFailedJobs}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {failedJobs.slice(0, 3).map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getJobIcon(job.type)}
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{job.videoName}</div>
                                  <div className="text-xs text-gray-500">
                                    {job.type === 'analysis' ? 'Standard Analysis' : 'Per-Frame Analysis'}
                                  </div>
                                  {job.error && (
                                    <div className="text-xs text-red-600 mt-1 truncate">
                                      {job.error}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => retryJob(job.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                {getStatusIcon(job.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

