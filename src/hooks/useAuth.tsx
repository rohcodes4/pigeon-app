import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: () => void;
  signUp: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setSession({
          user: userData,
          expires_at: null,
          expires_in: null,
          token: token,
        });
      } else {
        // If token is invalid or unauthorized, clear it
        localStorage.removeItem("access_token");
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      localStorage.removeItem("access_token"); // Clear token on network/other error
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const signOut = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, { method: "POST" });
      localStorage.removeItem("access_token"); // Clear token from localStorage
      setUser(null);
      setSession(null);
      window.location.href = "/auth";
    } catch (error) {
      console.error("Failed to sign out:", error);
      localStorage.removeItem("access_token"); // Ensure token is cleared even if backend logout fails
      setUser(null);
      setSession(null);
      window.location.href = "/auth";
    }
  };

  const signIn = () => {
    window.location.href = "/auth?mode=signin";
  };

  const signUp = () => {
    window.location.href = "/auth?mode=signup";
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signIn,
    signUp,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
