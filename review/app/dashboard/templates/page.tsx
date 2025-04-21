'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import TemplateForm from './TemplateForm';

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente maler');
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message || 'Feil ved henting av maler');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne malen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke slette malen');
      }
      
      // Oppdater listen etter sletting
      fetchTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      alert(err.message || 'Feil ved sletting av mal');
    }
  };

  const checkAuth = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error checking auth:', err);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const previewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
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
          <h1 className="text-2xl font-bold">E-postmaler</h1>
          <button
            onClick={toggleForm}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {showForm ? 'Skjul skjema' : 'Opprett ny mal'}
          </button>
        </div>
        
        {showForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Opprett ny e-postmal</h2>
            <TemplateForm onSuccess={() => {
              fetchTemplates();
              setShowForm(false);
            }} />
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
        
        {!loading && templates.length === 0 ? (
          <div className="bg-blue-50 p-4 rounded text-blue-800">
            Ingen maler er opprettet ennå. Opprett din første mal ved å klikke på "Opprett ny mal".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Malnavn
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emne
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opprettet
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {template.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(template.created_at), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button
                        onClick={() => previewTemplate(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Forhåndsvis
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        Slett
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                <button
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="border rounded-lg p-4 mb-4">
                <div className="mb-2 text-sm text-gray-500">Emne:</div>
                <div className="text-gray-800 mb-4">{selectedTemplate.subject}</div>
                
                <div className="mb-2 text-sm text-gray-500">Innhold:</div>
                <div className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded">
                  {selectedTemplate.body}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                <div>Variabler i malen vil bli erstattet når e-posten sendes:</div>
                <div className="mt-1">- {'{{name}}'} vil bli erstattet med kundens navn</div>
                <div>- {'{{link}}'} vil bli erstattet med vurderingslenken</div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 