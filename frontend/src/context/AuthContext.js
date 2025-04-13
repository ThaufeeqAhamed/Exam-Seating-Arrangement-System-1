import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, logoutUser, getUserProfile } from '../services/api';

// Create context
const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // On mount, check if user is logged in
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (storedUser && token) {
        try {
          // Parse the stored user
          const parsedUser = JSON.parse(storedUser);
          // Set the user from localStorage initially
          setUser(parsedUser);
          
          // Then verify token is still valid by getting user profile
          const response = await getUserProfile();
          // Update with latest user data from server
          setUser(response.data);
          console.log('User authenticated successfully:', response.data);
        } catch (error) {
          // If token is invalid, clear localStorage
          console.error('Session expired or invalid', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      
      setLoading(false);
      setInitialized(true);
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await loginUser(email, password);
      setUser(data.user);
      setLoading(false);
      return data;
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.user_type === 'admin';
  };

  // Check if user is faculty
  const isFaculty = () => {
    return user && user.user_type === 'faculty';
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    initialized,
    login,
    logout,
    isAdmin,
    isFaculty
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 