import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { checkHealth, HealthStatus } from '@/services/routing';
import { cn } from '@/lib/utils';

interface RouteServiceStatusProps {
  className?: string;
}

export default function RouteServiceStatus({ className }: RouteServiceStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'unavailable'>('checking');
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
        setStatus(data.status === 'ok' ? 'connected' : 'unavailable');
      } catch {
        setStatus('unavailable');
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        status === 'connected' && 'bg-safe/10 text-safe',
        status === 'unavailable' && 'bg-danger/10 text-danger',
        status === 'checking' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status === 'checking' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Connecting...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <CheckCircle className="w-3 h-3" />
          <span>Routing ready</span>
        </>
      )}
      {status === 'unavailable' && (
        <>
          <AlertTriangle className="w-3 h-3" />
          <span>Routing unavailable</span>
        </>
      )}
    </div>
  );
}
