import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Home, 
  Receipt, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Eye,
  Check,
  X,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  User,
  Building,
  Menu,
  Search
} from 'lucide-react';

// ============= MOCK DATA & API =============
const mockApi = {
  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      access_token: 'mock-token',
      user: { id: '1', email, full_name: 'John Doe', role: 'admin', company_id: '1', is_active: true },
      company: { id: '1', name: 'Acme Inc', currency_code: 'USD', country: 'USA' }
    };
  },
  signup: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      access_token: 'mock-token',
      user: { id: '1', email: data.email, full_name: data.full_name, role: 'admin', company_id: '1', is_active: true },
      company: { id: '1', name: data.company_name, currency_code: data.currency_code, country: data.country }
    };
  },
  getExpenses: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: '1',
        expense_number: 'EXP-202410-00001',
        title: 'Client Meeting Dinner',
        description: 'Dinner with ABC Corp clients',
        expense_date: '2024-10-01',
        submitted_amount: 150.00,
        submitted_currency: 'USD',
        company_amount: 150.00,
        company_currency: 'USD',
        status: 'pending',
        employee_name: 'John Doe',
        created_at: '2024-10-01T10:00:00Z',
        expense_lines: [
          { id: '1', description: 'Main course', amount: 100, merchant_name: 'Restaurant ABC' },
          { id: '2', description: 'Drinks', amount: 50, merchant_name: 'Restaurant ABC' }
        ]
      },
      {
        id: '2',
        expense_number: 'EXP-202410-00002',
        title: 'Flight to New York',
        description: 'Business trip for client presentation',
        expense_date: '2024-10-03',
        submitted_amount: 450.00,
        submitted_currency: 'USD',
        company_amount: 450.00,
        company_currency: 'USD',
        status: 'approved',
        employee_name: 'John Doe',
        created_at: '2024-10-03T09:00:00Z',
        expense_lines: [
          { id: '3', description: 'Round trip flight', amount: 450, merchant_name: 'Delta Airlines' }
        ]
      },
      {
        id: '3',
        expense_number: 'EXP-202410-00003',
        title: 'Office Supplies',
        description: 'Printer paper and pens',
        expense_date: '2024-09-28',
        submitted_amount: 75.00,
        submitted_currency: 'USD',
        company_amount: 75.00,
        company_currency: 'USD',
        status: 'draft',
        employee_name: 'John Doe',
        created_at: '2024-09-28T14:00:00Z',
        expense_lines: [
          { id: '4', description: 'Paper reams', amount: 50, merchant_name: 'Staples' },
          { id: '5', description: 'Pens (box of 50)', amount: 25, merchant_name: 'Staples' }
        ]
      }
    ];
  },
  getPendingApprovals: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: '4',
        expense_number: 'EXP-202410-00004',
        title: 'Software License',
        description: 'Annual Adobe Creative Cloud subscription',
        expense_date: '2024-10-04',
        submitted_amount: 600.00,
        submitted_currency: 'USD',
        company_amount: 600.00,
        company_currency: 'USD',
        status: 'pending',
        employee_name: 'Jane Smith',
        created_at: '2024-10-04T11:00:00Z',
        expense_lines: [
          { id: '6', description: 'Adobe CC All Apps', amount: 600, merchant_name: 'Adobe' }
        ],
        approvals: [
          { id: '1', approver_name: 'John Doe', status: 'pending', sequence_order: 1 }
        ]
      },
      {
        id: '5',
        expense_number: 'EXP-202410-00005',
        title: 'Marketing Conference',
        description: 'Registration for Digital Marketing Summit',
        expense_date: '2024-10-05',
        submitted_amount: 1200.00,
        submitted_currency: 'USD',
        company_amount: 1200.00,
        company_currency: 'USD',
        status: 'pending',
        employee_name: 'Mike Johnson',
        created_at: '2024-10-05T08:30:00Z',
        expense_lines: [
          { id: '7', description: 'Conference ticket', amount: 1200, merchant_name: 'EventBrite' }
        ],
        approvals: [
          { id: '2', approver_name: 'John Doe', status: 'pending', sequence_order: 1 }
        ]
      }
    ];
  },
  getCategories: async () => [
    { id: '1', name: 'Travel & Transportation' },
    { id: '2', name: 'Meals & Entertainment' },
    { id: '3', name: 'Office Supplies' },
    { id: '4', name: 'Software & Subscriptions' },
    { id: '5', name: 'Training & Education' }
  ],
  getUsers: async () => [
    { id: '1', full_name: 'John Doe', email: 'john@acme.com', role: 'admin', is_active: true },
    { id: '2', full_name: 'Jane Smith', email: 'jane@acme.com', role: 'manager', is_active: true },
    { id: '3', full_name: 'Mike Johnson', email: 'mike@acme.com', role: 'employee', is_active: true }
  ]
};

