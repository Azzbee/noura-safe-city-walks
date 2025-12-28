import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapToggleProps {
  enabled: boolean;
  onToggle: () => void;
  pointCount?: number;
}

export default function HeatmapToggle({ enabled, onToggle, pointCount = 0 }: HeatmapToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className={`
            relative h-9 gap-2 transition-all duration-300
            ${enabled 
              ? 'bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 border-none text-white shadow-lg' 
              : 'bg-card/90 hover:bg-card border-border/50'
            }
          `}
        >
          <motion.div
            animate={enabled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: enabled ? Infinity : 0, repeatDelay: 1 }}
          >
            <Flame className={`w-4 h-4 ${enabled ? 'text-white' : 'text-muted-foreground'}`} />
          </motion.div>
          <span className="text-xs font-medium">Heatmap</span>
          {enabled && pointCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-amber-600 text-[10px] font-bold rounded-full flex items-center justify-center">
              {pointCount > 9 ? '9+' : pointCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {enabled ? 'Hide crime density heatmap' : 'Show crime density heatmap'}
      </TooltipContent>
    </Tooltip>
  );
}
