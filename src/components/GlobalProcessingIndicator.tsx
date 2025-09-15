'use client';

import { useProcessing } from '@/contexts/ProcessingContext';
import { Activity, CheckCircle, XCircle, Clock, RotateCcw, Trash2, AlertTriangle, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { gymnasticsAPI } from '@/lib/api';

export default function GlobalProcessingIndicator() {
  const { 
    activeJobs, 
    isProcessing, 
    hasErrors,
    completedJobsCount,
    failedJobsCount,
    removeJob, 
    retryJob, 
    clearCompletedJobs, 
    clearFailedJobs 
  } = useProcessing();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isProcessing && activeJobs.length === 0) {
    return null;
  }

  const processingJobs = activeJobs.filter(job => job.status === 'processing');
  const completedJobs = activeJobs.filter(job => job.status === 'completed');
  const failedJobs = activeJobs.filter(job => job.status === 'failed');

  const handleDownloadResult = async (job: any) => {
    try {
      if (job.result?.overlayVideo) {
        const blob = await gymnasticsAPI.downloadPerFrameVideo(job.videoName);
        gymnasticsAPI.createDownloadLink(blob, `overlay_${job.videoName}`);
      } else if (job.result?.analyticsFile) {
        // For standard analysis, download the processed video
        const blob = await gymnasticsAPI.downloadVideo(job.videoName);
        gymnasticsAPI.createDownloadLink(blob, `processed_${job.videoName}`);
      }
    } catch (error) {
      console.error('Error downloading result:', error);
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Activity className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-lg border-2 ${
        hasErrors ? 'border-red-200' : isProcessing ? 'border-blue-200' : 'border-green-200'
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {hasErrors ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : isProcessing ? (
                <Activity className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <span>Background Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {activeJobs.length} jobs
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? '−' : '+'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">

          {/* Summary */}
          <div className="flex flex-wrap gap-2 mb-3">
            {processingJobs.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {processingJobs.length} processing
              </Badge>
            )}
            {completedJobs.length > 0 && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {completedJobs.length} completed
              </Badge>
            )}
            {failedJobs.length > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {failedJobs.length} failed
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {(completedJobs.length > 0 || failedJobs.length > 0) && (
            <div className="flex space-x-2 mb-3">
              {completedJobs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompletedJobs}
                  className="text-xs h-6"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Completed
                </Button>
              )}
              {failedJobs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFailedJobs}
                  className="text-xs h-6"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Failed
                </Button>
              )}
            </div>
          )}

          {/* Expanded Job List */}
          {isExpanded && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-2 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className="text-xs font-medium truncate">
                        {job.videoName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {job.status === 'completed' && job.result && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadResult(job)}
                          className="h-5 w-5 p-0"
                          title="Download result"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryJob(job.id)}
                          className="h-5 w-5 p-0"
                          title="Retry job"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeJob(job.id)}
                        className="h-5 w-5 p-0"
                        title="Remove job"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`text-xs ${getStatusColor(job.status)}`}>
                      {job.type === 'analysis' ? 'Standard Analysis' : 'Per-Frame Analysis'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {job.progress}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDuration(job.startTime, job.endTime)}
                      </span>
                    </div>
                  </div>

                  {job.status === 'processing' && (
                    <Progress value={job.progress} className="h-1" />
                  )}

                  {job.result && job.status === 'completed' && (
                    <div className="text-xs text-gray-600 mt-1">
                      {job.result.totalFrames && (
                        <span>Frames: {job.result.framesProcessed}/{job.result.totalFrames}</span>
                      )}
                    </div>
                  )}

                  {job.error && (
                    <p className="text-xs text-red-600 mt-1 truncate" title={job.error}>
                      {job.error}
                    </p>
                  )}

                  {job.retryCount && job.retryCount > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Retry attempt: {job.retryCount}/{job.maxRetries}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Collapsed Summary */}
          {!isExpanded && (
            <div className="space-y-2">
              {processingJobs.slice(0, 2).map((job) => (
                <div key={job.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <span className="text-xs truncate max-w-32">
                      {job.videoName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {job.progress}%
                  </span>
                </div>
              ))}
              {processingJobs.length > 2 && (
                <p className="text-xs text-gray-500 text-center">
                  +{processingJobs.length - 2} more processing
                </p>
              )}
              {completedJobs.length > 0 && (
                <p className="text-xs text-green-600 text-center">
                  {completedJobs.length} completed
                </p>
              )}
              {failedJobs.length > 0 && (
                <p className="text-xs text-red-600 text-center">
                  {failedJobs.length} failed
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}














