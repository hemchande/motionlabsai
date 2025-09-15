'use client';

import Navigation from './Navigation';
import AuthScreen from './AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import GlobalProcessingIndicator from './GlobalProcessingIndicator';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { isAuthenticated, userRole, logout, user } = useAuth();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Navigation userRole={userRole} onLogout={logout} user={user} />
      <div className="flex-1 ml-64">
        {children}
      </div>
      <GlobalProcessingIndicator />
    </div>
  );
}
