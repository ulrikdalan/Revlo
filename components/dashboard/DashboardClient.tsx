'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Clock, 
  FileEdit, 
  Star, 
  Settings, 
  Globe, 
  BarChart, 
  Users, 
  MessageSquare,
  FileSearch,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import DashboardStats from '@/components/dashboard/DashboardStats'

type SentEmail = {
  id: string
  email: string
  sent_at: string
  status: string
  user_id: string
}

// Define dashboard action groups
const dashboardActions = {
  vurderinger: [
    {
      title: "Send vurderingsforespørsel",
      description: "Send ut forespørsel om vurdering til kunder",
      icon: <Mail className="h-6 w-6" />,
      href: "/dashboard/reviews",
      color: "blue"
    },
    {
      title: "Oppfølgingspåminnelser",
      description: "Send påminnelser til kunder som ikke har gitt tilbakemelding",
      icon: <Clock className="h-6 w-6" />,
      href: "/dashboard/reminders",
      color: "purple"
    },
    {
      title: "Sendte forespørsler",
      description: "Se historikk over alle sendte vurderingsforespørsler",
      icon: <FileSearch className="h-6 w-6" />,
      href: "/dashboard/sent-reviews",
      color: "amber"
    },
    {
      title: "E-postmaler",
      description: "Administrer og rediger dine e-postmaler",
      icon: <FileEdit className="h-6 w-6" />,
      href: "/dashboard/templates",
      color: "green"
    }
  ],
  analyse: [
    {
      title: "Analyser",
      description: "Se statistikk og innsikt for dine vurderinger",
      icon: <BarChart className="h-6 w-6" />,
      href: "/dashboard/analytics",
      color: "cyan"
    },
    {
      title: "Eksterne anmeldelser",
      description: "Se dine eksterne anmeldelser fra tilkoblede plattformer",
      icon: <Star className="h-6 w-6" />,
      href: "/dashboard/reviews/external",
      color: "indigo"
    }
  ],
  settings: [
    {
      title: "Innstillinger",
      description: "Endre kontoinnstillinger og preferanser",
      icon: <Settings className="h-6 w-6" />,
      href: "/dashboard/settings",
      color: "gray"
    },
    {
      title: "Google-konto",
      description: "Koble til og administrer Google-kontoen din",
      icon: <Globe className="h-6 w-6" />,
      href: "/dashboard/google-account",
      color: "red"
    },
    {
      title: "Kunde-administrasjon",
      description: "Administrer dine kunder og deres informasjon",
      icon: <Users className="h-6 w-6" />,
      href: "/dashboard/customers",
      color: "teal"
    }
  ]
};

// Helper function to get color classes based on color name
const getColorClasses = (color: string) => {
  const colorMap: {[key: string]: {bg: string, hover: string, border: string, text: string}} = {
    blue: {
      bg: "bg-blue-50",
      hover: "hover:bg-blue-100",
      border: "border-blue-200",
      text: "text-blue-600"
    },
    purple: {
      bg: "bg-purple-50",
      hover: "hover:bg-purple-100",
      border: "border-purple-200",
      text: "text-purple-600"
    },
    green: {
      bg: "bg-green-50",
      hover: "hover:bg-green-100",
      border: "border-green-200",
      text: "text-green-600"
    },
    indigo: {
      bg: "bg-indigo-50",
      hover: "hover:bg-indigo-100",
      border: "border-indigo-200",
      text: "text-indigo-600"
    },
    amber: {
      bg: "bg-amber-50",
      hover: "hover:bg-amber-100",
      border: "border-amber-200",
      text: "text-amber-600"
    },
    cyan: {
      bg: "bg-cyan-50",
      hover: "hover:bg-cyan-100",
      border: "border-cyan-200",
      text: "text-cyan-600"
    },
    red: {
      bg: "bg-red-50",
      hover: "hover:bg-red-100",
      border: "border-red-200",
      text: "text-red-600"
    },
    gray: {
      bg: "bg-gray-50",
      hover: "hover:bg-gray-100",
      border: "border-gray-200",
      text: "text-gray-600"
    },
    teal: {
      bg: "bg-teal-50",
      hover: "hover:bg-teal-100",
      border: "border-teal-200",
      text: "text-teal-600"
    }
  };

  return colorMap[color] || colorMap.blue;
};

