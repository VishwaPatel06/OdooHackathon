// src/types/index.ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee'
}

export enum ExpenseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped'
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseLine {
  id?: string;
  category_id?: string;
  description: string;
  amount: number;
  merchant_name?: string;
}

export interface Expense {
  id: string;
  company_id: string;
  employee_id: string;
  expense_number: string;
  title: string;
  description?: string;
  expense_date: string;
  submitted_currency: string;
  submitted_amount: number;
  company_currency: string;
  company_amount: number;
  exchange_rate: number;
  status: ExpenseStatus;
  receipt_url?: string;
  receipt_filename?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  expense_lines?: ExpenseLine[];
  approvals?: ExpenseApproval[];
}

export interface ExpenseCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  approver_id: string;
  approver_name: string;
  sequence_order: number;
  status: ApprovalStatus;
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface ApprovalRule {
  id: string;
  company_id: string;
  name: string;
  rule_type: 'percentage' | 'specific_approver' | 'hybrid' | 'sequential';
  approval_percentage?: number;
  specific_approver_id?: string;
  requires_manager_approval: boolean;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  company: Company;
}