'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  BarChart3,
  Target,
  Zap,
  Users,
  Clock,
  Video
} from 'lucide-react';

interface EnhancedFrameData {
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

interface EnhancedStatistics {
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

interface EnhancedFrameStatisticsProps {
  videoFilename: string;
  frameData: EnhancedFrameData[];
  enhancedStats: EnhancedStatistics;
  totalFrames: number;
  fps: number;
}

export function EnhancedFrameStatistics({ 
  videoFilename, 
  frameData, 
  enhancedStats, 
  totalFrames, 
  fps 
}: EnhancedFrameStatisticsProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [summarySize, setSummarySize] = useState<'compact' | 'normal' | 'expanded'>('normal');
  const [componentSize, setComponentSize] = useState<'small' | 'medium' | 'large'>('medium');

  const currentFrame = frameData[currentFrameIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentFrameIndex < frameData.length - 1) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => {
          if (prev >= frameData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, (1000 / fps) / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentFrameIndex, frameData.length, fps, playbackSpeed]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'MODERATE': return 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40';
      case 'HIGH': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getFlightPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ground': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'preparation': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'takeoff': return 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40';
      case 'flight': return 'bg-cyan-300/40 text-cyan-100 border-cyan-300/50';
      case 'landing': return 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getComponentSizeClasses = () => {
    switch (componentSize) {
      case 'small':
        return 'text-xs space-y-3';
      case 'medium':
        return 'text-sm space-y-6';
      case 'large':
        return 'text-base space-y-8';
      default:
        return 'text-sm space-y-6';
    }
  };

  return (
    <div className={getComponentSizeClasses()}>

      {/* Frame Playback Controls */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Play className="h-5 w-5 text-cyan-400" />
            <span>Frame Playback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Frame {currentFrameIndex + 1} of {frameData.length}</span>
                <span>{formatTime(currentFrame?.timestamp || 0)}</span>
              </div>
              <Progress 
                value={(currentFrameIndex / (frameData.length - 1)) * 100} 
                className="w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentFrameIndex(0)}
                disabled={currentFrameIndex === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentFrameIndex(prev => Math.max(0, prev - 1))}
                disabled={currentFrameIndex === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentFrameIndex(prev => Math.min(frameData.length - 1, prev + 1))}
                disabled={currentFrameIndex === frameData.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentFrameIndex(frameData.length - 1)}
                disabled={currentFrameIndex === frameData.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback Speed */}
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm">Speed:</span>
              {[0.25, 0.5, 1, 2, 4].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Frame Analysis */}
      {currentFrame && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Target className="h-5 w-5 text-cyan-400" />
              <span>Frame {currentFrame.frame_number + 1} Analysis</span>
            </CardTitle>
            <CardDescription className="text-slate-300">
              {formatTime(currentFrame.timestamp)} - {(currentFrame.flight_phase || 'ground').charAt(0).toUpperCase() + (currentFrame.flight_phase || 'ground').slice(1)} Phase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 ${
              componentSize === 'small' ? 'gap-4' : componentSize === 'large' ? 'gap-12' : 'gap-8'
            }`}>
              {/* Tumbling Detection */}
              <div className={`space-y-4 bg-slate-800/50 rounded-lg border border-slate-700 ${
                componentSize === 'small' ? 'p-2' : componentSize === 'large' ? 'p-6' : 'p-4'
              }`}>
                <h4 className="font-medium flex items-center space-x-2 text-white">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <span>Tumbling Detection</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Status:</span>
                    <Badge variant={currentFrame.tumbling_detected ? "default" : "secondary"} className={currentFrame.tumbling_detected ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-500/20 text-slate-300 border-slate-500/30"}>
                      {currentFrame.tumbling_detected ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Phase:</span>
                    <Badge className={getFlightPhaseColor(currentFrame.flight_phase || 'ground')}>
                      {(currentFrame.flight_phase || 'ground').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Quality:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.tumbling_quality || 0).toFixed(1)}/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Confidence:</span>
                    <span className="text-sm font-medium text-cyan-300">{currentFrame.landmark_confidence > 0 ? "High" : "Low"}</span>
                  </div>
                </div>
              </div>

              {/* Movement Analysis */}
              <div className={`space-y-4 bg-slate-800/50 rounded-lg border border-slate-700 ${
                componentSize === 'small' ? 'p-2' : componentSize === 'large' ? 'p-6' : 'p-4'
              }`}>
                <h4 className="font-medium flex items-center space-x-2 text-white">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <span>Movement Analysis</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Height:</span>
                    <span className="text-sm font-medium text-cyan-300">{((currentFrame.height_from_ground || 0) * 100).toFixed(1)}cm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Elevation:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.elevation_angle || 0).toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Forward Lean:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.forward_lean_angle || 0).toFixed(1)}°</span>
                  </div>
                  {currentFrame.com_position && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">COM:</span>
                      <span className="text-sm font-medium text-cyan-300">
                        ({currentFrame.com_position.x.toFixed(2)}, {currentFrame.com_position.y.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ACL Risk Analysis */}
              <div className={`space-y-4 bg-slate-800/50 rounded-lg border border-slate-700 ${
                componentSize === 'small' ? 'p-2' : componentSize === 'large' ? 'p-6' : 'p-4'
              }`}>
                <h4 className="font-medium flex items-center space-x-2 text-white">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span>ACL Risk Analysis</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Overall Risk:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.acl_risk_factors?.overall_acl_risk || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Risk Level:</span>
                    <Badge className={getRiskLevelColor(currentFrame.acl_risk_factors?.risk_level || 'LOW')}>
                      {currentFrame.acl_risk_factors?.risk_level || 'LOW'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Knee Angle:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.acl_risk_factors?.knee_angle_risk || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Knee Valgus:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.acl_risk_factors?.knee_valgus_risk || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Landing:</span>
                    <span className="text-sm font-medium text-cyan-300">{(currentFrame.acl_risk_factors?.landing_mechanics_risk || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACL Recommendations */}
            {currentFrame.acl_recommendations && currentFrame.acl_recommendations.length > 0 && (
              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Recommendations</span>
                </h4>
                <ul className="space-y-3">
                  {currentFrame.acl_recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Statistics Summary */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-white">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              <span>Enhanced Statistics Summary</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {/* Tumbling Detection Summary */}
            <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="font-semibold flex items-center space-x-2 text-white text-lg">
                <Zap className="h-5 w-5 text-cyan-400" />
                <span>Tumbling Detection</span>
              </h4>
              <div className="space-y-4 text-base">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Tumbling Frames:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.tumbling_detection.total_tumbling_frames}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Percentage:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.tumbling_detection.tumbling_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Flight Phases:</span>
                  <span className="font-bold text-cyan-300 text-lg">{Object.values(enhancedStats.tumbling_detection.flight_phases).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>

            {/* ACL Risk Summary */}
            <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="font-semibold flex items-center space-x-2 text-white text-lg">
                <Shield className="h-5 w-5 text-cyan-400" />
                <span>ACL Risk Analysis</span>
              </h4>
              <div className="space-y-4 text-base">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Avg Overall Risk:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.acl_risk_analysis.average_overall_risk.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">High Risk Frames:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.acl_risk_analysis.high_risk_frames}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Avg Knee Valgus:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.acl_risk_analysis.average_knee_valgus_risk.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Movement Analysis Summary */}
            <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="font-semibold flex items-center space-x-2 text-white text-lg">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                <span>Movement Analysis</span>
              </h4>
              <div className="space-y-4 text-base">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Avg Elevation:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.movement_analysis.average_elevation_angle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Max Elevation:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.movement_analysis.max_elevation_angle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Avg Height:</span>
                  <span className="font-bold text-cyan-300 text-lg">{(enhancedStats.movement_analysis.average_height_from_ground * 100).toFixed(1)}cm</span>
                </div>
              </div>
            </div>

            {/* Tumbling Quality Summary */}
            <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="font-semibold flex items-center space-x-2 text-white text-lg">
                <Target className="h-5 w-5 text-cyan-400" />
                <span>Tumbling Quality</span>
              </h4>
              <div className="space-y-4 text-base">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Avg Quality:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.tumbling_quality.average_quality.toFixed(1)}/100</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Max Quality:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.tumbling_quality.max_quality.toFixed(1)}/100</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-300 font-medium">Quality Frames:</span>
                  <span className="font-bold text-cyan-300 text-lg">{enhancedStats.tumbling_quality.quality_frames_count}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




