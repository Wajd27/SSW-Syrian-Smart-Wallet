import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/shared/api/auth';
import { User, FamilyMember } from '@/shared/types/entities';

export type SelectedFamilyMember = FamilyMember | 'owner' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  selectedFamilyMember: SelectedFamilyMember;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  setSelectedFamilyMember: (member: FamilyMember | 'owner', remember?: boolean) => void;
  switchFamilyMember: (member: FamilyMember | 'owner') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFamilyMember, setSelectedFamilyMemberState] = useState<SelectedFamilyMember>(null);
  const navigate = useNavigate();

  // Load selected family member from localStorage on mount
  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`selected_family_member:${user.email}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed === 'owner') {
            setSelectedFamilyMemberState('owner');
          } else if (parsed && parsed.id) {
            // We'll need to fetch the full member data if needed
            setSelectedFamilyMemberState(parsed);
          }
        } catch (e) {
          console.error('Error loading saved family member:', e);
        }
      }
    }
  }, [user?.email]);

  useEffect(() => {
    // Use a flag to prevent hydration issues
    let mounted = true;
    
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const currentUser = await authApi.getCurrentUser();
            if (mounted) {
              setUser(currentUser);
            }
          } catch (error) {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            if (mounted) {
              setUser(null);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    // Update user state first
    setUser(response.user);
    
    // Check if family members exist and if we should show selector
    try {
      const { entities } = await import('@/shared/api/entities');
      const familyMembers = await entities.familyMember.filter({ added_by: response.user.email, is_active: true });
      const savedSelection = localStorage.getItem(`selected_family_member:${response.user.email}`);
      
      // If family members exist and no saved selection, navigate to selector
      if (familyMembers.length > 0 && !savedSelection) {
        Promise.resolve().then(() => {
          navigate('/select-family-member', { replace: true });
        });
      } else {
        // Load saved selection or default to owner
        if (savedSelection) {
          try {
            const parsed = JSON.parse(savedSelection);
            if (parsed === 'owner') {
              setSelectedFamilyMemberState('owner');
            } else if (parsed && parsed.id) {
              setSelectedFamilyMemberState(parsed);
            }
          } catch (e) {
            // Invalid saved data, default to owner
            setSelectedFamilyMemberState('owner');
          }
        } else {
          setSelectedFamilyMemberState('owner');
        }
        
        Promise.resolve().then(() => {
          navigate('/', { replace: true });
        });
      }
    } catch (error) {
      // If error fetching family members, just navigate to dashboard
      setSelectedFamilyMemberState('owner');
      Promise.resolve().then(() => {
        navigate('/', { replace: true });
      });
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    const response = await authApi.register({ email, password, full_name: fullName });
    // Update user state first
    setUser(response.user);
    // Defer navigation to next event loop tick to avoid React error #426
    // This ensures state update completes before navigation triggers re-render
    Promise.resolve().then(() => {
      navigate('/', { replace: true });
    });
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setSelectedFamilyMemberState(null);
    if (user?.email) {
      // Optionally clear saved selection on logout
      // localStorage.removeItem(`selected_family_member:${user.email}`);
    }
    navigate('/login');
  };

  const updateUser = async (data: Partial<User>) => {
    const updatedUser = await authApi.updateUser(data);
    setUser(updatedUser);
  };

  const setSelectedFamilyMember = (member: FamilyMember | 'owner', remember: boolean = false) => {
    setSelectedFamilyMemberState(member);
    
    if (user?.email) {
      if (remember) {
        const toSave = member === 'owner' ? 'owner' : member;
        localStorage.setItem(`selected_family_member:${user.email}`, JSON.stringify(toSave));
      } else {
        // Don't persist if not remembering
        localStorage.removeItem(`selected_family_member:${user.email}`);
      }
    }
  };

  const switchFamilyMember = (member: FamilyMember | 'owner') => {
    setSelectedFamilyMember(member, false); // Don't auto-remember when switching
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      selectedFamilyMember,
      login, 
      register, 
      logout, 
      updateUser,
      setSelectedFamilyMember,
      switchFamilyMember
    }}>
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

