'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StarIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

type GoogleReview = {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
}

type BusinessInfo = {
  name: string
  place_id: string
}

export default function GoogleReviewsPage() {
  const [reviews, setReviews] = useState<GoogleReview[]>([])
  const [business, setBusiness] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    async function checkGoogleConnection() {
      try {
        const statusRes = await fetch('/api/oauth/google/status')
        
        if (!statusRes.ok) {
          if (statusRes.status === 400) {
            setConnectionStatus('disconnected')
          } else {
            throw new Error('Kunne ikke sjekke Google-tilkobling')
          }
          return false
        }
        
        const statusData = await statusRes.json()
        if (statusData.connected) {
          setConnectionStatus('connected')
          return true
        } else {
          setConnectionStatus('disconnected')
          return false
        }
      } catch (err) {
        console.error('Error checking Google connection:', err)
        setError('Kunne ikke sjekke Google-tilkobling')
        setConnectionStatus('disconnected')
        return false
      }
    }

    async function fetchGoogleReviews() {
      try {
        const res = await fetch('/api/reviews/google')
        
        if (!res.ok) {
          if (res.status === 400 || res.status === 401) {
            setConnectionStatus('disconnected')
            const data = await res.json()
            setError(data.error || 'Ikke tilkoblet Google')
          } else {
            throw new Error('Kunne ikke hente anmeldelser')
          }
          return
        }
        
        const data = await res.json()
        setReviews(data.reviews)
        setBusiness(data.business)
        setConnectionStatus('connected')
      } catch (err) {
        console.error('Error fetching Google reviews:', err)
        setError('Kunne ikke hente anmeldelser fra Google')
      } finally {
        setLoading(false)
      }
    }

    const checkAndFetch = async () => {
      const isConnected = await checkGoogleConnection()
      if (isConnected) {
        await fetchGoogleReviews()
      } else {
        setLoading(false)
      }
    }

    checkAndFetch()
  }, [])

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Google-anmeldelser</h1>
      
      {connectionStatus === 'disconnected' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Koble til Google</h2>
              <p>Koble til din Google My Business konto for å vise anmeldelser</p>
              <Button asChild>
                <Link href="/dashboard/settings">Koble til Google</Link>
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      
      {connectionStatus === 'connected' && (
        <>
          {business && (
            <Card>
              <CardHeader>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>
                  <Link 
                    href={`https://search.google.com/local/reviews?placeid=${business.place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Se alle anmeldelser på Google
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          
          {loading ? (
            <p>Laster anmeldelser...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : reviews.length === 0 ? (
            <p>Ingen anmeldelser funnet</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map(review => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarFallback>{review.reviewer_name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{review.reviewer_name}</h3>
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(review.created_at), 'PPP', { locale: nb })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
} 