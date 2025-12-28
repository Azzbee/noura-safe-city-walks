-- User safety reports for crowd-sourced data
CREATE TABLE public.safety_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('danger', 'caution', 'safe', 'well_lit', 'poorly_lit')),
  description TEXT,
  time_relevance TEXT NOT NULL DEFAULT 'always' CHECK (time_relevance IN ('always', 'day_only', 'night_only', 'late_night')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votes on safety reports
CREATE TABLE public.safety_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id)
);

-- Enable RLS
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_votes ENABLE ROW LEVEL SECURITY;

-- RLS for safety_reports - users can view all, but only manage their own
CREATE POLICY "Anyone can view safety reports" ON public.safety_reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON public.safety_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.safety_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.safety_reports
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for safety_votes
CREATE POLICY "Anyone can view votes" ON public.safety_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.safety_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON public.safety_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote" ON public.safety_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_safety_reports_updated_at
  BEFORE UPDATE ON public.safety_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for geolocation queries
CREATE INDEX idx_safety_reports_location ON public.safety_reports (lat, lng);
CREATE INDEX idx_safety_reports_type ON public.safety_reports (report_type);
CREATE INDEX idx_safety_votes_report ON public.safety_votes (report_id);