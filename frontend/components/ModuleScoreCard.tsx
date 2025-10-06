import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

interface ModuleScore {
  moduleId: string;
  moduleTitle: string;
  score: number;
  attempts: number;
  bestScore: number;
  lastAttempt: string;
  passed: boolean;
  timeSpent: number;
  completionDate?: string;
}

interface ModuleScoreCardProps {
  score: ModuleScore;
}

export const ModuleScoreCard: React.FC<ModuleScoreCardProps> = ({ score }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {score.moduleTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            {score.passed && (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
            <Badge variant={getScoreBadgeVariant(score.score)}>
              {score.score}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Average Score</span>
            <span className={`font-medium ${getScoreColor(score.score)}`}>
              {score.score}%
            </span>
          </div>
          <Progress value={score.score} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Best Score</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {score.bestScore}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Attempts</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {score.attempts}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Time Spent</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatTime(score.timeSpent)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {score.passed ? 'Passed' : 'Not Passed'}
              </p>
            </div>
          </div>
        </div>

        {/* Last Attempt */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last Attempt: {formatDate(score.lastAttempt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
