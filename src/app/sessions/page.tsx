'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LayoutWrapper from '@/components/LayoutWrapper';
import EnhancedSessionDashboard from '@/components/EnhancedSessionDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionsPage() {
  const { userRole, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleNavigateToUpload = () => {
    router.push('/upload-demo');
  };

  useEffect(() => {
    // Redirect non-coaches away from this page
    if (isAuthenticated && userRole !== 'coach') {
      router.push('/');
    }
  }, [userRole, isAuthenticated, router]);

  // Don't render anything if user is not a coach
  if (!isAuthenticated || userRole !== 'coach') {
    return null;
  }

  return (
    <LayoutWrapper>
      <div className="container mx-auto py-8">
        <EnhancedSessionDashboard onNavigateToUpload={handleNavigateToUpload} />
      </div>
    </LayoutWrapper>
  );
}
