import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEWSAPI_KEY = Deno.env.get('NEWSAPI_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NewsArticle {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
  source: { name: string };
}

interface CrimeAlert {
  id: string;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high';
  publishedAt: string;
  source: string;
  url: string;
}

// Paris neighborhoods with approximate coordinates for location extraction
const PARIS_LOCATIONS: Record<string, [number, number]> = {
  // Arrondissements
  'louvre': [48.8606, 2.3376],
  '1er': [48.8606, 2.3376],
  'bourse': [48.8686, 2.3409],
  '2e': [48.8686, 2.3409],
  'temple': [48.8643, 2.3589],
  '3e': [48.8643, 2.3589],
  'hotel de ville': [48.8543, 2.3565],
  '4e': [48.8543, 2.3565],
  'pantheon': [48.8462, 2.3461],
  '5e': [48.8462, 2.3461],
  'luxembourg': [48.8462, 2.3372],
  '6e': [48.8462, 2.3372],
  'palais bourbon': [48.8567, 2.3126],
  '7e': [48.8567, 2.3126],
  'elysee': [48.8754, 2.3054],
  '8e': [48.8754, 2.3054],
  'opera': [48.8708, 2.3316],
  '9e': [48.8708, 2.3316],
  'enclos saint-laurent': [48.8762, 2.3577],
  '10e': [48.8762, 2.3577],
  'popincourt': [48.8596, 2.3781],
  '11e': [48.8596, 2.3781],
  'reuilly': [48.8408, 2.3875],
  '12e': [48.8408, 2.3875],
  'gobelins': [48.8286, 2.3582],
  '13e': [48.8286, 2.3582],
  'observatoire': [48.8321, 2.3258],
  '14e': [48.8321, 2.3258],
  'vaugirard': [48.8411, 2.2950],
  '15e': [48.8411, 2.2950],
  'passy': [48.8550, 2.2680],
  '16e': [48.8550, 2.2680],
  'batignolles': [48.8862, 2.3087],
  '17e': [48.8862, 2.3087],
  'butte montmartre': [48.8867, 2.3431],
  'montmartre': [48.8867, 2.3431],
  '18e': [48.8867, 2.3431],
  'buttes chaumont': [48.8839, 2.3827],
  '19e': [48.8839, 2.3827],
  'menilmontant': [48.8640, 2.3982],
  'belleville': [48.8718, 2.3768],
  '20e': [48.8640, 2.3982],
  // Key areas
  'gare du nord': [48.8809, 2.3553],
  'gare de lyon': [48.8448, 2.3735],
  'champs-elysees': [48.8698, 2.3075],
  'chatelet': [48.8584, 2.3470],
  'les halles': [48.8614, 2.3475],
  'bastille': [48.8530, 2.3690],
  'republique': [48.8675, 2.3636],
  'nation': [48.8483, 2.3960],
  'saint-denis': [48.9362, 2.3574],
  'la defense': [48.8918, 2.2362],
  'pigalle': [48.8822, 2.3373],
  'barbes': [48.8839, 2.3498],
  'stalingrad': [48.8841, 2.3691],
  'porte de la chapelle': [48.8976, 2.3597],
  'porte de clignancourt': [48.8976, 2.3445],
};

function extractLocationFromText(text: string): { location: string; coords: [number, number] } | null {
  const lowerText = text.toLowerCase();
  
  // Must contain France-related keywords to be included
  const franceKeywords = ['france', 'paris', 'français', 'française', 'ile-de-france', 'parisien', 'métropole'];
  const isFranceRelated = franceKeywords.some(kw => lowerText.includes(kw));
  
  if (!isFranceRelated) {
    return null;
  }
  
  for (const [location, coords] of Object.entries(PARIS_LOCATIONS)) {
    if (lowerText.includes(location)) {
      return { location, coords };
    }
  }
  
  // Default to central Paris if "paris" or "france" is mentioned but no specific location
  if (lowerText.includes('paris') || lowerText.includes('france')) {
    return { location: 'Paris', coords: [48.8566, 2.3522] };
  }
  
  return null;
}

function determineSeverity(text: string): 'low' | 'medium' | 'high' {
  const lowerText = text.toLowerCase();
  
  const highSeverityKeywords = ['meurtre', 'murder', 'homicide', 'shooting', 'fusillade', 'terrorist', 'terroriste', 'explosion', 'mort', 'death', 'deadly', 'fatal'];
  const mediumSeverityKeywords = ['agression', 'assault', 'robbery', 'vol', 'braquage', 'violence', 'attack', 'attaque', 'stabbing', 'knife', 'couteau'];
  
  for (const keyword of highSeverityKeywords) {
    if (lowerText.includes(keyword)) return 'high';
  }
  
  for (const keyword of mediumSeverityKeywords) {
    if (lowerText.includes(keyword)) return 'medium';
  }
  
  return 'low';
}

// French RSS news feeds for crime/security news
const FRENCH_RSS_SOURCES = [
  { url: 'https://www.lemonde.fr/faits-divers/rss_full.xml', name: 'Le Monde' },
  { url: 'https://www.lefigaro.fr/rss/figaro_actualites-faits_divers.xml', name: 'Le Figaro' },
  { url: 'https://www.leparisien.fr/arc/outboundfeeds/rss/category/faits-divers.xml', name: 'Le Parisien' },
];

