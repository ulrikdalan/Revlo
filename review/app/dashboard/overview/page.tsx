import { createClient } from '@supabase/supabase-js'
import { PostgrestError } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Spinner } from '@/app/components/Spinner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Dynamic import with loading fallback
const DynamicRecentExternalReviews = dynamic(
  () => import('@/app/dashboard/reviews/RecentExternalReviews'),
  { loading: () => <Spinner /> }
)

// Definere typer
type SentEmail = {
  id: string
  name: string
  email: string
  status: string
  sent_at: string
  reminder_sent_at: string | null
  clicked_at: string | null
  review_link: string
  token?: string
  user_id: string
}

type EmailStats = {
  totalEmails: number
  remindersCount: number
  clickedCount: number
  conversionRate: number
  weeklyData: {
    date: string
    sent: number
    reminders: number
    clicks: number
  }[]
  allEmails: SentEmail[]
  statusCounts: {
    status: string
    count: number
  }[]
}

// Funksjon for å hente statistikk
async function getEmailStatistics(userId: string): Promise<EmailStats> {
  // Admin Supabase-klient for databasetilgang
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hent alle e-poster (med no-store for å unngå cache), filtrert på bruker-ID
  let emails: SentEmail[] = [];
  try {
    const { data, error } = await adminSupabase
      .from('sent_emails')
      .select('*')
      .eq('user_id', userId) // Filtrer etter bruker-ID
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('Error fetching email data:', error)
      throw error
    }

    emails = data as SentEmail[] || []
  } catch (err) {
    console.error('Error in Supabase query:', err)
    throw err
  }

  // Beregn statistikk
  const totalEmails = emails.length
  const remindersCount = emails.filter((email: SentEmail) => email.reminder_sent_at !== null).length
  const clickedCount = emails.filter((email: SentEmail) => email.clicked_at !== null).length
  const conversionRate = totalEmails > 0 ? (clickedCount / totalEmails) * 100 : 0

  // Status-opptelling
  const statusMap: Record<string, number> = {}
  emails.forEach((email: SentEmail) => {
    statusMap[email.status] = (statusMap[email.status] || 0) + 1
  })
  const statusCounts = Object.entries(statusMap).map(([status, count]) => ({
    status,
    count
  }))

  // Beregn ukentlig data (siste 7 dager)
  const weeklyData = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const sent = emails.filter((email: SentEmail) => {
      const emailDate = new Date(email.sent_at).toISOString().split('T')[0]
      return emailDate === dateStr
    }).length

    const reminders = emails.filter((email: SentEmail) => {
      if (!email.reminder_sent_at) return false
      const reminderDate = new Date(email.reminder_sent_at).toISOString().split('T')[0]
      return reminderDate === dateStr
    }).length

    const clicks = emails.filter((email: SentEmail) => {
      if (!email.clicked_at) return false
      const clickDate = new Date(email.clicked_at).toISOString().split('T')[0]
      return clickDate === dateStr
    }).length

    weeklyData.push({ date: dateStr, sent, reminders, clicks })
  }

  return {
    totalEmails,
    remindersCount,
    clickedCount,
    conversionRate,
    weeklyData,
    allEmails: emails,
    statusCounts
  }
}

// Page configuration
export const dynamicConfig = 'force-dynamic';
export const revalidate = 0;

export default async function OverviewPage() {
  // Server-side Supabase-klient for autentisering
  const supabase = createServerSupabaseClient();
  
  // Hent gjeldende brukersesjon
  const { data: { session } } = await supabase.auth.getSession();
  
  // Sjekk om brukeren er logget inn
  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700"></div>
            <CardContent className="p-6">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-6">
                <h2 className="text-lg font-semibold text-red-800 mb-2">Ikke innlogget</h2>
                <p className="mb-4">Du må være logget inn for å se denne siden.</p>
                <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  Gå til innloggingssiden
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Hent statistikk
  let stats: EmailStats
  let error = null

  try {
    stats = await getEmailStatistics(session.user.id)
  } catch (err) {
    console.error('Error in overview page:', err)
    error = err
    stats = {
      totalEmails: 0,
      remindersCount: 0,
      clickedCount: 0,
      conversionRate: 0,
      weeklyData: [],
      allEmails: [],
      statusCounts: []
    }
  }

  // Formater dato til norsk format
  function formatDate(dateString: string) {
    if (!dateString) return '-';
    const date = new Date(dateString)
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Oversikt over e-postaktivitet</CardTitle>
          </CardHeader>
        </Card>

        {error ? (
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-700"></div>
            <CardContent className="p-6">
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <p className="font-semibold text-red-800">Det oppstod en feil ved henting av data:</p>
                <p className="text-red-700">{String(error)}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader className="pb-2">
                  <CardTitle>Nyeste anmeldelser</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicRecentExternalReviews />
                </CardContent>
              </Card>
              
              {/* Statistikk-kort */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader className="pb-2">
                  <CardTitle>Statistikk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-md">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">Totale forespørsler</h3>
                      <p className="text-3xl font-bold text-blue-700">{stats.totalEmails}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100 shadow-md">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Sendte påminnelser</h3>
                      <p className="text-3xl font-bold text-green-700">{stats.remindersCount}</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl border border-yellow-100 shadow-md">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">Klikket på lenke</h3>
                      <p className="text-3xl font-bold text-yellow-700">{stats.clickedCount}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100 shadow-md">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">Konverteringsrate</h3>
                      <p className="text-3xl font-bold text-purple-700">
                        {stats.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status fordeling */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardHeader className="pb-2">
                <CardTitle>Status fordeling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {stats.statusCounts.map((status, index) => (
                    <div 
                      key={index} 
                      className="flex-1 min-w-[150px] p-5 rounded-xl shadow-sm transition-transform duration-200 hover:-translate-y-1"
                      style={{
                        background: status.status === 'SENT' 
                          ? 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)' 
                          : status.status === 'REMINDER_SENT' 
                            ? 'linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%)' 
                            : 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)',
                        border: status.status === 'SENT'
                          ? '1px solid #91caff'
                          : status.status === 'REMINDER_SENT'
                            ? '1px solid #b7eb8f'
                            : '1px solid #d3adf7'
                      }}
                    >
                      <div className="text-lg font-semibold">{status.status}</div>
                      <div className="text-2xl font-bold">{status.count}</div>
                      <div className="text-sm">
                        {Math.round((status.count / stats.totalEmails) * 100)}% av alle
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ukentlig aktivitet */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardHeader className="pb-2">
                <CardTitle>Ukentlig aktivitet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dato</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sendte forespørsler</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sendte påminnelser</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klikk på lenke</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.weeklyData.map((day, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.sent}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.reminders}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{day.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Nylige forespørsler */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardHeader className="pb-2">
                <CardTitle>Nylige forespørsler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Navn
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          E-post
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sendt
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Påminnelse
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Klikket
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.allEmails.slice(0, 10).map((email) => (
                        <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{email.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              email.status === "SENT" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {email.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(email.sent_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.reminder_sent_at ? formatDate(email.reminder_sent_at) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.clicked_at ? (
                              <span className="flex items-center">
                                <span className="mr-2 w-2 h-2 bg-green-500 rounded-full"></span>
                                {formatDate(email.clicked_at)}
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <span className="mr-2 w-2 h-2 bg-gray-300 rounded-full"></span>
                                Nei
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stats.allEmails.length > 10 && (
                    <div className="mt-6 text-center">
                      <Link 
                        href="/dashboard/sent-reviews" 
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        Se alle ({stats.allEmails.length})
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 