// Helper function to get section theme colors
const getSectionTheme = (section: string) => {
  const themeMap: {[key: string]: {bg: string, border: string, text: string, cardBg: string, headerBg: string}} = {
    vurderinger: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      cardBg: "bg-blue-100 bg-opacity-30",
      headerBg: "bg-blue-200"
    },
    analyse: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
      cardBg: "bg-green-100 bg-opacity-30",
      headerBg: "bg-green-200"
    },
    settings: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-600",
      cardBg: "bg-yellow-100 bg-opacity-30",
      headerBg: "bg-yellow-200"
    }
  };

  return themeMap[section] || themeMap.vurderinger;
};

export default function DashboardClient() {
  const [loading, setLoading] = useState(false)
  const [recentEmails, setRecentEmails] = useState<SentEmail[]>([])
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [emailsError, setEmailsError] = useState<string | null>(null)
  const [visibleSections, setVisibleSections] = useState({
    vurderinger: true,
    analyse: true,
    settings: true
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  const toggleSection = (section: string) => {
    setVisibleSections({
      ...visibleSections,
      [section]: !visibleSections[section as keyof typeof visibleSections]
    });
  };

  useEffect(() => {
    async function fetchRecentEmails() {
      try {
        setEmailsLoading(true)
        
        // Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('Error fetching session:', sessionError?.message || 'No session')
          setEmailsLoading(false)
          return
        }
        
        const { data, error } = await supabase
          .from('sent_emails')
          .select('id, email, sent_at, status, user_id')
          .eq('user_id', session.user.id)
          .order('sent_at', { ascending: false })
          .limit(5)

        if (error) throw error
        setRecentEmails(data || [])
      } catch (error: any) {
        console.error('Error fetching recent emails:', error)
        setEmailsError(error.message)
      } finally {
        setEmailsLoading(false)
      }
    }

    fetchRecentEmails()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Function to render a section with cards
  const renderSection = (sectionKey: string, title: string, icon: JSX.Element, actions: any[]) => {
    const theme = getSectionTheme(sectionKey);
    const isVisible = visibleSections[sectionKey as keyof typeof visibleSections];
    
    return (
      <section className="mt-8 first:mt-0">
        <div className={`${theme.headerBg} border border-muted shadow-sm rounded-lg px-4 py-3 mb-4`}>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection(sectionKey)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${theme.text}`}>
                {icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            </div>
            <div>
              <ChevronDown 
                className={cn("h-5 w-5 transition-transform", isVisible && "rotate-180")}
              />
            </div>
          </div>
        </div>
        
        <div className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isVisible ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {actions.map((action, index) => {
              const colorClasses = getColorClasses(action.color);
              return (
                <Link href={action.href} key={index} className="block">
                  <div className={`${theme.cardBg} border-[1.5px] border-gray-300 rounded-xl px-4 py-3 hover:bg-opacity-50 transition-all duration-300 shadow-sm min-h-[120px] flex items-center`}>
                    <div className="flex items-center gap-4 w-full">
                      <div className={`rounded-full p-3 bg-white ${theme.text} flex-shrink-0`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-1.5">{action.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-snug">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 p-6 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Card */}
        <Card className="overflow-hidden border-0 shadow-lg rounded-2xl">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            </div>
            <DashboardStats />
          </CardHeader>
        </Card>
        
        {/* Vurderingsutsendelser */}
        {renderSection("vurderinger", "Vurderingsutsendelser", <Mail className="h-6 w-6" />, dashboardActions.vurderinger)}
        
        {/* Analyse og innsikt */}
        {renderSection("analyse", "Analyse og innsikt", <BarChart className="h-6 w-6" />, dashboardActions.analyse)}
        
        {/* Innstillinger og integrasjoner */}
        {renderSection("settings", "Innstillinger og integrasjoner", <Settings className="h-6 w-6" />, dashboardActions.settings)}
        
        {/* Nylige vurderingsforespørsler */}
        <Card className="border-0 shadow-lg overflow-hidden rounded-2xl mt-10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">Nylige vurderingsforespørsler</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {emailsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : emailsError ? (
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 text-red-700 mb-4">
                Feil ved lasting av data: {emailsError}
              </div>
            ) : recentEmails.length === 0 ? (
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-blue-800">
                Ingen vurderingsforespørsler sendt ennå.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        E-post
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sendt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {email.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(email.sent_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            email.status === "SENT" ? "bg-green-100 text-green-800" : 
                            email.status === "REMINDER_SENT" ? "bg-blue-100 text-blue-800" : 
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-6 text-center">
                  <Link 
                    href="/dashboard/sent-reviews"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 font-medium hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Se alle forespørsler
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 