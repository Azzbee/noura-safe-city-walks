import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, RouteComparisonResult, formatDuration, formatDistance } from '@/services/routing';
import { Shield, Zap, Scale, Navigation, X, Loader2, ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import SafetyBreakdownIndicator from './SafetyBreakdownIndicator';
import RouteExplanation from './RouteExplanation';

interface RouteSelectorProps {
  routes: RouteComparisonResult;
  selectedRoute: 'safest' | 'fastest' | 'balanced' | null;
  onSelectRoute: (type: 'safest' | 'fastest' | 'balanced') => void;
  onStartJourney: () => void;
  onCancel: () => void;
  loading?: boolean;
}

interface RouteOptionProps {
  type: 'safest' | 'fastest' | 'balanced';
  route: Route;
  isSelected: boolean;
  onClick: () => void;
  showBreakdown: boolean;
}

function RouteOption({ type, route, isSelected, onClick, showBreakdown }: RouteOptionProps) {
  const config = {
    safest: {
      icon: Shield,
      label: 'Safest',
      color: 'text-safe',
      bgColor: 'bg-safe/10',
      borderColor: 'border-safe',
    },
    fastest: {
      icon: Zap,
      label: 'Fastest',
      color: 'text-fastest',
      bgColor: 'bg-fastest/10',
      borderColor: 'border-fastest',
    },
    balanced: {
      icon: Scale,
      label: 'Balanced',
      color: 'text-balanced',
      bgColor: 'bg-balanced/10',
      borderColor: 'border-balanced',
    },
  }[type];

  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 p-3 rounded-lg border-2 transition-all',
        isSelected 
          ? `${config.bgColor} ${config.borderColor}` 
          : 'border-border hover:border-muted-foreground/50'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', config.color)} />
        <span className="font-medium text-sm">{config.label}</span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>{formatDistance(route.distance_m)}</div>
        <div>{formatDuration(route.duration_s)}</div>
        <div className={config.color}>
          safety {Math.round(route.safety_score)}/100
        </div>
      </div>
      {showBreakdown && route.safety_breakdown && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <SafetyBreakdownIndicator breakdown={route.safety_breakdown} compact />
        </div>
      )}
    </button>
  );
}

export default function RouteSelector({
  routes,
  selectedRoute,
  onSelectRoute,
  onStartJourney,
  onCancel,
  loading,
}: RouteSelectorProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const selectedRouteData = selectedRoute ? routes[selectedRoute] : null;

  return (
    <Card className="bg-card/95 backdrop-blur border-primary/20">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Choose Route</CardTitle>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title={showBreakdown ? 'Hide safety details' : 'Show safety details'}
          >
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={onCancel} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <RouteOption
            type="safest"
            route={routes.safest}
            isSelected={selectedRoute === 'safest'}
            onClick={() => onSelectRoute('safest')}
            showBreakdown={showBreakdown}
          />
          <RouteOption
            type="balanced"
            route={routes.balanced}
            isSelected={selectedRoute === 'balanced'}
            onClick={() => onSelectRoute('balanced')}
            showBreakdown={showBreakdown}
          />
          <RouteOption
            type="fastest"
            route={routes.fastest}
            isSelected={selectedRoute === 'fastest'}
            onClick={() => onSelectRoute('fastest')}
            showBreakdown={showBreakdown}
          />
        </div>

        {/* Detailed breakdown for selected route */}
        {showBreakdown && selectedRouteData?.safety_breakdown && (
          <SafetyBreakdownIndicator breakdown={selectedRouteData.safety_breakdown} />
        )}

        {/* Explain this route button */}
        {selectedRoute && selectedRouteData && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <MessageCircleQuestion className="w-4 h-4 mr-2" />
            {showExplanation ? 'Hide explanation' : 'Explain this route'}
          </Button>
        )}

        {/* Route explanation */}
        {showExplanation && selectedRoute && selectedRouteData && (
          <RouteExplanation 
            route={selectedRouteData} 
            routeType={selectedRoute}
            onClose={() => setShowExplanation(false)}
          />
        )}

        {routes.comparison && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            Safest route is {routes.comparison.extra_distance_pct.toFixed(0)}% longer
            and scores {routes.comparison.safety_improvement_pct.toFixed(0)} points higher
          </div>
        )}

        <Button
          onClick={onStartJourney}
          disabled={!selectedRoute || loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Start Journey
        </Button>
      </CardContent>
    </Card>
  );
}
