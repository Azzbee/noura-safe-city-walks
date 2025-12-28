import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SafetyReport } from '@/hooks/useSafetyReports';
import { TimeOfDay } from '@/services/routing';

interface CrowdSourcedOverlayProps {
  map: L.Map | null;
  reports: SafetyReport[];
  timeOfDay: TimeOfDay;
  onVote: (reportId: string, vote: 1 | -1) => void;
}

export function useCrowdSourcedOverlay({
  map,
  reports,
  timeOfDay,
  onVote,
}: CrowdSourcedOverlayProps) {
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing layers
    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    // Filter reports by time relevance
    const filteredReports = reports.filter((report) => {
      // Filter out expired reports
      if (report.expires_at && new Date(report.expires_at) < new Date()) {
        return false;
      }

      // Filter by time relevance
      switch (report.time_relevance) {
        case 'day_only':
          return timeOfDay === 'day';
        case 'night_only':
          return timeOfDay === 'evening' || timeOfDay === 'night';
        case 'late_night':
          return timeOfDay === 'late_night' || timeOfDay === 'night';
        case 'always':
        default:
          return true;
      }
    });

    // Add markers for each report
    filteredReports.forEach((report) => {
      const config = getReportConfig(report.report_type);
      const voteScore = report.vote_count || 0;
      
      // Don't show heavily downvoted reports
      if (voteScore < -3) return;

      // Adjust radius based on votes
      const baseRadius = 60;
      const radiusMultiplier = Math.max(0.5, Math.min(2, 1 + voteScore * 0.1));
      const radius = baseRadius * radiusMultiplier;

      // Create circle
      const circle = L.circle([report.lat, report.lng], {
        radius,
        color: config.color,
        fillColor: config.color,
        fillOpacity: config.opacity,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      // Create popup content
      const popupContent = createPopupContent(report, onVote);
      circle.bindPopup(popupContent, {
        className: 'safety-report-popup',
        maxWidth: 250,
      });

      layersRef.current.push(circle);

      // Add marker icon
      const icon = L.divIcon({
        className: 'crowd-report-marker',
        html: `
          <div style="
            width: 24px; height: 24px;
            background: ${config.color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 12px;
            box-shadow: 0 2px 8px ${config.color}80;
            border: 2px solid white;
          ">${config.icon}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([report.lat, report.lng], { icon })
        .bindPopup(popupContent, {
          className: 'safety-report-popup',
          maxWidth: 250,
        })
        .addTo(map);

      layersRef.current.push(marker);
    });

    return () => {
      layersRef.current.forEach((layer) => layer.remove());
      layersRef.current = [];
    };
  }, [map, reports, timeOfDay, onVote]);
}

function getReportConfig(type: string): { color: string; opacity: number; icon: string } {
  switch (type) {
    case 'danger':
      return { color: 'hsl(0, 84%, 50%)', opacity: 0.25, icon: '⚠' };
    case 'caution':
      return { color: 'hsl(38, 92%, 55%)', opacity: 0.2, icon: '!' };
    case 'poorly_lit':
      return { color: 'hsl(230, 20%, 40%)', opacity: 0.2, icon: '🌙' };
    case 'safe':
      return { color: 'hsl(142, 76%, 36%)', opacity: 0.15, icon: '✓' };
    case 'well_lit':
      return { color: 'hsl(45, 93%, 47%)', opacity: 0.15, icon: '☀' };
    default:
      return { color: 'hsl(0, 0%, 50%)', opacity: 0.15, icon: '?' };
  }
}

function createPopupContent(
  report: SafetyReport,
  onVote: (reportId: string, vote: 1 | -1) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'p-2';
  
  const typeLabels: Record<string, string> = {
    danger: 'Danger Zone',
    caution: 'Caution Area',
    poorly_lit: 'Poorly Lit',
    safe: 'Safe Area',
    well_lit: 'Well Lit',
  };

  const timeLabels: Record<string, string> = {
    always: 'All times',
    day_only: 'Daytime only',
    night_only: 'Nighttime',
    late_night: 'Late night',
  };

  container.innerHTML = `
    <div style="font-family: 'DM Sans', sans-serif;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: hsl(45, 20%, 95%);">
        ${typeLabels[report.report_type] || report.report_type}
      </div>
      ${report.description ? `<p style="font-size: 12px; color: hsl(230, 10%, 70%); margin-bottom: 8px;">${report.description}</p>` : ''}
      <div style="font-size: 11px; color: hsl(230, 10%, 55%); margin-bottom: 8px;">
        ${timeLabels[report.time_relevance]} • ${new Date(report.created_at).toLocaleDateString()}
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="vote-btn vote-up" data-vote="1" style="
          background: hsl(142, 76%, 36%, 0.2);
          border: 1px solid hsl(142, 76%, 36%, 0.4);
          color: hsl(142, 76%, 50%);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">👍 Helpful</button>
        <button class="vote-btn vote-down" data-vote="-1" style="
          background: hsl(0, 84%, 50%, 0.2);
          border: 1px solid hsl(0, 84%, 50%, 0.4);
          color: hsl(0, 84%, 60%);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">👎 Wrong</button>
        <span style="font-size: 12px; color: hsl(230, 10%, 55%);">${report.vote_count || 0} votes</span>
      </div>
    </div>
  `;

  // Add event listeners
  const upBtn = container.querySelector('.vote-up');
  const downBtn = container.querySelector('.vote-down');
  
  upBtn?.addEventListener('click', () => onVote(report.id, 1));
  downBtn?.addEventListener('click', () => onVote(report.id, -1));

  return container;
}

export default useCrowdSourcedOverlay;
