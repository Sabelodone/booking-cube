// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/axiosConfig'; // Import centralized axios

/* ================= TYPES ================= */

interface User {
  id: string;
  email: string;
  full_name: string;
  grade: string;
  phone: string;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  grade: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (userData: SignupData) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
  getAuthHeader: () => { Authorization?: string };
}

interface AuthProviderProps {
  children: ReactNode;
}

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();
  }, []);

  // Fetch user when token changes
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use the centralized axios instance
        const response = await api.get('/auth/me');
        
        const userData = response.data;
        setUser(userData);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching user:', error);
        
        if (error.response?.status === 401) {
          console.log('Token expired or invalid');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        } else {
          setError('Failed to load user profile. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUser();
    }, 100);

    return () => clearTimeout(timer);
  }, [token]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login with:', { email });
      
      // Use the centralized axios instance
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      console.log('Login successful! Token received.');
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      return { 
        success: true,
        user: userData 
      };
    } catch (error: any) {
      console.error('Login error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Login failed. Please check your credentials.';
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting signup with data:', userData);
      
      // Use the centralized axios instance
      const response = await api.post('/auth/signup', userData);
      const { token: newToken, user: newUser } = response.data;

      console.log('Signup successful! Token received.');
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);

      return { 
        success: true,
        user: newUser 
      };
    } catch (error: any) {
      console.error('Signup error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Signup failed. Please try again.';
      
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getAuthHeader = () => {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken) {
      console.warn('No token found in localStorage');
      return {};
    }
    
    return { Authorization: `Bearer ${currentToken}` };
  };

  // Create context value
  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    initialized,
    error,
    login,
    signup,
    logout,
    clearError,
    getAuthHeader
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};