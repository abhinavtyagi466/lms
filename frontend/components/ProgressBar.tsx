import React from 'react';
import { Progress } from './ui/progress';
import { CheckCircle, Clock } from 'lucide-react';

interface ProgressBarProps {
  currentTime?: number;
  duration?: number;
  progress?: number; // Percentage 0-100
  className?: string;
  showTime?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime = 0,
  duration = 0,
  progress,
  showTime = true,
  className = ""
}) => {
  // Calculate progress percentage - use progress prop if provided, otherwise calculate from time
  const progressPercentage = progress !== undefined
    ? Math.round(progress)
    : (duration > 0 ? Math.round((currentTime / duration) * 100) : 0);

  // Ensure we have valid numbers, default to 0
  const safeProgressPercentage = isNaN(progressPercentage) ? 0 : Math.min(100, Math.max(0, progressPercentage));

  // Check if video is completed (watched 95% or more)
  const isCompleted = safeProgressPercentage >= 95;

  // Format time display - handle NaN and undefined values
  const formatTime = (seconds: number | undefined): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '00:00';
    }
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if we should show time (only if we have valid duration)
  const hasValidTime = duration !== undefined && duration > 0 && !isNaN(duration);

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
        {showTime && hasValidTime ? (
          <span className="text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        ) : (
          <span className="text-gray-600">
            {safeProgressPercentage}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <Progress
        value={safeProgressPercentage}
        className="h-2"
      />

      {/* Progress Percentage */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{safeProgressPercentage}% watched</span>
        {isCompleted && (
          <span className="text-green-600 font-medium">✓ All done!</span>
        )}
      </div>
    </div>
  );
};
