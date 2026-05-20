// src/components/layout/Header.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Bonjour, {user?.first_name || user?.username}
          </h2>
          <p className="text-sm text-gray-500">
            {user?.role === 'ADMIN' ? 'Administrateur' : 'Agent'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href={`/${user?.role === 'ADMIN' ? 'admin' : 'agent'}/notifications`}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>
        </div>
      </div>
    </header>
  );
}