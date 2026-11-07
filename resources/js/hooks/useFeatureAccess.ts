import { useApp } from '@/context/AppContext';
import type { FeatureKey } from '@/lib/features';

export function useFeatureAccess() {
  const { storeFeatures, isLicenseActive, licenseStatus } = useApp();

  const hasFeature = (key: FeatureKey): boolean => {
    // Note: License active status is now handled separately by isLicenseActive flag.
    // hasFeature checks if a feature is included in the plan.
    // If we have no license or an active license with an unconfigured/empty feature map, allow all features.
    if (!licenseStatus || licenseStatus.status === 'none' || licenseStatus.plan_name === 'None') {
       if (!storeFeatures || Object.keys(storeFeatures).length === 0) return true;
    }

    if (!storeFeatures || Object.keys(storeFeatures).length === 0) {
      return isLicenseActive;
    }
    
    return storeFeatures?.[key] === true;
  };

  return { hasFeature, storeFeatures };
}
