import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  guestInitialTab: string | null;
  guestInitialSection: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: (initialTab?: string, initialSection?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff' | 'atolye_user', staffRole?: 'cook' | 'cleaning_staff' | 'bus_driver' | 'security_staff' | 'other') => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestInitialTab, setGuestInitialTab] = useState<string | null>(null);
  const [guestInitialSection, setGuestInitialSection] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const fullName =
            userData.user.user_metadata?.full_name ||
            userData.user.user_metadata?.name ||
            userData.user.user_metadata?.display_name ||
            userData.user.email?.split('@')[0] ||
            'Kullanıcı';

          console.log('Creating profile for OAuth user:', {
            userId,
            email: userData.user.email,
            fullName,
            provider: userData.user.app_metadata?.provider,
            metadata: userData.user.user_metadata
          });

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email: userData.user.email,
                full_name: fullName,
                role: 'atolye_user',
                approved: true,
              },
            ]);

          if (insertError) {
            console.error('Profile creation error:', insertError);
            throw insertError;
          }

          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching new profile:', fetchError);
          } else {
            console.log('Successfully created profile:', newProfile);
            setProfile(newProfile);
          }
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('approved, role, staff_role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profileData) {
        await supabase.auth.signOut();
        throw new Error('Profil bulunamadı. Lütfen yönetici ile iletişime geçin.');
      }

      if (!profileData.approved && profileData.role !== 'admin' && profileData.role !== 'atolye_user') {
        await supabase.auth.signOut();
        throw new Error('Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen onay için bekleyin.');
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff' | 'atolye_user', staffRole?: 'cook' | 'cleaning_staff' | 'bus_driver' | 'security_staff' | 'other') => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const approved = role === 'admin' || role === 'atolye_user';
      const profileData: any = {
        id: data.user.id,
        email,
        full_name: fullName,
        approved,
        approved_at: approved ? new Date().toISOString() : null
      };

      if (role === 'staff' && staffRole) {
        profileData.role = null;
        profileData.staff_role = staffRole;
      } else {
        profileData.role = role;
        profileData.staff_role = null;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) throw profileError;
    }
  };

  const signInAsGuest = async (initialTab?: string, initialSection?: string) => {
    await supabase.auth.signOut();
    setIsGuest(true);
    setGuestInitialTab(initialTab || null);
    setGuestInitialSection(initialSection || null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const signOut = async () => {
    if (isGuest) {
      setIsGuest(false);
      setGuestInitialTab(null);
      setGuestInitialSection(null);
      setUser(null);
      setProfile(null);
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isGuest, guestInitialTab, guestInitialSection, signIn, signInAsGuest, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
