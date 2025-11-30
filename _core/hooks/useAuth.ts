import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ name?: string } | null>({ name: 'Médico Teste' });

  const logout = () => setUser(null);

  return { user, logout };
}
