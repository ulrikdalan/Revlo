'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AdminNavigation() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Admin Dashboard', href: '/dashboard/admin' },
    { name: 'Eksterne anmeldelser', href: '/dashboard/admin/reviews' },
    { name: 'Review Platforms', href: '/dashboard/admin/external-platforms' }
  ];
  
  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <div className="mb-4">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Tilbake til dashboard
        </Link>
      </div>
      
      <div className="flex space-x-4 border-b border-gray-200">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              pathname === item.href
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
} 