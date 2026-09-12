import { useCallback, useState } from 'react';
import { getSession, logout as clearSession, type Session } from '../lib/auth';

export function useSession() {
  const [session, setSession] = useState<Session | null>(getSession);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const refresh = useCallback(() => setSession(getSession()), []);

  return { session, signOut, refresh };
}
