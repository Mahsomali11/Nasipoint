import React, { useEffect, useState } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useApp } from '@/context/AppContext';
import { router } from '@inertiajs/react';
import type { FeatureKey } from '@/lib/features';

interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

export default function FeatureGuard({ feature, children }: FeatureGuardProps) {
  const { hasFeature } = useFeatureAccess();
  const { loading, licenseStatus } = useApp();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until app context is fully loaded
    if (loading) return;
    
    // Check access
    if (!hasFeature(feature)) {
       // If no access, redirect to upgrade
       router.visit('/upgrade');
    } else {
       setIsReady(true);
    }
  }, [loading, licenseStatus, feature, hasFeature]);

  if (!isReady) {
    // Return empty placeholder while checking or redirecting
    return <div className="min-h-screen bg-[#F8F9FA] dark:bg-background" />;
  }

  return <>{children}</>;
}
