'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminNavigation from '../AdminNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

type Platform = {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
  created_at: string;
};

export default function ExternalPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    name: '',
    display_name: '',
    icon: '',
    color: '#3b82f6', // Default blue color
  });
  const [addingPlatform, setAddingPlatform] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return false;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        return data?.is_admin || false;
      } catch (err) {
        console.error('Error checking admin status:', err);
        return false;
      }
    }
    
    async function loadData() {
      setLoading(true);
      
      try {
        const isUserAdmin = await checkAdminStatus();
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          setError('You do not have permission to access this page');
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('platforms')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setPlatforms(data || []);
      } catch (err: any) {
        console.error('Error loading platforms:', err);
        setError(err.message || 'An error occurred while loading platforms');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [supabase]);
  
  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPlatform(true);
    
    try {
      const { data, error } = await supabase
        .from('platforms')
        .insert({
          name: newPlatform.name.toLowerCase(),
          display_name: newPlatform.display_name,
          icon: newPlatform.icon,
          color: newPlatform.color,
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      setPlatforms([...platforms, data[0]]);
      setNewPlatform({
        name: '',
        display_name: '',
        icon: '',
        color: '#3b82f6',
      });
    } catch (err: any) {
      console.error('Error adding platform:', err);
      setError(err.message || 'An error occurred while adding the platform');
    } finally {
      setAddingPlatform(false);
    }
  };
  
  const handleDeletePlatform = async (id: string) => {
    if (!confirm('Are you sure you want to delete this platform?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setPlatforms(platforms.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting platform:', err);
      setError(err.message || 'An error occurred while deleting the platform');
    }
  };
  
  if (!isAdmin && !loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              You do not have permission to access this page
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <AdminNavigation />
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage External Review Platforms</h1>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/admin/external-platforms/docs"
                className="text-blue-600 hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Documentation
              </Link>
              <Link
                href="/api/platform-migration"
                target="_blank"
                className="text-green-600 hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Run Migration
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Platforms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {platforms.length === 0 ? (
                      <p className="text-gray-500">No platforms defined yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Display Name</th>
                              <th className="px-4 py-2 text-left">Color</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {platforms.map(platform => (
                              <tr key={platform.id} className="border-b">
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm"
                                      style={{ backgroundColor: platform.color || '#e5e7eb', color: 'white' }}
                                    >
                                      {platform.icon || platform.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    {platform.name}
                                  </div>
                                </td>
                                <td className="px-4 py-2">{platform.display_name}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 rounded mr-2"
                                      style={{ backgroundColor: platform.color || '#e5e7eb' }}
                                    ></div>
                                    {platform.color || 'Not set'}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <Button 
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeletePlatform(platform.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Add Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddPlatform} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Platform Code</Label>
                        <Input
                          id="name"
                          value={newPlatform.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setNewPlatform({...newPlatform, name: e.target.value})}
                          placeholder="google"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Lowercase, no spaces (e.g., google, trustpilot)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={newPlatform.display_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setNewPlatform({...newPlatform, display_name: e.target.value})}
                          placeholder="Google"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="icon">Icon (optional)</Label>
                        <Input
                          id="icon"
                          value={newPlatform.icon}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            setNewPlatform({...newPlatform, icon: e.target.value})}
                          placeholder="G"
                        />
                        <p className="text-xs text-gray-500">
                          Short text (1-2 characters) for icon display
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="color"
                            type="color"
                            value={newPlatform.color}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setNewPlatform({...newPlatform, color: e.target.value})}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={newPlatform.color}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setNewPlatform({...newPlatform, color: e.target.value})}
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={addingPlatform}
                      >
                        {addingPlatform ? 'Adding...' : 'Add Platform'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 