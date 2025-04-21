'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SentReviewForm from './SentReviewForm'

type SentEmail = {
  id: string
  name: string
  email: string
  review_link: string
  status: string
  sent_at: string
  reminder_sent_at?: string | null
  clicked_at?: string | null
  user_id: string
}

// Hjelpefunksjon for å formatere dato
function formatDate(dateString?: string | null) {
  if (!dateString) return '';
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
}

export default function SentReviewsPage() {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient();
      
      // Sjekk om brukeren er logget inn
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      
      // Hent sendte e-poster via fetch API
      const response = await fetch('/api/get-sent-emails', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente e-poster');
      }
      
      const data = await response.json();
      setSentEmails(data.emails || []);
    } catch (err: any) {
      console.error('Error fetching sent emails:', err);
      setError(err.message || 'Feil ved henting av e-poster');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEmails();
  }, []);
  
  const handleRefresh = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails();
  };
  
  const toggleForm = () => {
    setShowForm(!showForm);
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded shadow p-6">
          <div className="bg-red-100 p-4 rounded mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Ikke innlogget</h2>
            <p className="mb-4">Du må være logget inn for å se denne siden.</p>
            <Link href="/login" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              Gå til innloggingssiden
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sendte vurderingsforespørsler</h1>
          <div className="flex space-x-3">
            <button
              onClick={toggleForm}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              {showForm ? 'Skjul skjema' : 'Ny forespørsel'}
            </button>
            <form onSubmit={handleRefresh}>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Oppdater
              </button>
            </form>
          </div>
        </div>
        
        {showForm && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Send ny vurderingsforespørsel</h2>
            <SentReviewForm />
          </div>
        )}
        
        {loading && (
          <div className="bg-gray-100 p-4 rounded text-gray-700 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Laster inn...
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            Feil ved henting av data: {error}
          </div>
        )}
        
        {!loading && sentEmails.length === 0 ? (
          <div className="bg-blue-50 p-4 rounded text-blue-800">
            Ingen e-poster er sendt ennå.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Påminnelse sendt
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klikket
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sentEmails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {email.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.status === "SENT" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(email.sent_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {email.reminder_sent_at ? (
                        <span className="flex items-center">
                          <span className="mr-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                          {formatDate(email.reminder_sent_at)}
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-2 w-2 h-2 bg-gray-300 rounded-full"></span>
                          Ikke sendt
                        </span>
                      )}
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
                          Ikke klikket
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                      <a 
                        href={email.review_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Åpne
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 