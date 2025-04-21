'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminNavigation from '../../AdminNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

export default function PlatformsDocumentationPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <AdminNavigation />
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Review Platforms Documentation</h1>
            <Link 
              href="/dashboard/admin/external-platforms" 
              className="text-blue-600 hover:underline"
            >
              ← Back to Platforms
            </Link>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p>
                  The platforms feature allows you to define and manage all external review platforms that your system integrates with.
                  This includes customizing their display appearance in the user interface.
                </p>
                <p>
                  Each platform record includes:
                </p>
                <ul>
                  <li><strong>name</strong>: A unique identifier for the platform (lowercase, e.g., "google")</li>
                  <li><strong>display_name</strong>: The human-readable name shown in the UI</li>
                  <li><strong>icon</strong>: A text abbreviation used in avatars (1-2 characters)</li>
                  <li><strong>color</strong>: A hex color code for platform branding</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Technical Implementation</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>Database</h3>
                <p>
                  The platforms are stored in the <code>platforms</code> table in Supabase with the following schema:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
                </pre>
                
                <h3>Integration</h3>
                <p>
                  The platforms table is used in:
                </p>
                <ul>
                  <li>External reviews dashboard to display platform-specific styling</li>
                  <li>Admin dashboard for platform management</li>
                  <li>Recent reviews component on the main dashboard</li>
                </ul>
                
                <h3>Migration</h3>
                <p>
                  To set up the platforms table, visit <Link href="/api/platform-migration" className="text-blue-600 hover:underline" target="_blank">/api/platform-migration</Link>.
                  This endpoint will:
                </p>
                <ul>
                  <li>Create the platforms table if it doesn't exist</li>
                  <li>Insert default platform records for Google, Trustpilot, Facebook, and Yelp</li>
                </ul>
                <p className="text-sm text-gray-500">Note: Only administrators can run this migration.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Examples</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>Adding a new platform</h3>
                <p>
                  To add a new platform (e.g., Tripadvisor):
                </p>
                <ol>
                  <li>Go to the <Link href="/dashboard/admin/external-platforms" className="text-blue-600 hover:underline">Platforms Admin page</Link></li>
                  <li>Fill in the form with:
                    <ul>
                      <li>Platform Code: <code>tripadvisor</code></li>
                      <li>Display Name: <code>Tripadvisor</code></li>
                      <li>Icon: <code>TA</code></li>
                      <li>Color: <code>#34E0A1</code></li>
                    </ul>
                  </li>
                  <li>Click "Add Platform"</li>
                </ol>
                
                <h3>Using platform info in code</h3>
                <p>
                  The platform information can be used in your components like this:
                </p>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// Fetch platforms from Supabase
const { data: platforms } = await supabase.from('platforms').select('*');

// Find a specific platform's info
const platform = platforms.find(p => p.name === 'google');

// Use the platform info in UI
<Avatar style={{ backgroundColor: platform.color }}>
  <AvatarFallback>{platform.icon}</AvatarFallback>
</Avatar>`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 