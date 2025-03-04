
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// User types
type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Default admin account
const DEFAULT_ADMIN = {
  id: 'admin-1',
  email: 'admin@pvt.com',
  name: 'Admin',
  role: 'admin' as UserRole,
  password: '12345678',
};

// Constants for Google Sheets API
const SHEET_ID = '1VG9aL5As4Rw_STVqV-se02TJzbILabtEDW1CEJPNEqo';
const API_KEY = 'AIzaSyBX8K1rtDZMIhfn6-QN-Q05A8dYdKPrR8s';
const SHEETS_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1?key=${API_KEY}`;

// Auth context type
interface AuthContextType {
  user: User | null;
  clients: User[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  removeClient: (id: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
  isAuthenticated: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const navigate = useNavigate();
  
  // Get stored data from localStorage or use defaults
  const storedAdmin = JSON.parse(localStorage.getItem('admin') || JSON.stringify(DEFAULT_ADMIN));
  const storedUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  const [user, setUser] = useState<User | null>(storedUser);
  const [admin] = useState<User & { password: string }>(storedAdmin);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!storedUser);
  
  // Save current user to localStorage when they change
  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setIsAuthenticated(!!user);
  }, [user]);
  
  // Login function
  const login = async (email: string, password: string) => {
    // Check if admin
    if (email.toLowerCase() === admin.email.toLowerCase()) {
      // Validate admin password
      if (password === admin.password) {
        const { password: _, ...adminUser } = admin;
        setUser(adminUser);
        return;
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    }
    
    // For clients, check if email exists in Google Sheet
    try {
      const response = await fetch(SHEETS_API_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch client data');
      }
      
      const data = await response.json();
      
      // Find the client in the returned data
      // Skip the header row (index 0) and look for email in column C (index 2)
      const clientRow = data.values && data.values.slice(1).find((row: string[]) => 
        row[2] && row[2].toLowerCase() === email.toLowerCase()
      );
      
      if (!clientRow) {
        throw new Error('Email not found. Please check your email or contact support.');
      }
      
      // Validate client password
      if (password === '12345678') {
        const clientUser: User = {
          id: `client-${Date.now()}`,
          email: clientRow[2] || email, // Email is in column C (index 2)
          name: clientRow[1] || email.split('@')[0], // Client Name is in column B (index 1)
          role: 'client' as UserRole,
        };
        
        setUser(clientUser);
        return;
      } else {
        throw new Error('Incorrect password. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid email. You do not have access to this system.');
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    toast.info('Logged out');
    navigate('/login');
  };
  
  // Remove client function
  const removeClient = (id: string) => {
    toast.error('Client removal is disabled. Clients are managed via Google Sheets.');
  };
  
  // Change password function
  const changePassword = (userId: string, newPassword: string) => {
    if (admin.id === userId) {
      const updatedAdmin = { ...admin, password: newPassword };
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      toast.success('Password changed successfully');
      return;
    }
    
    toast.error('Client password management is disabled. Please use the default password.');
  };
  
  // Get clients from Google Sheets API
  const getClients = async (): Promise<User[]> => {
    try {
      const response = await fetch(SHEETS_API_URL);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      
      // Skip the header row (index 0) and map to client objects
      return data.values && data.values.slice(1).map((row: string[]) => ({
        id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: row[1] || '', // Client Name is in column B (index 1)
        email: row[2] || '', // Client Email is in column C (index 2)
        role: 'client' as UserRole,
      })).filter((client: User) => client.email);
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  };
  
  // Context value
  const contextValue: AuthContextType = {
    user,
    clients: [], // This will be fetched on demand from Google Sheets
    login,
    logout,
    removeClient,
    changePassword,
    isAuthenticated,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
