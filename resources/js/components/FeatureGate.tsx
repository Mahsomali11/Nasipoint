import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { router, usePage, Link } from '@inertiajs/react';
import { Lock, ArrowUpCircle } from 'lucide-react';
import type { FeatureKey } from '@/lib/features';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

export default function FeatureGate({ feature, children }: FeatureGateProps) {
  const { hasFeature } = useFeatureAccess();
  const navigate = (url, options) => router.visit(url, options);

  if (hasFeature(feature)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <Lock size={36} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Feature Locked</h2>
      <p className="text-muted-foreground max-w-sm mb-6">
        This feature is not included in your current plan. Please upgrade your subscription to access it.
      </p>
      <button
        onClick={() => navigate('/upgrade')}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        <ArrowUpCircle size={20} />
        Upgrade Plan
      </button>
    </div>
  );
}
