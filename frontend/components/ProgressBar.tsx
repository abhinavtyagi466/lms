import React from 'react';
import { Progress } from './ui/progress';
import { CheckCircle, Clock } from 'lucide-react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentTime, 
  duration, 
  className = "" 
}) => {
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  
  // Check if video is completed (watched 95% or more)
  const isCompleted = progressPercentage >= 95;
  
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Clock className="w-4 h-4 text-gray-500" />
          )}
          <span className={isCompleted ? "text-green-700 font-medium" : "text-gray-600"}>
            {isCompleted ? "Completed" : "In Progress"}
          </span>
        </div>
        <span className="text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      {/* Progress Bar */}
      <Progress 
        value={progressPercentage} 
        className="h-2"
      />
      
      {/* Progress Percentage */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{progressPercentage}% watched</span>
        {isCompleted && (
          <span className="text-green-600 font-medium">✓ All done!</span>
        )}
      </div>
    </div>
  );
};
