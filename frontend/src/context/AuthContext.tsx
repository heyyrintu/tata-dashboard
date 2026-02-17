import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account, teams, ADMIN_TEAM_ID } from '../lib/appwrite';
import { ID, type Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkAdminStatus = async (currentUserId?: string) => {
    try {
      if (!ADMIN_TEAM_ID) {
        setIsAdmin(false);
        return;
      }
      const membership = await teams.listMemberships(ADMIN_TEAM_ID);
      // Verify the CURRENT user is in the admin team, not just that members exist
      const userId = currentUserId || user?.$id;
      const isInAdminTeam = membership.memberships.some(
        (m) => m.userId === userId
      );
      setIsAdmin(isInAdminTeam);
    } catch {
      setIsAdmin(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await checkAdminStatus(currentUser.$id);
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);
    await checkAdminStatus();
  };

  const signup = async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email, password, name);
    await login(email, password);
  };

  const logout = async () => {
    await account.deleteSession('current');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, signup, logout }}>
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
