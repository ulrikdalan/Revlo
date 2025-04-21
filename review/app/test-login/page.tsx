'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TestLoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Function to handle login
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@revlo.no',
        password: 'testpass123',
      });
      
      console.log('🔐 Login-respons:', data);
      console.log('👤 Bruker-ID:', data?.user?.id);
      
      if (error) {
        throw error;
      }
      
      if (data && data.user) {
        setLoginSuccess(true);
        
        // Verify profile exists
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
            
          console.log('🔍 Profil-data:', profile);
          console.log('⚠️ Profil-feil:', profileError);
          
          if (!profile) {
            console.log('❗Ingen profil funnet - dette opprettes når brukeren når dashboard');
          }
        } catch (profileErr) {
          console.error('Feil ved profilsjekk:', profileErr);
        }
        
        console.log('✅ Aktiv sesjon opprettet. Redirecter...');
        setTimeout(() => {
          router.push('/auth/callback');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  // Automatically attempt login when the page loads
  useEffect(() => {
    handleLogin();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Test Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p>Logging in as test@revlo.no...</p>
              </div>
            ) : loginSuccess ? (
              <div className="text-green-600 py-4">
                <p>Login successful!</p>
                <p className="text-sm">Redirecting to dashboard...</p>
              </div>
            ) : (
              <div className="py-4">
                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}
                <p className="mb-4">Automatic login failed. Try again manually:</p>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login as test@revlo.no'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 