import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { CustomerProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('mt_customer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.user) {
      await supabase.from('mt_customer_profiles').insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
      });
    }
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isAdmin = profile?.is_admin ?? false;

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
