'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProtectedRoute from '@/components/ProtectedRoute';
import { format, subDays, parseISO, startOfWeek, getWeek } from 'date-fns';
import { nb } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import Link from 'next/link';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import { BarChart2 } from 'lucide-react';

type EmailData = {
  id: string;
  user_id: string;
  sent_at: string;
  clicked_at: string | null;
};

type DailyMetric = {
  date: string;
  sentCount: number;
  clickCount: number;
};

type WeeklyMetric = {
  week: string;
  weekNumber: number;
  sentCount: number;
  clickCount: number;
  responseRate: number;
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalSent: 0,
    totalClicked: 0,
    responseRate: 0,
  });
  const [activeChart, setActiveChart] = useState<'sent' | 'clicked' | 'compare'>('compare');
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchEmailData() {
      setLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error('Du må være innlogget for å se denne siden');
        }

        const userId = session.user.id;
        
        // Calculate date range (last 30 days)
        const endDate = new Date();
        const startDate = subDays(endDate, 30);
        
        // Fetch email data for the user
        const { data, error: fetchError } = await supabase
          .from('sent_emails')
          .select('id, user_id, sent_at, clicked_at')
          .eq('user_id', userId)
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())
          .order('sent_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Process data into metrics
        const processedData = processEmailData(data || []);
        setDailyMetrics(processedData.dailyMetrics);
        setWeeklyMetrics(processedData.weeklyMetrics);
        setOverallStats(processedData.overallStats);
      } catch (err: any) {
        console.error('Error fetching email data:', err);
        setError(err.message || 'En feil oppstod ved henting av e-postdata');
      } finally {
        setLoading(false);
      }
    }

    fetchEmailData();
  }, [supabase]);

  // Process raw email data into metrics
  const processEmailData = (emails: EmailData[]) => {
    // Create maps to store metrics
    const metricsByDate = new Map<string, { sentCount: number; clickCount: number }>();
    const metricsByWeek = new Map<string, { 
      weekNumber: number,
      sentCount: number; 
      clickCount: number;
    }>();
    
    // Initialize the last 30 days with zero values
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      metricsByDate.set(dateString, { sentCount: 0, clickCount: 0 });
      
      // Initialize weeks
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
      const weekNumber = getWeek(date, { weekStartsOn: 1 });
      const weekString = format(weekStart, 'yyyy-ww');
      
      if (!metricsByWeek.has(weekString)) {
        metricsByWeek.set(weekString, { 
          weekNumber,
          sentCount: 0, 
          clickCount: 0 
        });
      }
    }
    
    // Process each email
    let totalSent = 0;
    let totalClicked = 0;
    
    emails.forEach(email => {
      const sentDate = parseISO(email.sent_at);
      const sentDateString = format(sentDate, 'yyyy-MM-dd');
      
      // Get week info
      const weekStart = startOfWeek(sentDate, { weekStartsOn: 1 });
      const weekNumber = getWeek(sentDate, { weekStartsOn: 1 });
      const weekString = format(weekStart, 'yyyy-ww');
      
      // Update sent count for the date
      if (metricsByDate.has(sentDateString)) {
        const currentMetrics = metricsByDate.get(sentDateString)!;
        currentMetrics.sentCount += 1;
        metricsByDate.set(sentDateString, currentMetrics);
      }
      
      // Update sent count for the week
      if (metricsByWeek.has(weekString)) {
        const currentWeekMetrics = metricsByWeek.get(weekString)!;
        currentWeekMetrics.sentCount += 1;
        metricsByWeek.set(weekString, currentWeekMetrics);
      }
      
      // Update click count if clicked
      if (email.clicked_at) {
        const clickedDate = parseISO(email.clicked_at);
        const clickedDateString = format(clickedDate, 'yyyy-MM-dd');
        
        // Update click count for the day
        if (metricsByDate.has(clickedDateString)) {
          const currentMetrics = metricsByDate.get(clickedDateString)!;
          currentMetrics.clickCount += 1;
          metricsByDate.set(clickedDateString, currentMetrics);
        }
        
        // Update click count for the week
        const clickedWeekStart = startOfWeek(clickedDate, { weekStartsOn: 1 });
        const clickedWeekString = format(clickedWeekStart, 'yyyy-ww');
        
        if (metricsByWeek.has(clickedWeekString)) {
          const currentWeekMetrics = metricsByWeek.get(clickedWeekString)!;
          currentWeekMetrics.clickCount += 1;
          metricsByWeek.set(clickedWeekString, currentWeekMetrics);
        }
        
        totalClicked += 1;
      }
      
      totalSent += 1;
    });
    
    // Convert maps to arrays and sort
    const dailyMetrics = Array.from(metricsByDate.entries())
      .map(([date, metrics]) => ({
        date,
        sentCount: metrics.sentCount,
        clickCount: metrics.clickCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const weeklyMetrics = Array.from(metricsByWeek.entries())
      .map(([week, metrics]) => ({
        week,
        weekNumber: metrics.weekNumber,
        sentCount: metrics.sentCount,
        clickCount: metrics.clickCount,
        responseRate: metrics.sentCount > 0 ? (metrics.clickCount / metrics.sentCount) * 100 : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
    
    // Calculate overall response rate
    const responseRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    
    return {
      dailyMetrics,
      weeklyMetrics,
      overallStats: {
        totalSent,
        totalClicked,
        responseRate,
      },
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'd. MMM', { locale: nb });
  };
  
  // Format week for display
  const formatWeek = (weekString: string) => {
    const [year, week] = weekString.split('-');
    return `Uke ${week}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      );
    }

    return (
      <div className="space-y-10">
        {/* Nøkkeltall Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Nøkkeltall</h2>
          
          <AnalyticsOverview 
            requestsSent={overallStats.totalSent}
            reviewsReceived={Math.round(overallStats.totalSent * 0.33)}
            clickRate={overallStats.responseRate}
            remindersSent={Math.round(overallStats.totalSent * 0.4)}
            weeklyGrowth={15}
            conversionRate={33.6}
            isAboveAverage={overallStats.responseRate > 40}
            newReminders={17}
          />
          
          {/* Response Rate Card */}
          <div className="mt-4">
            <Card className="rounded-xl shadow-md overflow-hidden">
              <CardHeader className="pb-2 relative">
                <div className="absolute top-4 right-4 p-2 bg-purple-100 text-purple-600 rounded-full">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Svarprosent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.responseRate.toFixed(1)}%</div>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  Klikk / Sendte e-poster
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Trenddata Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trenddata</h2>
            
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveChart('sent')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeChart === 'sent' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Sendte
              </button>
              <button
                onClick={() => setActiveChart('clicked')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeChart === 'clicked' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Klikk
              </button>
              <button
                onClick={() => setActiveChart('compare')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeChart === 'compare' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                Sammenlign
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Daily Trend Chart */}
            <Card className="col-span-full">
              <CardHeader className="relative">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {overallStats.totalSent} sendt
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {overallStats.totalClicked} klikk
                  </span>
                </div>
                <CardTitle>
                  {activeChart === 'sent' && 'Sendte e-poster per dag'}
                  {activeChart === 'clicked' && 'Klikk per dag'}
                  {activeChart === 'compare' && 'Sammenligning: Sendte vs. Klikk'}
                </CardTitle>
                <CardDescription>Siste 30 dager</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyMetrics}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: ValueType, name: NameType) => {
                        if (name === 'sentCount') return [`${value} e-poster`, 'Sendt'];
                        if (name === 'clickCount') return [`${value} klikk`, 'Klikk'];
                        return [value, name];
                      }}
                      labelFormatter={(label: string) => formatDate(label)}
                    />
                    <Legend />
                    {(activeChart === 'sent' || activeChart === 'compare') && (
                      <Line 
                        type="monotone" 
                        dataKey="sentCount" 
                        name="Sendte e-poster" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    )}
                    {(activeChart === 'clicked' || activeChart === 'compare') && (
                      <Line 
                        type="monotone" 
                        dataKey="clickCount" 
                        name="Klikk" 
                        stroke="#10b981" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daglig oversikt</TabsTrigger>
              <TabsTrigger value="weekly">Ukentlig oversikt</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-6 mt-6">
              {/* Weekly Email Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Daglig e-poststatistikk</CardTitle>
                  <CardDescription>Detaljert oversikt over daglig e-postaktivitet</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyMetrics.slice(-14)} // Last 14 days
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: ValueType, name: NameType) => {
                          if (name === 'sentCount') return [`${value} e-poster`, 'Sendt'];
                          if (name === 'clickCount') return [`${value} klikk`, 'Klikk'];
                          return [value, name];
                        }}
                        labelFormatter={(label: string) => formatDate(label)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="sentCount" 
                        name="Sendte e-poster" 
                        fill="#3b82f6" 
                      />
                      <Bar 
                        dataKey="clickCount" 
                        name="Klikk" 
                        fill="#10b981" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="weekly" className="space-y-6 mt-6">
              {/* Weekly Email Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Ukentlig e-postaktivitet</CardTitle>
                  <CardDescription>Sendte e-poster og klikk per uke</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyMetrics}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        tickFormatter={formatWeek} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: ValueType, name: NameType) => {
                          if (name === 'responseRate') {
                            return [`${Number(value).toFixed(1)}%`, 'Svarprosent'];
                          }
                          return [value, name === 'sentCount' ? 'Sendte e-poster' : 'Klikk'];
                        }}
                        labelFormatter={(label: string) => formatWeek(label)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="sentCount" 
                        name="Sendte e-poster" 
                        fill="#3b82f6"
                      />
                      <Bar 
                        dataKey="clickCount" 
                        name="Klikk" 
                        fill="#10b981" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Weekly Response Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Ukentlig svarprosent</CardTitle>
                  <CardDescription>Prosentandel klikk per sendte e-poster per uke</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyMetrics}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        tickFormatter={formatWeek} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: ValueType) => [`${Number(value).toFixed(1)}%`, 'Svarprosent']}
                        labelFormatter={(label: string) => formatWeek(label)}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="responseRate" 
                        name="Svarprosent" 
                        stroke="#8b5cf6" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Analysetavle</h1>
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:underline"
            >
              ← Tilbake til dashboard
            </Link>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </ProtectedRoute>
  );
} 