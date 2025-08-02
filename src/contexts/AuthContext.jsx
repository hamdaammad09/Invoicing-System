import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token with backend
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const userData = response.data.user;
            setUser(userData);
            setSellerId(userData.sellerId);
            setUserRole(userData.role);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with credentials:', credentials);
      
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set user data
        setUser(userData);
        setSellerId(userData.sellerId);
        setUserRole(userData.role);
        
        console.log('✅ Login successful:', userData);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSellerId(null);
    setUserRole(null);
    console.log('👋 User logged out');
  };

  // Helper functions for role checking
  const isSeller = () => userRole === 'seller';
  const isAdmin = () => userRole === 'admin';
  const isBuyer = () => userRole === 'buyer';
  
  const getSellerContext = () => ({
    sellerId,
    userRole,
    isSeller: isSeller(),
    isAdmin: isAdmin(),
    isBuyer: isBuyer()
  });

  const value = {
    user,
    sellerId,
    userRole,
    loading,
    login,
    logout,
    isSeller,
    isAdmin,
    isBuyer,
    getSellerContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 