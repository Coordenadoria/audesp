import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('audesp_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem('audesp_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: any) => {
    localStorage.setItem('audesp_session', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('audesp_session');
    setUser(null);
    setIsLoggedIn(false);
  };

  return {
    isLoggedIn,
    user,
    loading,
    login,
    logout
  };
};
