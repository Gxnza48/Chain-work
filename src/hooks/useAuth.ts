import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const emailConfirmed = useAuthStore((s) => s.emailConfirmed);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  return { user, session, profile, loading, emailConfirmed, signOut, refreshProfile };
}
