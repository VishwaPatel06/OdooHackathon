// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User, Company, AuthResponse } from '@/types';
import { apiService } from '@/services/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('company');

    if (token && savedUser && savedCompany) {
      setUser(JSON.parse(savedUser));
      setCompany(JSON.parse(savedCompany));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data: AuthResponse = await apiService.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const signup = async (signupData: any) => {
    const data: AuthResponse = await apiService.signup(signupData);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    setUser(null);
    setCompany(null);
  };

  return {
    user,
    company,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };
};


// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// src/utils/format.ts
import { format } from 'date-fns';

export const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy') => {
  return format(new Date(dateString), formatStr);
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    skipped: 'bg-blue-100 text-blue-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};