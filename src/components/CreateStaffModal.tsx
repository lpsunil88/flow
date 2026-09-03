import React, { useState } from 'react';
import { StaffUser, UserRole } from '../types';
import { X, UserPlus, Shield, Lock, Mail, Phone, Building, Check, KeyRound, AlertCircle } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStaff: (newStaff: StaffUser) => void;
  existingStaff: StaffUser[];
}

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-blue-600',
];

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  onSaveStaff,
  existingStaff,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState('Billing & Operations');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      setError('Please provide the full name for the staff member.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    // Check email uniqueness
    if (existingStaff.some((s) => s.email.toLowerCase() === cleanEmail)) {
      setError(`A staff account with email "${cleanEmail}" already exists.`);
      return;
    }

    const assignedPassword = password.trim() || 'staff123';
    const assignedPin = pin.trim() || '1234';

    const newStaff: StaffUser = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role,
      avatarColor,
      password: assignedPassword,
      pin: assignedPin,
      department: department.trim() || 'Operations',
      phone: phone.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveStaff(newStaff);
    onClose();
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Create Staff Account</h2>
              <p className="text-[11px] text-slate-400">Admin-exclusive role assignment & login provisioning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rachel Adams"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Accounts, Sales, Dispatch"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address (Login ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rachel.a@company.com"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Role Assignment (The core requirement) */}
          <div className="pt-2">
            <label className="block font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assign Access Role (RBAC)</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-bold uppercase">Admin Authority Only</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Option 1: Admin */}
              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  role === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>👑 Administrator</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Full control: create staff, assign roles, provision companies, edit billing & settings.
                  </div>
                </div>
              </label>

              {/* Option 2: Manager */}
              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  role === 'manager'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="manager"
                  checked={role === 'manager'}
                  onChange={() => setRole('manager')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>👔 Billing Manager</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Can create/edit invoices, proformas, challans, record payments & manage clients/items.
                  </div>
                </div>
              </label>

              {/* Option 3: Staff */}
              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  role === 'staff'
                    ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="staff"
                  checked={role === 'staff'}
                  onChange={() => setRole('staff')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>💼 Sales Staff</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Standard sales & dispatch: generates invoices, proformas, and delivery challans.
                  </div>
                </div>
              </label>

              {/* Option 4: Auditor */}
              <label
                className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  role === 'auditor'
                    ? 'border-violet-600 bg-violet-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value="auditor"
                  checked={role === 'auditor'}
                  onChange={() => setRole('auditor')}
                  className="mt-0.5 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>🔍 Auditor</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Read-only compliance access: inspect financial ledgers, audit logs, and PDF records.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Credentials Setup (Password & PIN) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Initial Staff Credentials</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  Login Password (default: staff123)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Welcome2026!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-[11px]">
                  Quick PIN (4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 5821"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Avatar Color */}
          <div className="pt-1">
            <label className="block text-slate-600 mb-1.5 text-[11px] font-semibold">
              Profile Badge Color
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full ${c} flex items-center justify-center text-white transition ${
                    avatarColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {avatarColor === c && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account & Assign Role</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
