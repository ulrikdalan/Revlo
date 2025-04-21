'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Hent e-post fra sesjon eller URL parameter dersom tilgjengelig
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verifiser e-postadressen din
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vi har sendt deg en e-post med en bekreftelseslenke.
          </p>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Sjekk innboksen din
              </h3>
              {email && (
                <p className="mt-2 text-sm text-gray-500">
                  Vi har sendt en bekreftelseslenke til <span className="font-medium">{email}</span>.
                </p>
              )}
              {!email && (
                <p className="mt-2 text-sm text-gray-500">
                  Vi har sendt en bekreftelseslenke til e-postadressen din.
                </p>
              )}
              <p className="mt-3 text-sm text-gray-500">
                Vennligst klikk på lenken i e-posten for å bekrefte kontoen din. 
                Hvis du ikke har mottatt e-posten, sjekk spam-mappen din.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Link 
            href="/login" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Tilbake til innlogging
          </Link>
          <button
            onClick={() => router.push('/register')}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Prøv igjen med en annen e-post
          </button>
        </div>
      </div>
    </div>
  )
} 