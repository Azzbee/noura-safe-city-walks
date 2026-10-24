import { Route } from '@/services/routing';
import { 
  Lightbulb, Shield, Users, Video, MapPin, Clock, 
  AlertTriangle, CheckCircle, Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteExplanationProps {
  route: Route;
  routeType: 'safest' | 'fastest' | 'balanced';
  onClose?: () => void;
}

function getFactorIcon(factor: string) {
  switch (factor) {
    case 'lighting': return Lightbulb;
    case 'police_proximity': return Shield;
    case 'activity': return Users;
    case 'cctv_coverage': return Video;
    case 'safe_landmarks': return MapPin;
    case 'time_factor': return Clock;
    default: return Info;
  }
}

function getFactorLabel(factor: string): string {
  switch (factor) {
    case 'lighting': return 'Street Lighting';
    case 'police_proximity': return 'Police Proximity';
    case 'activity': return 'Pedestrian Activity';
    case 'cctv_coverage': return 'CCTV Coverage';
    case 'safe_landmarks': return 'Safe Landmarks';
    case 'time_factor': return 'Time of Day';
    case 'road_type': return 'Road Type';
    default: return factor;
  }
}

function getScoreQuality(score: number): { label: string; color: string; icon: typeof CheckCircle } {
  if (score >= 0.8) return { label: 'Excellent', color: 'text-safe', icon: CheckCircle };
  if (score >= 0.6) return { label: 'Good', color: 'text-balanced', icon: CheckCircle };
  if (score >= 0.4) return { label: 'Moderate', color: 'text-warning', icon: AlertTriangle };
  return { label: 'Limited', color: 'text-danger', icon: AlertTriangle };
}

function generateExplanation(
  route: Route, 
  routeType: 'safest' | 'fastest' | 'balanced'
): string {
  const breakdown = route.safety_breakdown;
  if (!breakdown) {
    return `This ${routeType} route was selected based on optimal path finding.`;
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (breakdown.lighting >= 0.8) strengths.push('well-lit streets');
  else if (breakdown.lighting < 0.5) weaknesses.push('some poorly lit sections');

  if (breakdown.activity >= 0.8) strengths.push('busy pedestrian areas');
  else if (breakdown.activity < 0.5) weaknesses.push('quieter streets');

  if (breakdown.police_proximity && breakdown.police_proximity >= 0.7) {
    strengths.push('proximity to police stations');
  }
  if (breakdown.cctv_coverage && breakdown.cctv_coverage >= 0.7) {
    strengths.push('CCTV monitored areas');
  }
  if (breakdown.safe_landmarks && breakdown.safe_landmarks >= 0.7) {
    strengths.push('safe landmarks nearby');
  }

  const list = (items: string[]) =>
    items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

  const timeDesc = breakdown.time_factor >= 0.85 ? 'daytime conditions' :
                   breakdown.time_factor >= 0.7 ? 'evening conditions' : 'nighttime conditions';
  const score = Math.round(route.safety_score);

  let explanation = '';

  if (routeType === 'safest') {
    explanation = strengths.length
      ? `This route keeps you on ${list(strengths.slice(0, 3))}. `
      : 'This route avoids the least safe streets around you. ';
    explanation += `It is scored for ${timeDesc} and has the highest safety score of the three options (${score}%).`;
    if (weaknesses.length) explanation += ` Expect ${list(weaknesses)}.`;
  } else if (routeType === 'fastest') {
    explanation = 'This is the quickest route to your destination. ';
    explanation += weaknesses.length
      ? `It passes ${list(weaknesses)} under current ${timeDesc}.`
      : `Conditions along it are reasonable for ${timeDesc}.`;
    if (route.warnings && route.warnings.length > 0) {
      explanation += ` Note: ${route.warnings[0]}`;
    }
  } else {
    explanation = 'This route balances safety and speed. ';
    if (strengths.length) explanation += `It offers ${list(strengths.slice(0, 2))} while keeping the walk short. `;
    explanation += `A good compromise for ${timeDesc}.`;
  }

  return explanation;
}

export default function RouteExplanation({ route, routeType, onClose }: RouteExplanationProps) {
  const breakdown = route.safety_breakdown;
  const explanation = generateExplanation(route, routeType);

  const routeConfig = {
    safest: { color: 'text-safe', bgColor: 'bg-safe/10', borderColor: 'border-safe/30' },
    fastest: { color: 'text-fastest', bgColor: 'bg-fastest/10', borderColor: 'border-fastest/30' },
    balanced: { color: 'text-balanced', bgColor: 'bg-balanced/10', borderColor: 'border-balanced/30' },
  }[routeType];

  // Determine top contributing factors
  const factorScores = breakdown ? Object.entries(breakdown)
    .filter(([key]) => !['road_type'].includes(key))
    .map(([key, value]) => ({ key, value: value as number }))
    .sort((a, b) => b.value - a.value) : [];

  const topFactors = factorScores.slice(0, 3);
  const weakFactors = factorScores.filter(f => f.value < 0.6);

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-4',
      routeConfig.bgColor,
      routeConfig.borderColor
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Info className={cn('w-5 h-5', routeConfig.color)} />
          <h4 className="font-semibold capitalize">{routeType} Route Explanation</h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ×
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        {explanation}
      </p>

      {breakdown && (
        <div className="space-y-3">
          {topFactors.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-safe" />
                Key Strengths
              </h5>
              <div className="grid gap-2">
                {topFactors.map(({ key, value }) => {
                  const Icon = getFactorIcon(key);
                  const quality = getScoreQuality(value);
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{getFactorLabel(key)}</span>
                      </div>
                      <span className={quality.color}>{quality.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {weakFactors.length > 0 && routeType !== 'safest' && (
            <div>
              <h5 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                Areas of Caution
              </h5>
              <div className="grid gap-2">
                {weakFactors.slice(0, 2).map(({ key, value }) => {
                  const Icon = getFactorIcon(key);
                  const quality = getScoreQuality(value);
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{getFactorLabel(key)}</span>
                      </div>
                      <span className={quality.color}>{quality.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {route.warnings && route.warnings.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded p-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{route.warnings.join('. ')}</span>
        </div>
      )}
    </div>
  );
}
