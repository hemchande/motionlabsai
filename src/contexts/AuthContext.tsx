'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  userRole: "coach" | "athlete";
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database - in a real app, this would be a backend API
const mockUsers: User[] = [
  {
    id: "1",
    email: "coach@example.com",
    fullName: "Sarah Johnson",
    role: "coach",
    institution: "Elite Gymnastics Academy",
    athleteCount: 15,
    createdAt: "2024-01-15T10:00:00Z",
    lastLogin: new Date().toISOString()
  },
  {
    id: "2",
    email: "athlete@example.com",
    fullName: "Alex Chen",
    role: "athlete",
    createdAt: "2024-01-20T14:30:00Z",
    lastLogin: new Date().toISOString()
  }
];

// Mock passwords - in a real app, these would be hashed
const mockPasswords: Record<string, string> = {
  "coach@example.com": "coach123",
  "athlete@example.com": "athlete123"
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"coach" | "athlete">("coach");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already authenticated (from localStorage or session)
    const savedAuth = localStorage.getItem('motionlabs-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.user && authData.isAuthenticated) {
          setUser(authData.user);
          setUserRole(authData.user.role);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing saved auth:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Check if user exists and password matches
      const user = mockUsers.find(u => u.email === email);
      const storedPassword = mockPasswords[email];
      
      if (!user || storedPassword !== password) {
        setLoading(false);
        return { success: false, error: "Invalid email or password" };
      }
      
      // Update last login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      
      setUser(updatedUser);
      setUserRole(updatedUser.role);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('motionlabs-auth', JSON.stringify({
        isAuthenticated: true,
        user: updatedUser
      }));
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === userData.email);
      if (existingUser) {
        setLoading(false);
        return { success: false, error: "User with this email already exists" };
      }
      
      // Create new user
      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        institution: userData.institution,
        athleteCount: userData.athleteCount,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      // Add to mock database
      mockUsers.push(newUser);
      mockPasswords[userData.email] = userData.password;
      
      setUser(newUser);
      setUserRole(newUser.role);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('motionlabs-auth', JSON.stringify({
        isAuthenticated: true,
        user: newUser
      }));
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Signup failed. Please try again." };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserRole("coach");
    // Clear from localStorage
    localStorage.removeItem('motionlabs-auth');
    // Clear any other user-related data
    localStorage.removeItem('motionlabs-user-preferences');
    localStorage.removeItem('motionlabs-session-data');
  };

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      if (!user) {
        setLoading(false);
        return { success: false, error: "No user logged in" };
      }
      
      // Verify password
      const storedPassword = mockPasswords[user.email];
      if (storedPassword !== password) {
        setLoading(false);
        return { success: false, error: "Incorrect password" };
      }
      
      // Remove user from mock database
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
        delete mockPasswords[user.email];
      }
      
      // Clear all user data
      logout();
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: "Failed to delete account. Please try again." };
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading MotionLabs AI...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      userRole, 
      login, 
      signup, 
      logout, 
      deleteAccount,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




