import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import { Poppins } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'

// Configure Poppins font
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Revlo',
    default: 'Revlo - Få flere kundeanmeldelser',
  },
  description: 'Få flere og bedre kundeanmeldelser helt automatisk med Revlo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" className={poppins.variable}>
      <body className={`${poppins.className} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
} 