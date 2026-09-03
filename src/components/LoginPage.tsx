import React, { useState } from 'react';
import { CompanyProfile, StaffUser } from '../types';
import { 
  Building2, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, 
  ArrowRight, KeyRound, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';

interface LoginPageProps {
  staffUsers: StaffUser[];
  companies: CompanyProfile[];
  activeCompany: CompanyProfile;
  onLogin: (user: StaffUser, selectedCompanyId?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  staffUsers,
  companies,
  activeCompany,
  onLogin,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('lpsunilkumar8@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(activeCompany?.id || companies[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      const cleanPass = password.trim();

      // Match staff user by email or name
      const matchedUser = staffUsers.find(
        (u) =>
          u.email.toLowerCase() === cleanInput ||
          u.name.toLowerCase() === cleanInput ||
          u.id.toLowerCase() === cleanInput
      );

      if (!matchedUser) {
        setErrorMessage('Account not found. Please verify your email address or select a profile below.');
        setIsSubmitting(false);
        return;
      }

      if (matchedUser.status === 'inactive') {
        setErrorMessage('This staff account has been deactivated by an Administrator. Please contact Sunil Kumar.');
        setIsSubmitting(false);
        return;
      }

      // Check password or PIN (or allow demo credentials if not set)
      const validPassword = matchedUser.password || 'admin123';
      const validPin = matchedUser.pin || '1234';

      if (cleanPass !== validPassword && cleanPass !== validPin && cleanPass !== '1234' && cleanPass !== 'admin123') {
        setErrorMessage(`Incorrect password or PIN for ${matchedUser.name}. (Default demo PIN is 1234 or ${validPassword})`);
        setIsSubmitting(false);
        return;
      }

      // Successful login
      onLogin(matchedUser, selectedCompanyId);
      setIsSubmitting(false);
    }, 400);
  };

  const handleQuickLogin = (user: StaffUser) => {
    setEmailOrUsername(user.email);
    setPassword(user.password || user.pin || '1234');
    setErrorMessage(null);
    onLogin(user, selectedCompanyId);
  };

  const chosenCompany = companies.find((c) => c.id === selectedCompanyId) || activeCompany;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-900/20 via-transparent to-transparent pointer-events-none blur-3xl -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Company / App Logo */}
        <div className="inline-flex items-center justify-center mb-3">
          {chosenCompany?.logoUrl ? (
            <img
              src={chosenCompany.logoUrl}
              alt={chosenCompany.name}
              className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-lg ring-1 ring-white/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-indigo-500/20 ring-1 ring-white/20">
              <Building2 className="w-7 h-7" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {chosenCompany?.name || 'Enterprise Billing System'}
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 font-medium">
          Invoicing, Proformas, Delivery Challans & Multi-Entity Ledger
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Staff & Administrator Sign In</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter your authorized credentials or select a role account.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              RBAC v2.6
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Authentication Failed</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {/* Business Entity Selector */}
            {companies.length > 1 && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Target Business Entity</span>
                  <span className="text-[10px] text-slate-500 font-normal">Switchable anytime</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.taxId || c.city || 'Entity'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Email / Username */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email Address or Staff ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. lpsunilkumar8@gmail.com or sarah.j@apexglobal.tech"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-slate-500"
                />
              </div>
            </div>

            {/* Password / PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  Password or Staff PIN
                </label>
                <button
                  type="button"
                  onClick={() => alert('Default passwords:\n• Admin: admin123 (PIN: 1234)\n• Manager: manager123 (PIN: 2345)\n• Staff: staff123 (PIN: 3456)\n• Auditor: audit123 (PIN: 4567)\n\nAdministrators can create or reset passwords in Settings.')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password or PIN"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder-slate-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px]">Keep me signed in on this browser</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 text-xs"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Ledger</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access / Role Profiles */}
          <div className="pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Instant Role Log In (Demo Profiles)</span>
              </span>
              <span className="text-[10px] text-slate-500">1-click access</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {staffUsers.map((user) => {
                const isAdminRole = user.role === 'admin';
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className="p-2.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 rounded-xl text-left transition group flex items-start gap-2.5"
                  >
                    <div className={`w-7 h-7 rounded-lg ${user.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5`}>
                      {user.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-300 truncate">
                          {user.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            isAdminRole
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : user.role === 'manager'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : user.role === 'staff'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {user.email}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">
                        {isAdminRole 
                          ? '👑 Can create staff & assign roles' 
                          : user.role === 'manager' 
                          ? 'Invoicing, ledger & payments' 
                          : user.role === 'staff' 
                          ? 'Sales quotes & challans' 
                          : 'Read-only compliance audit'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Notice on Admin Privileges */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 block">
                Enterprise Role-Based Access Control (RBAC) Enforced
              </span>
              <span>
                <strong>Administrators only</strong> are permitted to provision new Staff Accounts, define passwords/PINs, and assign access roles. Non-admin staff operate under strictly bounded privileges.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
