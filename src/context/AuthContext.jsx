import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("before");
        // Hit an endpoint that returns the current user profile based on cookies
        const response = await API.get('/auth/me');
        console.log("success")
        console.log(response)
        setUser(response.data);
      } catch (error) {
        console.log("error",error)
        setUser(null);
      } finally {
        console.log("finally")
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);