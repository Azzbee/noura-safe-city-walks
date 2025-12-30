import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    visibility: number;
    is_day: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

// Weather code descriptions from WMO
const weatherCodeDescriptions: Record<number, { description: string; icon: string; safety_factor: number }> = {
  0: { description: 'Clear sky', icon: '☀️', safety_factor: 1.0 },
  1: { description: 'Mainly clear', icon: '🌤️', safety_factor: 1.0 },
  2: { description: 'Partly cloudy', icon: '⛅', safety_factor: 0.95 },
  3: { description: 'Overcast', icon: '☁️', safety_factor: 0.9 },
  45: { description: 'Fog', icon: '🌫️', safety_factor: 0.7 },
  48: { description: 'Depositing rime fog', icon: '🌫️', safety_factor: 0.65 },
  51: { description: 'Light drizzle', icon: '🌧️', safety_factor: 0.85 },
  53: { description: 'Moderate drizzle', icon: '🌧️', safety_factor: 0.8 },
  55: { description: 'Dense drizzle', icon: '🌧️', safety_factor: 0.75 },
  56: { description: 'Light freezing drizzle', icon: '🌧️', safety_factor: 0.6 },
  57: { description: 'Dense freezing drizzle', icon: '🌧️', safety_factor: 0.55 },
  61: { description: 'Slight rain', icon: '🌧️', safety_factor: 0.8 },
  63: { description: 'Moderate rain', icon: '🌧️', safety_factor: 0.7 },
  65: { description: 'Heavy rain', icon: '🌧️', safety_factor: 0.6 },
  66: { description: 'Light freezing rain', icon: '🌧️', safety_factor: 0.5 },
  67: { description: 'Heavy freezing rain', icon: '🌧️', safety_factor: 0.4 },
  71: { description: 'Slight snow', icon: '🌨️', safety_factor: 0.7 },
  73: { description: 'Moderate snow', icon: '🌨️', safety_factor: 0.6 },
  75: { description: 'Heavy snow', icon: '🌨️', safety_factor: 0.5 },
  77: { description: 'Snow grains', icon: '🌨️', safety_factor: 0.65 },
  80: { description: 'Slight rain showers', icon: '🌦️', safety_factor: 0.8 },
  81: { description: 'Moderate rain showers', icon: '🌦️', safety_factor: 0.7 },
  82: { description: 'Violent rain showers', icon: '🌦️', safety_factor: 0.5 },
  85: { description: 'Slight snow showers', icon: '🌨️', safety_factor: 0.65 },
  86: { description: 'Heavy snow showers', icon: '🌨️', safety_factor: 0.5 },
  95: { description: 'Thunderstorm', icon: '⛈️', safety_factor: 0.4 },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️', safety_factor: 0.35 },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️', safety_factor: 0.25 },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Missing lat or lng parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for location: ${lat}, ${lng}`);

    // Fetch from Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,is_day&daily=sunrise,sunset&timezone=auto`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      console.error(`Open-Meteo API error: ${response.status}`);
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: WeatherResponse = await response.json();
    console.log('Weather data received:', JSON.stringify(data.current));

    const weatherCode = data.current.weather_code;
    const weatherInfo = weatherCodeDescriptions[weatherCode] || {
      description: 'Unknown',
      icon: '❓',
      safety_factor: 0.8,
    };

    // Calculate additional safety warnings
    const warnings: string[] = [];

    // Visibility warning
    if (data.current.visibility < 1000) {
      warnings.push('Very low visibility - exercise extreme caution');
    } else if (data.current.visibility < 5000) {
      warnings.push('Reduced visibility');
    }

    // Wind warning
    if (data.current.wind_gusts_10m > 60) {
      warnings.push('Strong wind gusts - be careful outdoors');
    }

    // Temperature warnings
    if (data.current.apparent_temperature < -10) {
      warnings.push('Extreme cold - limit outdoor exposure');
    } else if (data.current.apparent_temperature > 35) {
      warnings.push('Extreme heat - stay hydrated, seek shade');
    }

    // Precipitation warning
    if (data.current.precipitation > 5) {
      warnings.push('Heavy precipitation - expect fewer pedestrians');
    }

    // Night time factor
    const isNight = data.current.is_day === 0;
    const nightFactor = isNight ? 0.85 : 1.0;

    // Overall safety multiplier
    const safetyMultiplier = weatherInfo.safety_factor * nightFactor;

    const result = {
      temperature: Math.round(data.current.temperature_2m),
      feels_like: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      visibility: data.current.visibility,
      wind_speed: Math.round(data.current.wind_speed_10m),
      wind_gusts: Math.round(data.current.wind_gusts_10m),
      weather_code: weatherCode,
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      is_day: data.current.is_day === 1,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      safety_multiplier: safetyMultiplier,
      warnings,
    };

    console.log(`Weather result: ${result.description}, safety multiplier: ${result.safety_multiplier}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching weather:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
