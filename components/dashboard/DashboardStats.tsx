'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type StatsData = {
  completedReviews: number;
  pendingReviews: number;
  clickRate: number;
  reviewGrowth: number;
  clickRateChange: number;
}

export default function DashboardStats() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData>({
    completedReviews: 0,
    pendingReviews: 0,
    clickRate: 0,
    reviewGrowth: 0,
    clickRateChange: 0
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserAndStats() {
      try {
        setLoading(true);
        
        // Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Error fetching session:', sessionError?.message || 'No session');
          setLoading(false);
          return;
        }
        
        setUser(session.user);

        // For now, using dummy data since we don't have the actual queries set up
        // These would normally come from Supabase queries based on the user's ID
        
        // In a real implementation, we would:
        // 1. Query sent_emails for all emails sent by the user
        // 2. Count completed reviews (those that resulted in a review)
        // 3. Count pending reviews (those that were sent but not completed)
        // 4. Calculate click rate (clicked / total sent)
        // 5. Calculate growth rates by comparing to previous period
        
        const dummyStats: StatsData = {
          completedReviews: Math.floor(Math.random() * 100) + 20,
          pendingReviews: Math.floor(Math.random() * 30) + 5,
          clickRate: Math.random() * 0.4 + 0.2, // 20-60% click rate
          reviewGrowth: Math.random() * 0.4 - 0.1, // -10% to +30% growth
          clickRateChange: Math.random() * 0.2 - 0.05 // -5% to +15% change
        };
        
        setStats(dummyStats);
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndStats();
  }, [supabase]);

  // Helper to format percentages
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  // Helper to determine trend direction and color
  const getTrendIndicator = (value: number) => {
    if (value > 0.02) {
      return { 
        icon: <TrendingUp className="w-4 h-4" />, 
        color: 'text-green-600',
        text: 'opp'
      };
    } else if (value < -0.02) {
      return { 
        icon: <TrendingDown className="w-4 h-4" />, 
        color: 'text-red-600',
        text: 'ned'
      };
    } else {
      return { 
        icon: <Minus className="w-4 h-4" />, 
        color: 'text-gray-500',
        text: 'uendret'
      };
    }
  };

  const reviewTrend = getTrendIndicator(stats.reviewGrowth);
  const clickTrend = getTrendIndicator(stats.clickRateChange);

  if (loading) {
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 text-red-600">
        Kunne ikke laste statistikk: {error}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Completed Reviews */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
        <p className="text-gray-500 text-sm font-medium">Fullførte vurderinger</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900">{stats.completedReviews}</p>
          <div className={`flex items-center text-sm ${reviewTrend.color}`}>
            {reviewTrend.icon}
            <span className="ml-1">{formatPercent(Math.abs(stats.reviewGrowth))}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">fra forrige måned</p>
      </div>

      {/* Pending Reviews */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100 shadow-sm">
        <p className="text-gray-500 text-sm font-medium">Ventende vurderinger</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</p>
          <div className="flex items-center text-sm text-amber-600">
            <span className="px-2 py-1 bg-amber-100 rounded-full text-xs">Aktive</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">ubesvarte henvendelser</p>
      </div>

      {/* Click Rate */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 shadow-sm">
        <p className="text-gray-500 text-sm font-medium">Klikk-rate</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900">{formatPercent(stats.clickRate)}</p>
          <div className={`flex items-center text-sm ${clickTrend.color}`}>
            {clickTrend.icon}
            <span className="ml-1">{formatPercent(Math.abs(stats.clickRateChange))}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">av alle henvendelser</p>
      </div>
    </div>
  );
} 