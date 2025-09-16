'use client';

import { useState } from 'react';
import { useProcessing } from '@/contexts/ProcessingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, BarChart3, Trash2, RotateCcw } from 'lucide-react';

export default function ProcessingTestPanel() {
  const { 
    activeJobs, 
    addJob, 
    removeJob, 
    retryJob, 
    clearCompletedJobs, 
    clearFailedJobs,
    isProcessing,
    hasErrors,
    completedJobsCount,
    failedJobsCount
  } = useProcessing();

  const [testVideoName, setTestVideoName] = useState('test_video.mp4');

  const createTestJob = (type: 'analysis' | 'perFrame') => {
    const jobId = `test-${type}-${Date.now()}`;
    addJob({
      id: jobId,
      videoName: testVideoName,
      type,
      status: 'processing',
      progress: 0,
      maxRetries: 3
    });
  };

  const simulateJobCompletion = (jobId: string) => {
    // This would normally be handled by the polling mechanism
    // For testing, we can manually update job status
    setTimeout(() => {
      // Simulate job completion after 3 seconds
      const job = activeJobs.find(j => j.id === jobId);
      if (job) {
        // In a real scenario, this would be handled by the ProcessingContext polling
        console.log(`Simulating completion for job: ${jobId}`);
      }
    }, 3000);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing System Test Panel</span>
          <div className="flex space-x-2">
            <Badge variant={isProcessing ? 'default' : 'secondary'}>
              {isProcessing ? 'Processing' : 'Idle'}
            </Badge>
            {hasErrors && (
              <Badge variant="destructive">Has Errors</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Controls */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Test Video:</label>
            <input
              type="text"
              value={testVideoName}
              onChange={(e) => setTestVideoName(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="video_name.mp4"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => createTestJob('analysis')}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Play className="h-4 w-4" />
              <span>Test Standard Analysis</span>
            </Button>
            
            <Button 
              onClick={() => createTestJob('perFrame')}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Test Per-Frame Analysis</span>
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-semibold">{activeJobs.length}</div>
            <div className="text-xs text-gray-600">Total Jobs</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-semibold text-blue-600">
              {activeJobs.filter(j => j.status === 'processing').length}
            </div>
            <div className="text-xs text-gray-600">Processing</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-semibold text-green-600">{completedJobsCount}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-lg font-semibold text-red-600">{failedJobsCount}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={clearCompletedJobs}
            size="sm"
            variant="outline"
            disabled={completedJobsCount === 0}
            className="flex items-center space-x-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Completed</span>
          </Button>
          
          <Button 
            onClick={clearFailedJobs}
            size="sm"
            variant="outline"
            disabled={failedJobsCount === 0}
            className="flex items-center space-x-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Failed</span>
          </Button>
        </div>

        {/* Active Jobs List */}
        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Active Jobs:</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activeJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{job.videoName}</span>
                    <Badge variant="outline" className="text-xs">
                      {job.type === 'analysis' ? 'Standard' : 'Per-Frame'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </Badge>
                    {job.progress !== undefined && (
                      <span className="text-xs text-gray-500">{job.progress}%</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryJob(job.id)}
                        className="h-6 w-6 p-0"
                        title="Retry job"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeJob(job.id)}
                      className="h-6 w-6 p-0"
                      title="Remove job"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Test Instructions:</p>
          <ul className="space-y-1">
            <li>• Click "Test Standard Analysis" to create a test analysis job</li>
            <li>• Click "Test Per-Frame Analysis" to create a test per-frame job</li>
            <li>• Jobs will automatically complete after 3 seconds (simulated)</li>
            <li>• Use the GlobalProcessingIndicator (bottom right) to monitor jobs</li>
            <li>• Failed jobs can be retried using the retry button</li>
            <li>• Use clear buttons to remove completed/failed jobs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}





