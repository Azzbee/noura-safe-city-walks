import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  visibility: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  sunrise: string;
  sunset: string;
}

export interface WeatherCondition {
  type: 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog' | 'snow' | 'storm';
  label: string;
  icon: string;
  safetyMultiplier: number;
}

const WEATHER_CONDITIONS: Record<number, WeatherCondition> = {
  0: { type: 'clear', label: 'Clear', icon: '☀️', safetyMultiplier: 1.0 },
  1: { type: 'clear', label: 'Mainly Clear', icon: '🌤️', safetyMultiplier: 1.0 },
  2: { type: 'cloudy', label: 'Partly Cloudy', icon: '⛅', safetyMultiplier: 0.95 },
  3: { type: 'cloudy', label: 'Overcast', icon: '☁️', safetyMultiplier: 0.9 },
  45: { type: 'fog', label: 'Fog', icon: '🌫️', safetyMultiplier: 0.7 },
  48: { type: 'fog', label: 'Rime Fog', icon: '🌫️', safetyMultiplier: 0.65 },
  51: { type: 'rain', label: 'Light Drizzle', icon: '🌧️', safetyMultiplier: 0.85 },
  53: { type: 'rain', label: 'Drizzle', icon: '🌧️', safetyMultiplier: 0.8 },
  55: { type: 'rain', label: 'Heavy Drizzle', icon: '🌧️', safetyMultiplier: 0.75 },
  61: { type: 'rain', label: 'Light Rain', icon: '🌧️', safetyMultiplier: 0.8 },
  63: { type: 'rain', label: 'Rain', icon: '🌧️', safetyMultiplier: 0.75 },
  65: { type: 'heavy_rain', label: 'Heavy Rain', icon: '⛈️', safetyMultiplier: 0.6 },
  71: { type: 'snow', label: 'Light Snow', icon: '🌨️', safetyMultiplier: 0.7 },
  73: { type: 'snow', label: 'Snow', icon: '❄️', safetyMultiplier: 0.6 },
  75: { type: 'snow', label: 'Heavy Snow', icon: '❄️', safetyMultiplier: 0.5 },
  95: { type: 'storm', label: 'Thunderstorm', icon: '⛈️', safetyMultiplier: 0.4 },
  96: { type: 'storm', label: 'Hail Storm', icon: '🌩️', safetyMultiplier: 0.3 },
  99: { type: 'storm', label: 'Severe Storm', icon: '🌩️', safetyMultiplier: 0.2 },
};

interface UseWeatherProps {
  lat: number | null;
  lng: number | null;
  enabled?: boolean;
}

export function useWeather({ lat, lng, enabled = true }: UseWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    if (lat === null || lng === null || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-weather', {
        body: { lat, lng },
      });

      if (fnError) throw fnError;
      
      if (data) {
        setWeather(data);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, enabled]);

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Get current weather condition
  const condition = weather 
    ? WEATHER_CONDITIONS[weather.weatherCode] || WEATHER_CONDITIONS[0]
    : null;

  // Calculate safety warnings based on weather
  const getWeatherWarnings = useCallback((): string[] => {
    if (!weather || !condition) return [];

    const warnings: string[] = [];

    if (condition.safetyMultiplier < 0.7) {
      warnings.push('Poor visibility conditions');
    }

    if (weather.visibility < 1000) {
      warnings.push('Very low visibility');
    }

    if (weather.temperature < 0) {
      warnings.push('Freezing temperatures - watch for ice');
    }

    if (weather.temperature > 35) {
      warnings.push('Extreme heat - stay hydrated');
    }

    if (weather.windSpeed > 50) {
      warnings.push('High winds - be cautious');
    }

    if (weather.precipitationProbability > 80) {
      warnings.push('High chance of precipitation');
    }

    if (condition.type === 'storm') {
      warnings.push('Severe weather - consider delaying travel');
    }

    return warnings;
  }, [weather, condition]);

  // Check if conditions are safe for walking
  const isSafeForWalking = condition ? condition.safetyMultiplier >= 0.6 : true;

  return {
    weather,
    condition,
    loading,
    error,
    isSafeForWalking,
    getWeatherWarnings,
    refresh: fetchWeather,
  };
}
