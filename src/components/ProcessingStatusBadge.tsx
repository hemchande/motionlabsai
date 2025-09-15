'use client';

import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface ProcessingStatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type?: 'analysis' | 'perFrame';
  progress?: number;
  className?: string;
}

export default function ProcessingStatusBadge({ 
  status, 
  type, 
  progress, 
  className = '' 
}: ProcessingStatusBadgeProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Activity className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
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

  const getStatusText = () => {
    if (status === 'processing' && progress !== undefined) {
      return `${type === 'perFrame' ? 'Per-Frame' : 'Standard'} Analysis (${progress}%)`;
    }
    
    switch (status) {
      case 'processing':
        return `${type === 'perFrame' ? 'Per-Frame' : 'Standard'} Analysis`;
      case 'completed':
        return `${type === 'perFrame' ? 'Per-Frame' : 'Standard'} Complete`;
      case 'failed':
        return `${type === 'perFrame' ? 'Per-Frame' : 'Standard'} Failed`;
      default:
        return `${type === 'perFrame' ? 'Per-Frame' : 'Standard'} Pending`;
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center space-x-1 text-xs ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </Badge>
  );
}



