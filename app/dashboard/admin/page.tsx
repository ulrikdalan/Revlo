import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminNavigation from './AdminNavigation';

type UserStats = {
  id: string;
  email: string;
  total_sent: number;
  total_clicked: number;
  click_rate: number;
  response_rate: number;
};

type EmailCount = {
  user_id: string;
  count: string;
};

type DailyEmailCount = {
  send_date: string;
  email_count: number;
};

// Gjør siden dynamisk for å unngå caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  // Opprett Supabase-klient for serverside bruk
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Bruk getUser i stedet for getSession for å få autentisert brukerdata
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Sjekk om brukeren er logget inn
  if (userError || !user) {
    console.error('Authentication error:', userError || 'No user found');
    redirect('/login');
  }
  
  // Hent ADMIN_UID fra miljøvariabel
  const adminUid = process.env.ADMIN_UID;
  
  // Sjekk om brukeren har admin-tilgang ved å sammenligne bruker-ID med ADMIN_UID
  if (!adminUid || user.id !== adminUid) {
    console.log(`Access denied: User ${user.id} tried to access admin page`);
    redirect('/dashboard');
  }
  
  // Opprett admin-klient med service role for å få tilgang til auth.users
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
  
  // Hent alle brukere fra auth
  const { data: userData, error: usersError } = await adminSupabase.auth.admin.listUsers();
  
  if (usersError) {
    throw new Error(`Feil ved henting av brukere: ${usersError.message}`);
  }
  
  // Beregn antall brukere fra userData
  const userCount = userData?.users?.length || 0;
  
  // Hent e-poster sendt per dag
  const { data: dailyEmailCounts, error: dailyCountsError } = await adminSupabase
    .rpc('get_email_counts_per_day');
    
  if (dailyCountsError) {
    throw new Error(`Feil ved henting av daglige e-posttall: ${dailyCountsError.message}`);
  }
  
  // Begrenset til de siste 14 dagene for bedre visning
  const recentDailyEmailCounts = dailyEmailCounts?.slice(0, 14) || [];
  
  // Reversere rekkefølgen for chart (eldste til nyeste)
  const chartData = [...recentDailyEmailCounts].reverse();
  
  let userStats: UserStats[] = [];
  
  if (userData && userData.users && userData.users.length > 0) {
    try {
      // Hent antall sendte e-poster per bruker ved hjelp av SQL
      const { data: sentCounts, error: sentError } = await adminSupabase
        .rpc('get_email_counts_by_user');
        
      if (sentError) {
        throw new Error(`Feil ved henting av sendte e-poster: ${sentError.message}`);
      }
      
      // Hent antall klikk per bruker ved hjelp av SQL
      const { data: clickCounts, error: clickError } = await adminSupabase
        .rpc('get_click_counts_by_user');
        
      if (clickError) {
        throw new Error(`Feil ved henting av klikk: ${clickError.message}`);
      }
      
      // Alternativ metode: Hent alle e-poster og beregn statistikk på server-siden
      // hvis RPC-funksjonene ikke er opprettet ennå
      if (!sentCounts || !clickCounts) {
        // Hent alle e-poster
        const { data: allEmails, error: emailsError } = await adminSupabase
          .from('sent_emails')
          .select('*');
          
        if (emailsError) {
          throw new Error(`Feil ved henting av e-poster: ${emailsError.message}`);
        }
        
        // Beregn statistikk for hvert brukernavn
        const userStatsMap = new Map<string, { sent: number, clicked: number }>();
        
        // Teller sendte e-poster
        allEmails?.forEach(email => {
          const userId = email.user_id;
          const stats = userStatsMap.get(userId) || { sent: 0, clicked: 0 };
          stats.sent += 1;
          
          // Teller klikk
          if (email.clicked_at !== null) {
            stats.clicked += 1;
          }
          
          userStatsMap.set(userId, stats);
        });
        
        // Slår sammen med brukerinfo
        const stats = userData.users.map(user => {
          const userStats = userStatsMap.get(user.id) || { sent: 0, clicked: 0 };
          const clickRate = userStats.sent > 0 ? (userStats.clicked / userStats.sent) * 100 : 0;
          
          return {
            id: user.id,
            email: user.email || 'Ukjent e-post',
            total_sent: userStats.sent,
            total_clicked: userStats.clicked,
            click_rate: clickRate,
            response_rate: 70 // Dummy-verdi som spesifisert
          };
        });
        
        // Sorter statistikken etter antall sendte e-poster (synkende)
        userStats = stats.sort((a, b) => b.total_sent - a.total_sent);
      } else {
        // Bruk RPC-resultatene hvis tilgjengelig
        const sentMap = new Map<string, number>();
        sentCounts.forEach((item: EmailCount) => {
          sentMap.set(item.user_id, parseInt(item.count));
        });
        
        const clickMap = new Map<string, number>();
        clickCounts.forEach((item: EmailCount) => {
          clickMap.set(item.user_id, parseInt(item.count));
        });
        
        // Beregn statistikk for hver bruker
        const stats = userData.users.map(user => {
          const totalSent = sentMap.get(user.id) || 0;
          const totalClicked = clickMap.get(user.id) || 0;
          const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
          
          return {
            id: user.id,
            email: user.email || 'Ukjent e-post',
            total_sent: totalSent,
            total_clicked: totalClicked,
            click_rate: clickRate,
            response_rate: 70 // Dummy-verdi som spesifisert
          };
        });
        
        // Sorter statistikken etter antall sendte e-poster (synkende)
        userStats = stats.sort((a, b) => b.total_sent - a.total_sent);
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
  
  // Beregn totale aggregerte verdier
  const totalEmails = userStats.reduce((sum, user) => sum + user.total_sent, 0);
  const totalClicks = userStats.reduce((sum, user) => sum + user.total_clicked, 0);
  const overallClickRate = totalEmails > 0 ? ((totalClicks / totalEmails) * 100).toFixed(1) : '0.0';

  // Funksjon for å formatere dato
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Finn høyeste verdi for riktig graf-skala
  const maxDailyEmails = Math.max(...chartData.map(day => day.email_count), 1);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          
          <AdminNavigation />
          
          {/* Sammendrag - Nå med antall brukere */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Totalt antall e-poster</h3>
              <p className="text-2xl font-bold text-blue-900">{totalEmails}</p>
            </div>
            <div className="bg-green-50 p-4 rounded border border-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-2">Totalt antall klikk</h3>
              <p className="text-2xl font-bold text-green-900">{totalClicks}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded border border-purple-100">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Gjennomsnittlig klikkrate</h3>
              <p className="text-2xl font-bold text-purple-900">{overallClickRate}%</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">Antall brukere</h3>
              <p className="text-2xl font-bold text-indigo-900">{userCount}</p>
            </div>
          </div>
          
          {/* Graf - E-poster sendt per dag */}
          <div className="bg-white rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">E-poster sendt per dag</h2>
            {chartData.length > 0 ? (
              <div className="h-64">
                <div className="flex h-full items-end">
                  {chartData.map((day, index) => {
                    const height = (day.email_count / maxDailyEmails) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center mx-1 flex-1">
                        <div 
                          className="bg-blue-500 w-full rounded-t" 
                          style={{ height: `${height}%`, minHeight: day.email_count > 0 ? '8px' : '0' }}
                        ></div>
                        <div className="text-xs mt-1 text-gray-600 w-full text-center overflow-hidden whitespace-nowrap">
                          {formatDate(day.send_date)}
                        </div>
                        <div className="text-xs font-semibold">{day.email_count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Ingen e-poster sendt ennå
              </div>
            )}
          </div>
        </div>
        
        {/* Brukertabell */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Brukerstatistikk</h2>
          
          {userStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">E-post</th>
                    <th className="py-2 px-4 border-b text-right">Sendte e-poster</th>
                    <th className="py-2 px-4 border-b text-right">Antall klikk</th>
                    <th className="py-2 px-4 border-b text-right">Klikkrate</th>
                    <th className="py-2 px-4 border-b text-right">Svarprosent</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((stat, index) => (
                    <tr key={stat.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b">{stat.email}</td>
                      <td className="py-2 px-4 border-b text-right">{stat.total_sent}</td>
                      <td className="py-2 px-4 border-b text-right">{stat.total_clicked}</td>
                      <td className="py-2 px-4 border-b text-right">{stat.click_rate.toFixed(1)}%</td>
                      <td className="py-2 px-4 border-b text-right">{stat.response_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded text-center">
              Ingen brukere funnet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 