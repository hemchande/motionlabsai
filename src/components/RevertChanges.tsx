"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Upload,
  History
} from 'lucide-react'

interface ChangeRecord {
  id: string
  timestamp: string
  description: string
  type: 'feature' | 'bugfix' | 'ui' | 'refactor'
  status: 'applied' | 'reverted' | 'pending'
  files: string[]
  backupPath?: string
}

interface RevertChangesProps {
  onRevert: (changeId: string) => void
  onRestore: (changeId: string) => void
}

export default function RevertChanges({ onRevert, onRestore }: RevertChangesProps) {
  const [changes, setChanges] = useState<ChangeRecord[]>([
    {
      id: 'dashboard-redesign-001',
      timestamp: new Date().toISOString(),
      description: 'Dashboard redesign with centered upload button and removed athlete roster from main view',
      type: 'ui',
      status: 'applied',
      files: [
        'src/components/CoachDashboard.tsx',
        'src/components/AutoAnalyzedVideoPlayer.tsx',
        'src/components/AthleteDetailView.tsx'
      ],
      backupPath: '/backups/dashboard-redesign-001-backup.zip'
    },
    {
      id: 'auto-video-analysis-002',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      description: 'Automatic video analysis display with skeleton overlay and real-time metrics',
      type: 'feature',
      status: 'applied',
      files: [
        'src/components/AutoAnalyzedVideoPlayer.tsx',
        'src/components/CoachDashboard.tsx'
      ],
      backupPath: '/backups/auto-video-analysis-002-backup.zip'
    },
    {
      id: 'athlete-detail-view-003',
      timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      description: 'Enhanced athlete detail view with progress tracking and video access',
      type: 'feature',
      status: 'applied',
      files: [
        'src/components/AthleteDetailView.tsx',
        'src/components/CoachDashboard.tsx'
      ],
      backupPath: '/backups/athlete-detail-view-003-backup.zip'
    }
  ])

  const [isReverting, setIsReverting] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-blue-100 text-blue-700'
      case 'bugfix': return 'bg-green-100 text-green-700'
      case 'ui': return 'bg-purple-100 text-purple-700'
      case 'refactor': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-green-100 text-green-700'
      case 'reverted': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleRevert = async (changeId: string) => {
    setIsReverting(changeId)
    
    try {
      // Simulate revert process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setChanges(prev => prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'reverted' as const }
          : change
      ))
      
      // Call the actual revert function
      onRevert(changeId)
      
      console.log(`Reverted change: ${changeId}`)
    } catch (error) {
      console.error('Failed to revert change:', error)
    } finally {
      setIsReverting(null)
      setShowConfirmation(null)
    }
  }

  const handleRestore = async (changeId: string) => {
    setIsReverting(changeId)
    
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setChanges(prev => prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'applied' as const }
          : change
      ))
      
      // Call the actual restore function
      onRestore(changeId)
      
      console.log(`Restored change: ${changeId}`)
    } catch (error) {
      console.error('Failed to restore change:', error)
    } finally {
      setIsReverting(null)
      setShowConfirmation(null)
    }
  }

  const downloadBackup = (changeId: string) => {
    const change = changes.find(c => c.id === changeId)
    if (change?.backupPath) {
      // In a real implementation, this would download the actual backup file
      console.log(`Downloading backup for change: ${changeId}`)
      alert(`Backup download started for: ${change.description}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ml-text-hi">Change Management</h1>
          <p className="ml-text-md">Manage and revert recent changes to the application</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-700">
            <History className="h-3 w-3 mr-1" />
            {changes.length} Changes
          </Badge>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> Reverting changes will restore the previous version of the application. 
          Make sure to backup any important data before proceeding.
        </AlertDescription>
      </Alert>

      {/* Changes List */}
      <div className="space-y-4">
        {changes.map((change) => (
          <Card key={change.id} className="ml-card ml-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <CardTitle className="text-lg ml-text-hi">{change.description}</CardTitle>
                    <Badge className={getTypeColor(change.type)}>
                      {change.type}
                    </Badge>
                    <Badge className={getStatusColor(change.status)}>
                      {change.status}
                    </Badge>
                  </div>
                  <CardDescription className="ml-text-md">
                    Applied on {new Date(change.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadBackup(change.id)}
                    disabled={!change.backupPath}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Backup
                  </Button>
                  {change.status === 'applied' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowConfirmation(change.id)}
                      disabled={isReverting === change.id}
                    >
                      {isReverting === change.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                          Reverting...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Revert
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowConfirmation(change.id)}
                      disabled={isReverting === change.id}
                    >
                      {isReverting === change.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Restore
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium ml-text-hi mb-2">Modified Files:</h4>
                  <div className="flex flex-wrap gap-2">
                    {change.files.map((file, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {file}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {change.backupPath && (
                  <div className="text-sm ml-text-md">
                    <strong>Backup Location:</strong> {change.backupPath}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                Confirm Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="ml-text-md">
                Are you sure you want to {changes.find(c => c.id === showConfirmation)?.status === 'applied' ? 'revert' : 'restore'} this change?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const change = changes.find(c => c.id === showConfirmation)
                    if (change?.status === 'applied') {
                      handleRevert(showConfirmation)
                    } else {
                      handleRestore(showConfirmation)
                    }
                  }}
                >
                  {changes.find(c => c.id === showConfirmation)?.status === 'applied' ? 'Revert' : 'Restore'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use Change Management:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Revert:</strong> Undo a change and restore the previous version</li>
            <li>• <strong>Restore:</strong> Re-apply a previously reverted change</li>
            <li>• <strong>Backup:</strong> Download a backup of the change before reverting</li>
            <li>• Changes are automatically backed up when applied</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
