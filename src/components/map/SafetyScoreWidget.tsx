import { motion } from 'framer-motion';
import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { SafetyScore } from '@/hooks/useSafetyScore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SafetyScoreWidgetProps {
  score: SafetyScore;
}

export default function SafetyScoreWidget({ score }: SafetyScoreWidgetProps) {
  const getScoreColor = () => {
    switch (score.level) {
      case 'safe':
        return 'hsl(142, 76%, 36%)';
      case 'moderate':
        return 'hsl(45, 93%, 47%)';
      case 'caution':
        return 'hsl(25, 95%, 53%)';
      case 'danger':
        return 'hsl(0, 84%, 60%)';
    }
  };

  const getScoreIcon = () => {
    switch (score.level) {
      case 'safe':
        return <CheckCircle className="w-4 h-4" />;
      case 'moderate':
        return <Shield className="w-4 h-4" />;
      case 'caution':
        return <AlertCircle className="w-4 h-4" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getBackgroundClass = () => {
    switch (score.level) {
      case 'safe':
        return 'bg-safe/10 border-safe/30';
      case 'moderate':
        return 'bg-balanced/10 border-balanced/30';
      case 'caution':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'danger':
        return 'bg-destructive/10 border-destructive/30';
    }
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score.score / 100) * circumference;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`
            pointer-events-auto cursor-pointer
            flex items-center gap-2 px-3 py-2 rounded-xl
            border backdrop-blur-md shadow-lg
            transition-all duration-300 hover:scale-105
            ${getBackgroundClass()}
          `}
        >
          {/* Circular score indicator */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              {/* Background circle */}
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <motion.circle
                cx="20"
                cy="20"
                r="18"
                stroke={getScoreColor()}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ strokeDasharray: circumference }}
              />
            </svg>
            {/* Center text */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-xs font-bold"
              style={{ color: getScoreColor() }}
            >
              {score.score}
            </div>
          </div>

          {/* Label and icon */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1" style={{ color: getScoreColor() }}>
              {getScoreIcon()}
              <span className="text-xs font-semibold">{score.label}</span>
            </div>
            {score.nearbyThreats > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {score.nearbyThreats} threat{score.nearbyThreats > 1 ? 's' : ''} nearby
              </span>
            )}
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[200px]">
        <div className="space-y-1 text-xs">
          <p className="font-medium">Safety Score: {score.score}/100</p>
          {score.factors.dangerZones > 0 && (
            <p className="text-destructive">• {score.factors.dangerZones} danger zone(s)</p>
          )}
          {score.factors.crimeAlerts > 0 && (
            <p className="text-amber-500">• {score.factors.crimeAlerts} crime alert(s)</p>
          )}
          {score.factors.safetyReports > 0 && (
            <p className="text-amber-500">• {score.factors.safetyReports} safety report(s)</p>
          )}
          {score.factors.safeZones > 0 && (
            <p className="text-safe">• {score.factors.safeZones} safe zone(s)</p>
          )}
          {score.nearbyThreats === 0 && (
            <p className="text-safe">No threats detected within 500m</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
