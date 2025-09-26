"use client"

import React from 'react'

interface FrameData {
  frame_number: number;
  timestamp: number;
  metrics?: {
    acl_risk?: number;
  };
}

interface RiskTimelineProps {
  frameData: FrameData[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
}

export default function RiskTimeline({ frameData, currentTime, duration, onSeek }: RiskTimelineProps) {
  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'bg-green-500'
    if (risk < 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskLevel = (risk: number) => {
    if (risk < 30) return 'LOW'
    if (risk < 70) return 'MODERATE'
    return 'HIGH'
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-black bg-opacity-90 rounded-lg p-3 w-full max-w-md">
      {/* Risk Timeline Bar */}
      <div className="relative h-2 bg-gray-600 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {frameData.map((frame, index) => (
          <button
            key={index}
            className={`absolute top-0 w-1 h-full ${getRiskColor(frame.metrics?.acl_risk || 0)} hover:opacity-80 transition-opacity`}
            style={{ left: `${(frame.timestamp / duration) * 100}%` }}
            onClick={() => onSeek(frame.timestamp)}
            title={`${formatTime(frame.timestamp)} - ${getRiskLevel(frame.metrics?.acl_risk || 0)} Risk (${(frame.metrics?.acl_risk || 0).toFixed(0)}%)`}
          />
        ))}
      </div>
      
      {/* Risk Level Labels */}
      <div className="flex justify-between text-xs text-gray-300">
        <span>Low Risk</span>
        <span>Moderate Risk</span>
        <span>High Risk</span>
      </div>
    </div>
  )
}
