'use client';

import { useState } from 'react';

export default function SendRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendReminders = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Feil ved sending av påminnelser');
      }
      
      setResult({
        success: true,
        message: data.message || `${data.sentCount} påminnelser ble sendt`
      });
    } catch (error: any) {
      console.error('Error sending reminders:', error);
      setResult({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">Automatiske påminnelser</h2>
      <p className="text-gray-600 mb-4">
        Send påminnelser til kunder som ikke har klikket på sin vurderingslenke etter 2 dager.
      </p>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={handleSendReminders}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sender påminnelser...
            </>
          ) : (
            'Send påminnelser'
          )}
        </button>
        
        {result && (
          <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
} 