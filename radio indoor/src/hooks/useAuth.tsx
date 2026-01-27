import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, AppRole, AccountStatus } from '@/lib/supabase-types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  accountStatus: AccountStatus;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  isSuspended: boolean;
  assignedStores: string[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active');
  const [assignedStores, setAssignedStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isOperator = role === 'operator';
  const isSuspended = accountStatus === 'suspended';

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile and role fetch
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setAccountStatus('active');
          setAssignedStores([]);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
        setAccountStatus((profileData.account_status as AccountStatus) || 'active');
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleData) {
        setRole(roleData.role as AppRole);
      }
// ✅ Temporário: sem restrição de lojas ainda
setAssignedStores([]);
      // Fetch assigned stores for managers/operators
     // const { data: storeAssignments } = await supabase
     //   .from('user_store_assignments')
      //  .select('store_id')
      //  .eq('user_id', userId);

     // if (storeAssignments) {
     //   setAssignedStores(storeAssignments.map(sa => sa.store_id));
     // }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) return { error };

      // Create profile and assign admin role for first user
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          full_name: fullName,
          account_status: 'active',
        });

        // Assign admin role
        await supabase.from('user_roles').insert({
  user_id: data.user.id,
  role: 'operator',
});

      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setAccountStatus('active');
    setAssignedStores([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        accountStatus,
        loading,
        isAdmin,
        isManager,
        isOperator,
        isSuspended,
        assignedStores,
        signIn,
        signUp,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