// ============= AUTH CONTEXT =============
const AuthContext = createContext<any>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedCompany = localStorage.getItem('company');
    if (savedUser && savedCompany) {
      setUser(JSON.parse(savedUser));
      setCompany(JSON.parse(savedCompany));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await mockApi.login(email, password);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const signup = async (signupData: any) => {
    const data = await mockApi.signup(signupData);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ============= UTILITY FUNCTIONS =============
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// ============= UI COMPONENTS =============
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95',
    success: 'bg-green-600 text-white hover:bg-green-700 active:scale-95',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
    ghost: 'text-gray-700 hover:bg-gray-100 active:scale-95'
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const color = getStatusColor(variant);
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
};

const Input = ({ label, error, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const Select = ({ label, error, children, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const Textarea = ({ label, error, ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <textarea
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
        error ? 'border-red-500' : 'border-gray-300'
      }`}
      rows={3}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

// ============= MAIN LAYOUT =============
const Layout = ({ children, currentPage, setCurrentPage }: any) => {
  const { user, company, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', icon: Home, page: 'dashboard' },
    { name: 'My Expenses', icon: Receipt, page: 'expenses' },
    ...(user?.role !== 'employee' ? [{ name: 'Approvals', icon: CheckSquare, page: 'approvals' }] : []),
    ...(user?.role === 'admin' ? [
      { name: 'Users', icon: Users, page: 'users' },
      { name: 'Settings', icon: Settings, page: 'settings' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{company?.name}</h1>
                <p className="text-xs text-gray-500">{company?.currency_code}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.name}
                  onClick={() => setCurrentPage(item.page)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 px-4 py-3 mb-2">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={logout} className="w-full justify-start">
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// ============= PAGE COMPONENTS =============
const LoginPage = ({ onLogin, setShowSignup }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to manage your expenses</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            error={error && !email ? 'Email is required' : ''}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            error={error && !password ? 'Password is required' : ''}
          />
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button onClick={() => setShowSignup(true)} className="text-blue-600 font-medium hover:text-blue-700">
              Sign up
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

const SignupPage = ({ onSignup, setShowSignup }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    country: '',
    currency_code: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.company_name) newErrors.company_name = 'Company name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await onSignup(formData);
      } catch (err) {
        setErrors({ general: 'Signup failed' });
      } finally {
        setLoading(false);
      }
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors((prev: any) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Set up your company expense management</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e: any) => updateField('full_name', e.target.value)}
              error={errors.full_name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@company.com"
              value={formData.email}
              onChange={(e: any) => updateField('email', e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e: any) => updateField('password', e.target.value)}
              error={errors.password}
            />
            <Input
              label="Company Name"
              placeholder="Acme Inc"
              value={formData.company_name}
              onChange={(e: any) => updateField('company_name', e.target.value)}
              error={errors.company_name}
            />
            <Input
              label="Country"
              placeholder="United States"
              value={formData.country}
              onChange={(e: any) => updateField('country', e.target.value)}
              error={errors.country}
            />
            <Select
              label="Currency"
              value={formData.currency_code}
              onChange={(e: any) => updateField('currency_code', e.target.value)}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </Select>
          </div>

          {errors.general && <p className="text-sm text-red-600 mb-4">{errors.general}</p>}
          
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button onClick={() => setShowSignup(false)} className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

const DashboardPage = () => {
  const { user, company } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await mockApi.getExpenses();
      setExpenses(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const stats = [
    {
      title: 'Total Expenses',
      value: expenses.length,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Pending Approval',
      value: expenses.filter(e => e.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    {
      title: 'Approved',
      value: expenses.filter(e => e.status === 'approved').length,
      icon: Check,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(
        expenses.reduce((sum, e) => sum + e.company_amount, 0),
        company?.currency_code
      ),
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.full_name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
          <Button variant="ghost">View All</Button>
        </div>
        <div className="space-y-4">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-medium text-gray-900">{expense.title}</h3>
                  <Badge variant={expense.status}>{expense.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">{expense.expense_number} • {formatDate(expense.expense_date)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(expense.company_amount, expense.company_currency)}</p>
                <p className="text-sm text-gray-600">{expense.employee_name}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ExpensesPage = ({ onNewExpense }: any) => {
  const { company } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadExpenses = async () => {
      const data = await mockApi.getExpenses();
      setExpenses(data);
      setLoading(false);
    };
    loadExpenses();