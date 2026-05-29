import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRow } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserRow | null;
  loading: boolean;
  emailConfirmed: boolean;

  initialize: () => Promise<() => void>;
  setSession: (s: Session | null) => void;
  setProfile: (p: UserRow | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[auth] profile load failed', error.message);
    return null;
  }
  return data ?? null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  emailConfirmed: false,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    const user = session?.user ?? null;
    const profile = user ? await fetchProfile(user.id) : null;
    set({
      session,
      user,
      profile,
      emailConfirmed: Boolean(user?.email_confirmed_at),
      loading: false,
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const nextUser = newSession?.user ?? null;
      const nextProfile = nextUser ? await fetchProfile(nextUser.id) : null;
      set({
        session: newSession,
        user: nextUser,
        profile: nextProfile,
        emailConfirmed: Boolean(nextUser?.email_confirmed_at),
        loading: false,
      });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  },

  setSession: (s) => set({ session: s, user: s?.user ?? null, emailConfirmed: Boolean(s?.user?.email_confirmed_at) }),
  setProfile: (p) => set({ profile: p }),

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const profile = await fetchProfile(user.id);
    set({ profile });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, emailConfirmed: false });
  },
}));
