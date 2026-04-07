import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || `/${user.role}`;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card with Glass Effect */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-fade-in">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/40 animate-bounce-in relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <GraduationCap className="text-white relative z-10" size={40} />
                <Sparkles className="absolute -top-1 -right-1 text-yellow-300 w-5 h-5 animate-pulse-slow" />
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur-xl opacity-30 animate-pulse-slow"></div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Leave<span className="text-gradient bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Flow</span>
            </h1>
            <p className="text-slate-300 text-sm">Smart Leave Management System</p>
          </div>

          {/* Error Message with Animation */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl backdrop-blur-sm animate-fade-in">
              <p className="text-rose-200 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <label className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                focusedField === 'email' || email ? '-top-2 text-xs text-indigo-400' : 'top-3.5 text-sm text-slate-400'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-3.5 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'email' ? 'text-indigo-400' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-indigo-400/50 focus:bg-white/10 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative group">
              <label className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                focusedField === 'password' || password ? '-top-2 text-xs text-indigo-400' : 'top-3.5 text-sm text-slate-400'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-3.5 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'password' ? 'text-indigo-400' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-transparent focus:outline-none focus:border-indigo-400/50 focus:bg-white/10 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="mt-8 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <p className="text-sm text-white text-center mb-4 font-semibold uppercase tracking-wider">Demo Accounts - Click to Auto-fill</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { role: 'Student', email: 'student.cse1@college.edu', color: 'from-emerald-400 to-teal-400' },
                { role: 'Staff', email: 'staff.cse1@college.edu', color: 'from-blue-400 to-cyan-400' },
                { role: 'HOD', email: 'hod.cse@college.edu', color: 'from-violet-400 to-purple-400' },
                { role: 'Principal', email: 'principal@college.edu', color: 'from-amber-400 to-orange-400' },
              ].map((account, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl bg-gradient-to-br ${account.color} text-white shadow-lg cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300`}
                  onClick={() => { setEmail(account.email); setPassword('password123'); }}
                >
                  <p className="font-bold text-sm">{account.role}</p>
                  <p className="text-white/90 text-[11px] mt-1 truncate">{account.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2024 LeaveFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
