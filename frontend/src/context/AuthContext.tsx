import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { account, BYPASS_AUTH } from '../lib/appwrite';
import { clearJwt } from '../lib/appwriteJwt';
import { fetchIdentity, type Identity, type Role } from '../services/nplApi';
import { ID, type Models } from 'appwrite';

/**
 * Roles:
 *
 *   ho     - Drona HO. Internal. Sees real carrier names and may upload.
 *   client - NPL and everyone else. Sees pseudonymised carriers.
 *
 * The role here is for RENDERING ONLY. It comes from GET /api/me, which is the
 * server's own answer, and it is never sent back to the server or trusted by
 * it: the backend re-derives the role from the Appwrite JWT on every request
 * and masks carrier names before serialising. Tampering with anything on this
 * side changes which buttons are visible, not which data arrives.
 */

export interface Capabilities {
  seeCarrierNames: boolean;
  upload: boolean;
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  /** Role as reported by the server. Defaults to the masked role. */
  role: Role;
  can: Capabilities;
  /** True when this session's data is pseudonymised. */
  masked: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Least privilege, used until the server says otherwise. */
const CLIENT_IDENTITY: Identity = {
  userId: null,
  email: null,
  role: 'client',
  via: 'api-key',
  masked: true,
  can: { seeCarrierNames: false, upload: false },
};

// Stand-in user used only when VITE_BYPASS_AUTH=true (local development).
const BYPASS_USER = {
  $id: 'dev-bypass-user',
  name: 'Dev User',
  email: 'dev@localhost',
} as Models.User<Models.Preferences>;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    BYPASS_AUTH ? BYPASS_USER : null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [identity, setIdentity] = useState<Identity>(CLIENT_IDENTITY);

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Resolve the role from the server.
   *
   * Runs even under VITE_BYPASS_AUTH: with no session there is no JWT, so the
   * request falls back to the shared key and the backend answers with whatever
   * that resolves to (client, unless DEV_ROLE is set). That keeps the dev UI
   * honest about what the API is actually returning.
   */
  const refreshIdentity = async () => {
    try {
      setIdentity(await fetchIdentity());
    } catch {
      // Unreachable or unauthenticated: assume the masked role rather than
      // guessing upward.
      setIdentity(CLIENT_IDENTITY);
    }
  };

  const bootstrap = async () => {
    try {
      if (!BYPASS_AUTH) {
        setUser(await account.get());
      }
      await refreshIdentity();
    } catch {
      setUser(null);
      setIdentity(CLIENT_IDENTITY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (BYPASS_AUTH) return;
    await account.createEmailPasswordSession(email, password);
    // The previous session's token must not be reused for the new one.
    clearJwt();
    setUser(await account.get());
    await refreshIdentity();
  };

  const signup = async (email: string, password: string, name: string) => {
    if (BYPASS_AUTH) return;
    await account.create(ID.unique(), email, password, name);
    await login(email, password);
  };

  const logout = async () => {
    if (BYPASS_AUTH) return;
    await account.deleteSession('current');
    clearJwt();
    setUser(null);
    setIdentity(CLIENT_IDENTITY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        role: identity.role,
        can: identity.can,
        masked: identity.masked,
        login,
        signup,
        logout,
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
