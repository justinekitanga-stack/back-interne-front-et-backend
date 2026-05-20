// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  Bell,
  UserPlus,
  Settings,
  LogOut,
  UserCog,
  Building2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || 'AGENT';
  const basePath = role === 'ADMIN' ? '/admin' : '/agent';

  const menuItems = [
    {
      title: 'Principal',
      items: [
        {
          href: basePath,
          label: 'Dashboard',
          icon: LayoutDashboard
        },
      ]
    },
    {
      title: 'Clients',
      items: [
        {
          href: `${basePath}/clients`,
          label: 'clients',
          icon: Users
        },
      ]
    },
    {
      title: 'Transactions',
      items: [
        {
          href: `${basePath}/transactions`,
          label: 'Historique',
          icon: ArrowRightLeft
        },
        {
          href: `${basePath}/transactions/depot`,
          label: 'Dépôt',
          icon: TrendingUp
        },
        {
          href: `${basePath}/transactions/retrait`,
          label: 'Retrait',
          icon: TrendingDown
        },
        {
          href: `${basePath}/transactions/transfert`, 
          label: 'Transfert',
          icon: ArrowRightLeft
        },
      ]
    },
    // Menu Admin seulement
    ...(role === 'ADMIN' ? [{
      title: 'Administration',
      items: [
        {
          href: '/admin/employees',
          label: 'Employés',
          icon: UserCog
        },
      ]
    }] : []),
    {
      title: 'Autres',
      items: [
        {
          href: `${basePath}/notifications`,
          label: 'Notifications',
          icon: Bell
        },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-lg font-bold">Banque</h1>
            <p className="text-xs text-gray-400">Interne</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-200
                        ${active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-bold">
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.first_name || user?.username}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.role === 'ADMIN' ? 'Administrateur' : 'Agent'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}