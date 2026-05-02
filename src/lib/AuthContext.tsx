"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigured, GOOGLE_OAUTH_SCOPES } from "@/lib/firebase";

export type AuthMode = "signed-out" | "authenticated" | "demo";

interface AuthShape {
  mode: AuthMode;
  user: User | DemoUser | null;
  /** OAuth access token for Workspace API calls. Null in demo mode. */
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  continueAsDemo: () => void;
  logout: () => Promise<void>;
}

interface DemoUser {
  displayName: string;
  email: string;
  uid: string;
  photoURL: string | null;
  isDemo: true;
}

const DEMO_USER: DemoUser = {
  displayName: "Demo User",
  email: "demo@bubblepop.app",
  uid: "demo-user",
  photoURL: null,
  isDemo: true,
};

const AuthContext = createContext<AuthShape>({
  mode: "signed-out",
  user: null,
  accessToken: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  continueAsDemo: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("signed-out");
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(firebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      // `loading` already initialized to `firebaseConfigured` (false when no auth)
      return;
    }
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setMode("authenticated");
      } else if (mode !== "demo") {
        setUser(null);
        setMode("signed-out");
        setAccessToken(null);
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      setError(
        "Google sign-in is not configured. Set the NEXT_PUBLIC_FIREBASE_* env vars or continue as demo.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      for (const scope of GOOGLE_OAUTH_SCOPES) provider.addScope(scope);
      provider.setCustomParameters({ prompt: "consent" });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setAccessToken(credential?.accessToken ?? null);
      setUser(result.user);
      setMode("authenticated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "sign-in failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const continueAsDemo = useCallback(() => {
    setUser(DEMO_USER);
    setMode("demo");
    setAccessToken(null);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    if (auth && mode === "authenticated") {
      try {
        await signOut(auth);
      } catch (err) {
        const message = err instanceof Error ? err.message : "sign-out failed";
        setError(message);
      }
    }
    setUser(null);
    setMode("signed-out");
    setAccessToken(null);
  }, [mode]);

  const value = useMemo<AuthShape>(
    () => ({
      mode,
      user,
      accessToken,
      loading,
      error,
      signInWithGoogle,
      continueAsDemo,
      logout,
    }),
    [
      mode,
      user,
      accessToken,
      loading,
      error,
      signInWithGoogle,
      continueAsDemo,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
