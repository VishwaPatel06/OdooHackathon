// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('company');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    country: string;
    currency_code: string;
  }) {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  // Expense endpoints
  async createExpense(data: any) {
    const response = await this.api.post('/expenses/', data);
    return response.data;
  }

  async submitExpense(expenseId: string) {
    const response = await this.api.post(`/expenses/${expenseId}/submit`);
    return response.data;
  }

  async getMyExpenses(status?: string) {
    const params = status ? { status } : {};
    const response = await this.api.get('/expenses/', { params });
    return response.data;
  }

  async getExpense(expenseId: string) {
    const response = await this.api.get(`/expenses/${expenseId}`);
    return response.data;
  }

  async getExpenseCategories() {
    const response = await this.api.get('/expenses/categories/list');
    return response.data;
  }

  // Approval endpoints
  async getPendingApprovals() {
    const response = await this.api.get('/approvals/pending');
    return response.data;
  }

  async processApproval(approvalId: string, action: 'approve' | 'reject', comments?: string) {
    const response = await this.api.post(`/approvals/${approvalId}/action`, {
      action,
      comments,
    });
    return response.data;
  }

  // Admin endpoints
  async getUsers() {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  async createUser(data: any) {
    const response = await this.api.post('/admin/users', data);
    return response.data;
  }

  async updateUser(userId: string, data: any) {
    const response = await this.api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async assignManager(employeeId: string, managerId: string) {
    const response = await this.api.post(`/admin/users/${employeeId}/manager/${managerId}`);
    return response.data;
  }

  async getApprovalRules() {
    const response = await this.api.get('/admin/approval-rules');
    return response.data;
  }

  async createApprovalRule(data: any) {
    const response = await this.api.post('/admin/approval-rules', data);
    return response.data;
  }

  async updateApprovalRule(ruleId: string, data: any) {
    const response = await this.api.put(`/admin/approval-rules/${ruleId}`, data);
    return response.data;
  }
}

export const apiService = new ApiService();


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