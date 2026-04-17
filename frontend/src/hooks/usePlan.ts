import { useAuth } from '../stores/auth';

export function usePlan() {
  const user = useAuth((s) => s.user) as any;
  const plan = user?.plan;
  const features = plan?.features || {};
  const isAdmin = user?.role === 'ADMIN';
  const isLifetime = !!features.lifetime;

  function hasPage(path: string): boolean {
    if (isAdmin || isLifetime) return true;
    if (Array.isArray(features.pages)) return features.pages.includes(path);
    return false;
  }
  function hasFeature(key: string): boolean {
    if (isAdmin || isLifetime) return true;
    return !!features[key];
  }
  return { plan, features, isAdmin, isLifetime, hasPage, hasFeature };
}
