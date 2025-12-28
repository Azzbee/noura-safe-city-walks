import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ReportType = 'danger' | 'caution' | 'safe' | 'well_lit' | 'poorly_lit';
export type TimeRelevance = 'always' | 'day_only' | 'night_only' | 'late_night';

export interface SafetyReport {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  report_type: ReportType;
  description?: string;
  time_relevance: TimeRelevance;
  expires_at?: string;
  created_at: string;
  vote_count?: number;
  user_vote?: number;
}

export function useSafetyReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async (bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('safety_reports')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by bounds if provided (for Paris area)
      if (bounds) {
        query = query
          .gte('lat', bounds.south)
          .lte('lat', bounds.north)
          .gte('lng', bounds.west)
          .lte('lng', bounds.east);
      }

      const { data: reportsData, error: reportsError } = await query;

      if (reportsError) throw reportsError;

      // Get vote counts for each report
      const reportsWithVotes = await Promise.all(
        (reportsData || []).map(async (report) => {
          const { data: votes } = await supabase
            .from('safety_votes')
            .select('vote')
            .eq('report_id', report.id);

          const voteCount = (votes || []).reduce((sum, v) => sum + v.vote, 0);

          // Get user's vote if logged in
          let userVote = 0;
          if (user) {
            const { data: userVoteData } = await supabase
              .from('safety_votes')
              .select('vote')
              .eq('report_id', report.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userVote = userVoteData?.vote || 0;
          }

          return {
            ...report,
            lat: Number(report.lat),
            lng: Number(report.lng),
            vote_count: voteCount,
            user_vote: userVote,
          } as SafetyReport;
        })
      );

      setReports(reportsWithVotes);
    } catch (error) {
      console.error('Error fetching safety reports:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createReport = useCallback(async (
    lat: number,
    lng: number,
    reportType: ReportType,
    description?: string,
    timeRelevance: TimeRelevance = 'always',
    expiresInHours?: number
  ) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit safety reports',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const expiresAt = expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('safety_reports')
        .insert({
          user_id: user.id,
          lat,
          lng,
          report_type: reportType,
          description,
          time_relevance: timeRelevance,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep others safe',
      });

      // Refresh reports
      await fetchReports();

      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Failed to submit report',
        description: 'Please try again later',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast, fetchReports]);

  const vote = useCallback(async (reportId: string, voteValue: 1 | -1) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on reports',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('safety_votes')
        .select('*')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote === voteValue) {
          // Remove vote if clicking same button
          await supabase
            .from('safety_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('safety_votes')
            .update({ vote: voteValue })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('safety_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
            vote: voteValue,
          });
      }

      // Refresh reports to update vote counts
      await fetchReports();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Vote failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('safety_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Report deleted',
      });

      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Failed to delete report',
        variant: 'destructive',
      });
    }
  }, [user, toast, fetchReports]);

  // Initial fetch for Paris area
  useEffect(() => {
    fetchReports({
      north: 48.92,
      south: 48.80,
      east: 2.47,
      west: 2.22,
    });
  }, [fetchReports]);

  return {
    reports,
    loading,
    createReport,
    vote,
    deleteReport,
    refreshReports: fetchReports,
  };
}
