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

    // IMPORTANT: do NOT `await` Supabase queries inside this callback. supabase-js
    // holds an internal auth lock while the callback runs; awaiting a DB query
    // (which also needs that lock) here deadlocks every request until it times
    // out — that was the cause of "nothing loads until I refresh". We update the
    // session synchronously and defer the profile fetch to a microtask outside
    // the lock.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const nextUser = newSession?.user ?? null;
      set({
        session: newSession,
        user: nextUser,
        emailConfirmed: Boolean(nextUser?.email_confirmed_at),
        loading: false,
      });
      if (!nextUser) {
        set({ profile: null });
        return;
      }
      setTimeout(() => {
        fetchProfile(nextUser.id).then((nextProfile) => {
          // guard against a race where the user changed while fetching
          if (get().user?.id === nextUser.id) {
            set({ profile: nextProfile });
          }
        });
      }, 0);
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