async function fetchRSSFeed(source: { url: string; name: string }): Promise<CrimeAlert[]> {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'SafeRouteApp/1.0' },
    });
    
    if (!response.ok) {
      console.log(`RSS fetch failed for ${source.name}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const alerts: CrimeAlert[] = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i);
      const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/i);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>|<link><!\[CDATA\[(.*?)\]\]>/i);
      const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      
      const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
      const description = (descMatch?.[1] || descMatch?.[2] || '').replace(/<[^>]*>/g, '').trim();
      const url = (linkMatch?.[1] || linkMatch?.[2] || '').trim();
      const pubDate = dateMatch?.[1] || new Date().toISOString();
      
      if (!title) continue;
      
      const fullText = `${title} ${description}`;
      const locationInfo = extractLocationFromText(fullText);
      
      if (locationInfo) {
        alerts.push({
          id: crypto.randomUUID(),
          title,
          description: description.slice(0, 300),
          location: locationInfo.location,
          lat: locationInfo.coords[0],
          lng: locationInfo.coords[1],
          severity: determineSeverity(fullText),
          publishedAt: new Date(pubDate).toISOString(),
          source: source.name,
          url,
        });
      }
    }
    
    console.log(`Found ${alerts.length} alerts from ${source.name}`);
    return alerts;
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error);
    return [];
  }
}

async function fetchCrimeNews(): Promise<CrimeAlert[]> {
  const alerts: CrimeAlert[] = [];
  const seenUrls = new Set<string>();
  
  // First, try French RSS feeds (more reliable for France-specific news)
  console.log('Fetching from French RSS sources...');
  const rssResults = await Promise.all(FRENCH_RSS_SOURCES.map(fetchRSSFeed));
  
  for (const rssAlerts of rssResults) {
    for (const alert of rssAlerts) {
      if (!seenUrls.has(alert.url)) {
        seenUrls.add(alert.url);
        alerts.push(alert);
      }
    }
  }
  
  console.log(`Found ${alerts.length} alerts from RSS feeds`);
  
  // Also fetch from NewsAPI if configured
  if (NEWSAPI_KEY && alerts.length < 10) {
    console.log('Supplementing with NewsAPI...');
    
    // Queries specifically targeting France
    const queries = [
      'paris agression faits divers',
      'france crime violence',
      'paris vol incident securite',
      'ile-de-france delinquance police',
    ];

    for (const query of queries) {
      try {
        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', query);
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('pageSize', '15');
        url.searchParams.set('apiKey', NEWSAPI_KEY);
        url.searchParams.set('language', 'fr');
        // French domains only
        url.searchParams.set('domains', 'lemonde.fr,lefigaro.fr,leparisien.fr,20minutes.fr,bfmtv.com,francetvinfo.fr');
        
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 14);
        url.searchParams.set('from', fromDate.toISOString().split('T')[0]);

        console.log(`Fetching news for query: ${query}`);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          console.error(`NewsAPI error for "${query}":`, response.status);
          continue;
        }

        const data = await response.json();
        
        if (data.status !== 'ok') continue;

        console.log(`Found ${data.articles?.length || 0} articles for "${query}"`);

        for (const article of (data.articles || []) as NewsArticle[]) {
          if (seenUrls.has(article.url)) continue;
          seenUrls.add(article.url);

          const fullText = `${article.title} ${article.description || ''}`;
          const locationInfo = extractLocationFromText(fullText);
          
          if (locationInfo) {
            alerts.push({
              id: crypto.randomUUID(),
              title: article.title,
              description: article.description || '',
              location: locationInfo.location,
              lat: locationInfo.coords[0],
              lng: locationInfo.coords[1],
              severity: determineSeverity(fullText),
              publishedAt: article.publishedAt,
              source: article.source.name,
              url: article.url,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching news for "${query}":`, error);
      }
    }
  }

  // If no real alerts found, return mock data for demo purposes
  if (alerts.length === 0) {
    console.log('No real alerts found, returning mock data');
    return generateMockAlerts();
  }

  // Sort by publish date (newest first)
  alerts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  console.log(`Total crime alerts found: ${alerts.length}`);
  return alerts.slice(0, 25);
}

// Generate mock alerts for demo when NewsAPI returns no results
function generateMockAlerts(): CrimeAlert[] {
  const now = new Date();
  return [
    {
      id: crypto.randomUUID(),
      title: 'Pickpocket activity reported near Châtelet',
      description: 'Multiple reports of pickpocket activity in the metro station area. Tourists advised to stay vigilant.',
      location: 'Châtelet',
      lat: 48.8584,
      lng: 2.3470,
      severity: 'medium',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'Local Reports',
      url: '#',
    },
    {
      id: crypto.randomUUID(),
      title: 'Late night disturbance in Pigalle',
      description: 'Police responded to reports of a disturbance. Area now calm.',
      location: 'Pigalle',
      lat: 48.8822,
      lng: 2.3373,
      severity: 'low',
      publishedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      source: 'Local Reports',
      url: '#',
    },
    {
      id: crypto.randomUUID(),
      title: 'Theft reported near Gare du Nord',
      description: 'Bag snatching incident reported outside the station. Suspect fled the scene.',
      location: 'Gare du Nord',
      lat: 48.8809,
      lng: 2.3553,
      severity: 'high',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      source: 'Local Reports',
      url: '#',
    },
    {
      id: crypto.randomUUID(),
      title: 'Scam artists active near Sacré-Cœur',
      description: 'Reports of petition scam and bracelet scam targeting tourists on the steps.',
      location: 'Montmartre',
      lat: 48.8867,
      lng: 2.3431,
      severity: 'low',
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      source: 'Local Reports',
      url: '#',
    },
  ];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching crime alerts from NewsAPI...');
    const alerts = await fetchCrimeNews();

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts,
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-crime-alerts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
