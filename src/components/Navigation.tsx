'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Home,
  Upload,
  BarChart3,
  Calendar,
  Settings,
  Users,
  Video,
  FileVideo,
  TrendingUp,
  Activity,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  createdAt: string;
  lastLogin: string;
}

interface NavigationProps {
  userRole: "coach" | "athlete";
  onLogout: () => void;
  user: User | null;
}

export default function Navigation({ userRole, onLogout, user }: NavigationProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Main dashboard overview'
    },
    {
      name: 'Upload & Analysis',
      href: '/upload-demo',
      icon: Upload,
      description: 'Upload videos and run analysis'
    },
    // Only show Session History to coaches
    ...(userRole === 'coach' ? [{
      name: 'Session History',
      href: '/sessions',
      icon: Calendar,
      description: 'View previous analysis sessions'
    }] : []),
    {
      name: 'API Demo',
      href: '/api-demo',
      icon: BarChart3,
      description: 'Test API endpoints'
    },
    {
      name: userRole === 'coach' ? 'Athlete Management' : 'My Profile',
      href: '/athletes',
      icon: Users,
      description: userRole === 'coach' ? 'Manage athlete profiles' : 'View your profile'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Application settings'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-50">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">MotionLabs AI</h1>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                  {user.institution && (
                    <p className="text-xs text-gray-500 truncate">
                      {user.institution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer group ${
                    active
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${
                    active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${
                      active ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </p>
                    <p className={`text-xs ${
                      active ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onLogout}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
