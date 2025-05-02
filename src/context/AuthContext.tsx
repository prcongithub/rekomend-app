import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/apiService';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  phoneNumber: string | null;
  isLoading: boolean;
  login: (token: string, phone: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth data on component mount
  useEffect(() => {
    const loadStoredAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedPhone = await AsyncStorage.getItem('phoneNumber');
        
        if (storedToken && storedPhone) {
          setToken(storedToken);
          setPhoneNumber(storedPhone);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load authentication data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuthData();
  }, []);

  const login = async (newToken: string, phone: string) => {
    try {
      // Save to state
      setToken(newToken);
      setPhoneNumber(phone);
      setIsAuthenticated(true);
      
      // Persist to storage
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('phoneNumber', phone);
      
      // Log token being saved (for debugging)
      console.log('Authentication token saved:', newToken);
    } catch (error) {
      console.error('Failed to save authentication data', error);
    }
  };

  const logout = async () => {
    try {
      // Clear from state
      setToken(null);
      setPhoneNumber(null);
      setIsAuthenticated(false);
      
      // Clear from storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('phoneNumber');
      
      // Call logout API if needed
      await authService.logout();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const value = {
    isAuthenticated,
    token,
    phoneNumber,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};