import React, { useState, useRef } from 'react';
import { CompanyProfile, CurrencyConfig, StaffUser, UserRole, DocumentLayoutTemplate } from '../types';
import { 
  Building2, Globe, Percent, Shield, Cloud, 
  Save, RefreshCw, CheckCircle2, UserCheck, Plus, Trash2, Key, 
  Upload, Image, Check, Sparkles, Loader2, Search, ExternalLink,
  Briefcase, Star, UserPlus, ShieldAlert, KeyRound, Lock, Eye, EyeOff,
  FileText, Truck, Stamp, PenTool, FileSignature, MapPin, Palette, LayoutTemplate, Layers
} from 'lucide-react';
import { saveBillingDataToDrive, loadBillingDataFromDrive } from '../services/googleDrive';
import { CreateStaffModal } from './CreateStaffModal';
import { generateSampleStamp, generateSampleSignature } from '../utils/stampSignature';
import { LAYOUT_TEMPLATES_CONFIG } from '../services/documentTemplate';

interface SettingsViewProps {
  company: CompanyProfile;
  companies?: CompanyProfile[];
  currentCompanyId?: string;
  currencies: CurrencyConfig[];
  staffUsers: StaffUser[];
  currentUser: StaffUser;
  driveAccessToken: string | null;
  onSaveCompany: (updated: CompanyProfile) => void;
  onSwitchCompany?: (companyId: string) => void;
  onCreateCompany?: (newCompany: CompanyProfile) => void;
  onDeleteCompany?: (companyId: string) => void;
  onSaveCurrencies: (updated: CurrencyConfig[]) => void;
  onSaveStaff: (updated: StaffUser[]) => void;
  onCloudSyncSuccess: () => void;
  getAllAppData: () => any;
  onRestoreData: (restoredData: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  company: initialCompany,
  companies = [],
  currentCompanyId,
  currencies: initialCurrencies,
  staffUsers: initialStaff,
  currentUser,
  driveAccessToken,
  onSaveCompany,
  onSwitchCompany,
  onCreateCompany,
  onDeleteCompany,
  onSaveCurrencies,
  onSaveStaff,
  onCloudSyncSuccess,
  getAllAppData,
  onRestoreData,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'entities' | 'taxes' | 'currencies' | 'staff' | 'drive'>('company');
  const [company, setCompany] = useState<CompanyProfile>(initialCompany);
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(initialCurrencies);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(initialStaff);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  // Logo file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  // New Company Modal State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState<Partial<CompanyProfile>>({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    logoUrl: '',
    defaultCurrency: 'INR',
    defaultTaxType: 'gst',
    defaultTaxRate: 18,
    isGstInterState: false,
    invoicePrefix: 'INV-',
    proformaPrefix: 'PI-',
    challanPrefix: 'DC-',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountName: '',
      accountNumber: '',
      ifscSwift: 'HDFC0001234',
      upiId: '',
    },
  });

  // Staff Account & Role Management State
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [passwordResetTarget, setPasswordResetTarget] = useState<StaffUser | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [showStaffPasswords, setShowStaffPasswords] = useState(false);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';

  // Handlers for Admin Staff Management
  const handleCreateStaff = (newStaff: StaffUser) => {
    const updated = [...staffUsers, newStaff];
    setStaffUsers(updated);
    onSaveStaff(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdateStaffRole = (userId: string, newRole: UserRole) => {
    const updated = staffUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setStaffUsers(updated);
    onSaveStaff(updated);
  };

  const handleToggleStaffStatus = (userId: string) => {
    const updated = staffUsers.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'inactive' ? 'active' : 'inactive';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });
    setStaffUsers(updated);
    onSaveStaff(updated);
  };

  const handleDeleteStaff = (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    const adminCount = staffUsers.filter((u) => u.role === 'admin').length;
    const target = staffUsers.find((u) => u.id === userId);
    if (target?.role === 'admin' && adminCount <= 1) {
      alert('Cannot delete the sole Administrator account.');
      return;
    }
    if (!confirm(`Are you sure you want to remove staff account "${target?.name}"?`)) return;

    const updated = staffUsers.filter((u) => u.id !== userId);
    setStaffUsers(updated);
    onSaveStaff(updated);
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetTarget) return;
    const updated = staffUsers.map((u) => {
      if (u.id === passwordResetTarget.id) {
        return {
          ...u,
          password: newStaffPassword.trim() || u.password || 'staff123',
          pin: newStaffPin.trim() || u.pin || '1234',
        };
      }
      return u;
    });
    setStaffUsers(updated);
    onSaveStaff(updated);
    setPasswordResetTarget(null);
    setNewStaffPassword('');
    setNewStaffPin('');
    alert(`Password/PIN updated successfully for ${passwordResetTarget.name}.`);
  };

  // Sync state when active company prop updates
  React.useEffect(() => {
    setCompany(initialCompany);
  }, [initialCompany]);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(company);
    onSaveCurrencies(currencies);
    onSaveStaff(staffUsers);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handle Logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompany(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Stamp file upload
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Stamp file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompany(prev => ({ ...prev, stampUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature file upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Signature file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompany(prev => ({ ...prev, signatureUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo upload in New Company Modal
  const handleNewCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewCompanyData(prev => ({ ...prev, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyData.name?.trim()) {
      alert('Company Name is required.');
      return;
    }

    const newComp: CompanyProfile = {
      id: `comp-${Date.now()}`,
      name: newCompanyData.name.trim(),
      taxId: newCompanyData.taxId?.trim() || '',
      email: newCompanyData.email?.trim() || '',
      phone: newCompanyData.phone?.trim() || '',
      website: newCompanyData.website?.trim() || '',
      address: newCompanyData.address?.trim() || '',
      city: newCompanyData.city?.trim() || '',
      country: 'India',
      terms: 'Payment due within 15 days of invoice date. 18% p.a. interest chargeable on overdue remittances.',
      logoUrl: newCompanyData.logoUrl || undefined,
      defaultCurrency: newCompanyData.defaultCurrency || 'INR',
      defaultTaxType: newCompanyData.defaultTaxType as any || 'gst',
      defaultTaxRate: Number(newCompanyData.defaultTaxRate || 18),
      isGstInterState: Boolean(newCompanyData.isGstInterState),
      invoicePrefix: newCompanyData.invoicePrefix || 'INV-',
      proformaPrefix: newCompanyData.proformaPrefix || 'PI-',
      challanPrefix: newCompanyData.challanPrefix || 'DC-',
      bankDetails: {
        bankName: newCompanyData.bankDetails?.bankName || 'State Bank of India',
        accountName: newCompanyData.bankDetails?.accountName || newCompanyData.name.trim(),
        accountNumber: newCompanyData.bankDetails?.accountNumber || '987654321012',
        ifscSwift: newCompanyData.bankDetails?.ifscSwift || 'SBIN0001234',
        upiId: newCompanyData.bankDetails?.upiId || '',
      },
    };

    if (onCreateCompany) {
      onCreateCompany(newComp);
    }
    setIsCreateCompanyOpen(false);
  };

  const handleManualDriveBackup = async () => {
    if (!driveAccessToken) {
      alert('Please sign in with Google Drive first.');
      return;
    }
    try {
      setIsDriveSyncing(true);
      setDriveMsg(null);
      const data = getAllAppData();
      await saveBillingDataToDrive(driveAccessToken, data);
      onCloudSyncSuccess();
      setDriveMsg('Full billing suite database backed up to Google Drive successfully!');
    } catch (err: any) {
      alert(`Backup failed: ${err.message || err}`);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleManualDriveRestore = async () => {
    if (!driveAccessToken) {
      alert('Please sign in with Google Drive first.');
      return;
    }
    if (!confirm('Restore will merge or replace local data with the backup from Google Drive. Proceed?')) {
      return;
    }
    try {
      setIsDriveSyncing(true);
      const restored = await loadBillingDataFromDrive(driveAccessToken);
      if (!restored) {
        alert('No backup file found in Google Drive folder yet.');
        return;
      }
      onRestoreData(restored);
      setDriveMsg('Database successfully restored from Google Drive!');
    } catch (err: any) {
      alert(`Restore failed: ${err.message || err}`);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const updateCurrencyRate = (code: string, newRate: number) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.code === code ? { ...c, exchangeRate: newRate } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Company Profile & Multi-Entity Suite
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure business entities, upload official company logos, manage tax regimes, and staff access.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All company, tax, and currency settings updated successfully.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('company')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'company'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Active Company & Logo</span>
        </button>

        <button
          onClick={() => setActiveTab('entities')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'entities'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Multi-Company Management</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
            {companies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('taxes')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'taxes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Tax Engine & Prefixes</span>
        </button>

        <button
          onClick={() => setActiveTab('currencies')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'currencies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Multi-Currency Rates</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'staff'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Staff Access Control</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'drive'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Google Drive Cloud Sync</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE COMPANY PROFILE & LOGO */}
      {activeTab === 'company' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          
          {/* Logo Upload Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Image className="w-4 h-4 text-indigo-600" />
                  Official Company Logo
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Uploaded logo renders prominently on PDF invoices, proforma bills, and delivery challans.
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image File
                  </button>

                  {company.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setCompany(prev => ({ ...prev, logoUrl: undefined }))}
                      className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium rounded-lg transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-2 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[10px]">No Logo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Or Enter Image Web URL (HTTPS)
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    placeholder="https://images.unsplash.com/... or https://example.com/logo.png"
                    value={company.logoUrl || ''}
                    onChange={(e) => setCompany({ ...company, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Quick sample corporate logos:</span>
                  <button
                    type="button"
                    onClick={() => setCompany({ ...company, logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80' })}
                    className="text-indigo-600 hover:underline"
                  >
                    Tech Gradient
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setCompany({ ...company, logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80' })}
                    className="text-indigo-600 hover:underline"
                  >
                    Minimal Monogram
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Legal Business Information</h3>
            <p className="text-slate-500 mt-0.5">Appears on invoices, proformas, challans, and official PDF documents.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Entity Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax ID / GSTIN / VAT Reg</label>
              <input
                type="text"
                disabled={!canEdit}
                value={company.taxId}
                onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                disabled={!canEdit}
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City & Postal Code</label>
              <input
                type="text"
                disabled={!canEdit}
                value={company.city}
                onChange={(e) => setCompany({ ...company, city: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Registered Street Address</label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Banking & Remittance Information</h3>
            <p className="text-slate-500 mb-4">Included on client invoice footers for payment remittance.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.bankDetails.bankName}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      bankDetails: { ...company.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.bankDetails.accountName}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      bankDetails: { ...company.bankDetails, accountName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.bankDetails.accountNumber}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      bankDetails: { ...company.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SWIFT / IFSC / Routing Code</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.bankDetails.ifscSwift}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      bankDetails: { ...company.bankDetails, ifscSwift: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UPI ID / Digital Handle</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.bankDetails.upiId}
                  onChange={(e) =>
                    setCompany({
                      ...company,
                      bankDetails: { ...company.bankDetails, upiId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION: OFFICIAL COMPANY STAMP & AUTHORIZED SIGNATORY */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-indigo-600" />
                <span>Company Official Stamp & Authorized Signatory</span>
              </h3>
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Upload your official company rubber stamp (seal) and authorized signature. These will be automatically rendered on all generated Invoices, Proformas, Delivery Challans, and downloadable PDFs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Company Stamp / Seal */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <Stamp className="w-4 h-4 text-blue-700" />
                    <span>Official Company Rubber Stamp / Seal</span>
                  </div>
                  {company.stampUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-300 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-2xs">
                    {company.stampUrl ? (
                      <img
                        src={company.stampUrl}
                        alt="Company Stamp"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400 p-1">
                        <Stamp className="w-8 h-8 mx-auto text-slate-300" />
                        <span className="text-[9px] block leading-tight font-medium mt-1">No Stamp</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={stampFileInputRef}
                      onChange={handleStampUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => stampFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Stamp</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          const sample = generateSampleStamp(company.name);
                          setCompany(prev => ({ ...prev, stampUrl: sample }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200 transition"
                        title="Generate a realistic circular official seal"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto Sample Stamp</span>
                      </button>

                      {company.stampUrl && (
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setCompany(prev => ({ ...prev, stampUrl: '' }))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition"
                          title="Remove stamp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Recommended: Transparent PNG or JPG circle seal (Max 2MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Authorized Signatory & Signature */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <FileSignature className="w-4 h-4 text-indigo-700" />
                    <span>Authorized Signatory & Digital Signature</span>
                  </div>
                  {company.signatureUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Signatory Name</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. Sunil Kumar"
                      value={company.authorizedSignatoryName || ''}
                      onChange={(e) => setCompany({ ...company, authorizedSignatoryName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Designation</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. Director / Partner"
                      value={company.authorizedSignatoryDesignation || ''}
                      onChange={(e) => setCompany({ ...company, authorizedSignatoryDesignation: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="w-32 h-14 rounded-lg border-2 border-dashed border-indigo-200 bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
                    {company.signatureUrl ? (
                      <img
                        src={company.signatureUrl}
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <PenTool className="w-5 h-5 mx-auto text-slate-300" />
                        <span className="text-[9px] block leading-tight font-medium mt-0.5">No Signature</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <input
                      type="file"
                      ref={signatureFileInputRef}
                      onChange={handleSignatureUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => signatureFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Sign</span>
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          const sample = generateSampleSignature(company.authorizedSignatoryName || 'Sunil Kumar');
                          setCompany(prev => ({ ...prev, signatureUrl: sample }));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold border border-indigo-200 transition"
                        title="Generate cursive pen signature"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto Sample Sign</span>
                      </button>

                      {company.signatureUrl && (
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setCompany(prev => ({ ...prev, signatureUrl: '' }))}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition"
                          title="Remove signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: DEFAULT PLACE OF DISPATCH ("DISPATCHED FROM") */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <span>Default Place of Dispatch ("Dispatched From")</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Origin factory, logistics godown, or dispatch warehouse for GST compliance and delivery challans.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 transition">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={Boolean(company.defaultDispatchAddress?.enabled)}
                    onChange={(e) =>
                      setCompany({
                        ...company,
                        defaultDispatchAddress: {
                          ...(company.defaultDispatchAddress || {}),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>Enable Custom Dispatch Origin</span>
                </label>

                {company.defaultDispatchAddress?.enabled && (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setCompany({
                        ...company,
                        defaultDispatchAddress: {
                          enabled: true,
                          name: `${company.name} Central Warehouse`,
                          address: company.address,
                          city: company.city,
                          state: 'Maharashtra',
                          stateCode: '27',
                          pincode: '400001',
                          phone: company.phone,
                          taxId: company.taxId,
                        },
                      });
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded border border-slate-300 shadow-2xs transition"
                  >
                    Copy from Registered Address
                  </button>
                )}
              </div>
            </div>

            {company.defaultDispatchAddress?.enabled && (
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Warehouse / Plant Name</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. Bhiwandi Logistics Hub, Unit 4"
                      value={company.defaultDispatchAddress?.name || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dispatch GSTIN / Tax ID</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. 27ABCDE1234F1Z5"
                      value={company.defaultDispatchAddress?.taxId || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            taxId: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dispatch Contact Phone</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. +91 98765 43210"
                      value={company.defaultDispatchAddress?.phone || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            phone: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Dispatch Street Address</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="Plot No. 42, MIDC Industrial Area"
                      value={company.defaultDispatchAddress?.address || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            address: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Hub</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. Thane / Mumbai"
                      value={company.defaultDispatchAddress?.city || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. 421302"
                      value={company.defaultDispatchAddress?.pincode || ''}
                      onChange={(e) =>
                        setCompany({
                          ...company,
                          defaultDispatchAddress: {
                            ...(company.defaultDispatchAddress || {}),
                            pincode: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: DOCUMENT BRANDING & PDF LAYOUT TEMPLATES */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  <span>Document Branding & PDF Layout</span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    Standardized Engine
                  </span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Choose the default layout design applied across all your official Invoices, Delivery Challans, and Proformas. Each template standardizes fonts, tables, statutory sections, and branding stamps.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Current Template:</span>
                <span className="font-bold text-slate-900 capitalize bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {company.documentTemplate || 'modern'}
                </span>
              </div>
            </div>

            {/* 3 Layout Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              {(['minimalist', 'modern', 'classic'] as DocumentLayoutTemplate[]).map((layoutKey) => {
                const config = LAYOUT_TEMPLATES_CONFIG[layoutKey];
                const isSelected = (company.documentTemplate || 'modern') === layoutKey;

                return (
                  <div
                    key={layoutKey}
                    onClick={() => {
                      if (!canEdit) return;
                      setCompany((prev) => ({ ...prev, documentTemplate: layoutKey }));
                    }}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Header Strip */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            <LayoutTemplate className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-950 text-sm leading-tight">
                              {config.name}
                            </h4>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {config.badge}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                            <Check className="w-3 h-3 stroke-[2.5]" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            Click to select
                          </span>
                        )}
                      </div>

                      {/* Visual Blueprint Representation */}
                      <div className="my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                        {layoutKey === 'minimalist' && (
                          <div className="space-y-1 text-[9px] text-slate-600">
                            <div className="flex justify-between border-b border-slate-300 pb-1">
                              <span className="font-semibold text-slate-900">INVOICE</span>
                              <span className="text-slate-400">HAIRLINE DIVIDERS</span>
                            </div>
                            <div className="flex justify-between text-[8.5px] text-slate-500 py-0.5">
                              <span>Consignor Name</span>
                              <span>Consignee Name</span>
                            </div>
                            <div className="border-t border-b border-slate-200 py-1 space-y-0.5">
                              <div className="flex justify-between text-[8px] font-medium text-slate-700">
                                <span>Item Description</span>
                                <span>Amount</span>
                              </div>
                              <div className="h-1 bg-slate-200 rounded-xs w-3/4" />
                            </div>
                            <div className="flex justify-end text-[9px] font-semibold text-slate-900 pt-0.5">
                              <span>Grand Total: ₹--</span>
                            </div>
                          </div>
                        )}

                        {layoutKey === 'modern' && (
                          <div className="space-y-1 text-[9px] text-slate-600">
                            <div className="flex justify-between items-center bg-blue-50 px-1.5 py-1 rounded border border-blue-200">
                              <span className="font-bold text-blue-900">TAX INVOICE</span>
                              <span className="text-[8px] text-blue-700 font-medium">BLUE ACCENTS</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 py-0.5">
                              <div className="bg-white p-1 rounded border border-slate-200 text-[8px]">
                                <span className="font-bold text-slate-800">SELLER CARD</span>
                              </div>
                              <div className="bg-white p-1 rounded border border-slate-200 text-[8px]">
                                <span className="font-bold text-slate-800">BUYER CARD</span>
                              </div>
                            </div>
                            <div className="bg-white rounded border border-slate-200 p-1 space-y-0.5">
                              <div className="flex justify-between text-[8px] font-bold text-slate-800 border-b border-slate-100 pb-0.5">
                                <span>9-Col Merchandise Grid</span>
                                <span>Total</span>
                              </div>
                              <div className="h-1 bg-blue-100 rounded-xs w-2/3" />
                            </div>
                            <div className="flex justify-between items-center bg-slate-100 px-1 py-0.5 rounded text-[8.5px] font-bold text-slate-950">
                              <span>Grand Total</span>
                              <span>₹--</span>
                            </div>
                          </div>
                        )}

                        {layoutKey === 'classic' && (
                          <div className="space-y-1 text-[9px] text-slate-600 font-serif">
                            <div className="border-b-2 border-slate-900 pb-0.5 flex justify-between">
                              <span className="font-black tracking-wider text-slate-950">TAX INVOICE</span>
                              <span className="text-[8px] font-sans font-medium text-slate-500">DOUBLE RULE</span>
                            </div>
                            <div className="h-[1px] bg-slate-900 -mt-0.5 mb-1" />
                            <div className="grid grid-cols-2 gap-1 py-0.5">
                              <div className="bg-white p-1 border border-slate-400 text-[8px]">
                                <span className="font-bold">CONSIGNOR PANEL</span>
                              </div>
                              <div className="bg-white p-1 border border-slate-400 text-[8px]">
                                <span className="font-bold">CONSIGNEE PANEL</span>
                              </div>
                            </div>
                            <div className="border border-slate-400 p-0.5 space-y-0.5 bg-slate-50">
                              <div className="flex justify-between text-[8px] font-bold text-slate-900 bg-slate-200 px-1">
                                <span>TABULAR GRID</span>
                                <span>AMOUNT</span>
                              </div>
                              <div className="h-1 bg-slate-300 w-full" />
                            </div>
                            <div className="border-y border-slate-900 py-0.5 text-right font-bold text-[8.5px]">
                              GRAND TOTAL: ₹--
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tagline */}
                      <p className="text-[11.5px] text-slate-600 mb-3 leading-relaxed">
                        {config.tagline}
                      </p>

                      {/* Key Features List */}
                      <div className="space-y-1.5 border-t border-slate-200/80 pt-2.5">
                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Key Features:
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-600">
                          {config.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-indigo-500 font-bold shrink-0">•</span>
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Footer selection button */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        Best for: <strong className="text-slate-700">{config.idealFor.split(',')[0]}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canEdit) return;
                          setCompany((prev) => ({ ...prev, documentTemplate: layoutKey }));
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Apply Layout'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2 mt-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Shared Base Template Guarantee:</strong> All layouts render both in high-resolution A4 browser print previews and vector-rendered PDF downloads with identical dimensions, company branding logos, official rubber stamps, signatures, and legal compliance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-COMPANY & MULTI-ENTITY MANAGEMENT */}
      {activeTab === 'entities' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Multi-Company & Corporate Entities
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Administrators can create and operate multiple legal companies under one unified billing portal.
              </p>
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setNewCompanyData({
                    name: '',
                    taxId: '',
                    email: '',
                    phone: '',
                    website: '',
                    address: '',
                    city: '',
                    logoUrl: '',
                    defaultCurrency: 'INR',
                    defaultTaxType: 'gst',
                    defaultTaxRate: 18,
                    isGstInterState: false,
                    invoicePrefix: 'INV-',
                    proformaPrefix: 'PI-',
                    challanPrefix: 'DC-',
                    bankDetails: {
                      bankName: 'HDFC Bank',
                      accountName: '',
                      accountNumber: '',
                      ifscSwift: 'HDFC0001234',
                      upiId: '',
                    },
                  });
                  setIsCreateCompanyOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Create New Company
              </button>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                Admin Role required to create new companies.
              </div>
            )}
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((comp) => {
              const isActive = (currentCompanyId || company.id) === comp.id;
              return (
                <div
                  key={comp.id}
                  className={`bg-white rounded-xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white p-1"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900">{comp.name}</h3>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Active Entity
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {comp.taxId ? `GSTIN / Tax ID: ${comp.taxId}` : 'No Tax ID registered'}
                          </p>
                        </div>
                      </div>

                      {isAdmin && companies.length > 1 && !isActive && onDeleteCompany && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete company "${comp.name}"?`)) {
                              onDeleteCompany(comp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Default Currency</span>
                        <span className="font-semibold text-slate-700">{comp.defaultCurrency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Tax Regime</span>
                        <span className="font-semibold text-slate-700 uppercase">{comp.defaultTaxType} ({comp.defaultTaxRate}%)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Numbering Prefixes</span>
                        <span className="font-mono text-slate-600 text-[11px]">{comp.invoicePrefix} / {comp.challanPrefix}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Headquarters</span>
                        <span className="text-slate-700 truncate block">{comp.city || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isActive ? (
                      <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Currently Active across Suite
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSwitchCompany) onSwitchCompany(comp.id);
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition"
                      >
                        Switch to this Company
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TAX ENGINE & PREFIXES */}
      {activeTab === 'taxes' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tax Regime & Automated Calculations</h3>
            <p className="text-slate-500 mt-0.5">Supports GST with HSN/SAC codes, VAT, and Sales Tax.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Tax Regime</label>
              <select
                disabled={!canEdit}
                value={company.defaultTaxType}
                onChange={(e) => setCompany({ ...company, defaultTaxType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
              >
                <option value="gst">GST (CGST + SGST or IGST)</option>
                <option value="vat">VAT (Value Added Tax)</option>
                <option value="sales_tax">General Sales Tax</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                disabled={!canEdit}
                value={company.defaultTaxRate}
                onChange={(e) => setCompany({ ...company, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-medium"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={company.isGstInterState}
                  onChange={(e) => setCompany({ ...company, isGstInterState: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-semibold text-slate-800">GST Inter-State (IGST 100% instead of CGST/SGST 50-50)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Document Numbering Prefixes</h3>
            <p className="text-slate-500 mb-4">Set standardized prefixes for automated sequential numbering.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.invoicePrefix}
                  onChange={(e) => setCompany({ ...company, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proforma Invoice Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.proformaPrefix}
                  onChange={(e) => setCompany({ ...company, proformaPrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Challan Prefix</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={company.challanPrefix}
                  onChange={(e) => setCompany({ ...company, challanPrefix: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MULTI-CURRENCY RATES */}
      {activeTab === 'currencies' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configured Currencies & Exchange Rates</h3>
            <p className="text-slate-500 mt-0.5">Rates relative to base currency (INR / ₹) for financial conversion.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4">Currency Name</th>
                  <th className="py-2.5 px-4">Exchange Rate (vs INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currencies.map((curr) => (
                  <tr key={curr.code}>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{curr.code}</td>
                    <td className="py-2.5 px-4 font-bold text-indigo-600">{curr.symbol}</td>
                    <td className="py-2.5 px-4 text-slate-700">{curr.name}</td>
                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        step="0.0001"
                        disabled={!canEdit}
                        value={curr.exchangeRate}
                        onChange={(e) => updateCurrencyRate(curr.code, parseFloat(e.target.value) || 1)}
                        className="w-32 px-2.5 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF ACCESS CONTROL & ROLE ASSIGNMENT */}
      {activeTab === 'staff' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          
          {/* Header with Admin-Only Creation Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Staff Accounts & Access Roles (RBAC)</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {staffUsers.length} Accounts
                </span>
              </div>
              <p className="text-slate-500 mt-0.5">
                Manage employee login credentials and assign privileges for multi-company billing, invoicing, and auditing.
              </p>
            </div>

            {/* Admin-Only Button to Create Staff */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreateStaffOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Staff Account</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 flex items-center gap-1.5 shrink-0">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium">Creation Restricted to Admins</span>
              </div>
            )}
          </div>

          {/* RBAC Notice Banner */}
          {!isAdmin ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Restricted Privilege Mode</span>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Only System Administrators have permission to provision new staff credentials and assign or change access roles. You are currently authenticated as <strong>{currentUser.name}</strong> with role <strong>{currentUser.role.toUpperCase()}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-900">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  <strong>Administrator Authority:</strong> You can create new staff profiles, assign access roles, and manage credentials.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffPasswords(!showStaffPasswords)}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200 shadow-2xs"
              >
                {showStaffPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showStaffPasswords ? 'Hide Credentials' : 'View Passwords'}</span>
              </button>
            </div>
          )}

          {/* Staff Accounts Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Email / Login ID</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Assigned Role</th>
                  {isAdmin && <th className="py-2.5 px-4">Password / PIN</th>}
                  <th className="py-2.5 px-4">Status</th>
                  {isAdmin && <th className="py-2.5 px-4 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isUserAdmin = user.role === 'admin';
                  return (
                    <tr key={user.id} className={user.status === 'inactive' ? 'bg-slate-50/70 opacity-70' : 'hover:bg-slate-50/50'}>
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs`}>
                            {user.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                                  You
                                </span>
                              )}
                            </div>
                            {user.phone && (
                              <div className="text-[10px] text-slate-400">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-slate-600">{user.email}</td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-600">
                        {user.department || 'Operations'}
                      </td>

                      {/* Role Assignment (Admin-editable dropdown, otherwise read-only badge) */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <div className="relative inline-block">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateStaffRole(user.id, e.target.value as UserRole)}
                              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="admin">👑 Admin (Full Access)</option>
                              <option value="manager">👔 Billing Manager</option>
                              <option value="staff">💼 Sales Staff</option>
                              <option value="auditor">🔍 Auditor (Read-Only)</option>
                            </select>
                          </div>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : user.role === 'manager'
                                ? 'bg-emerald-100 text-emerald-800'
                                : user.role === 'staff'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        )}
                      </td>

                      {/* Password / PIN (Visible to Admin only) */}
                      {isAdmin && (
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {showStaffPasswords ? (
                            <div className="space-y-0.5">
                              <div><span className="text-slate-400">PW:</span> {user.password || 'admin123'}</div>
                              <div><span className="text-slate-400">PIN:</span> {user.pin || '1234'}</div>
                            </div>
                          ) : (
                            <span className="tracking-widest text-slate-400 font-bold">••••••••</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(user.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                              user.status === 'inactive'
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                            title="Click to toggle active/inactive status"
                          >
                            {user.status === 'inactive' ? 'Inactive' : 'Active'}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              user.status === 'inactive' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {user.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setPasswordResetTarget(user);
                                setNewStaffPassword(user.password || 'staff123');
                                setNewStaffPin(user.pin || '1234');
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Reset Password / PIN"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Staff Account */}
                            <button
                              type="button"
                              disabled={isCurrent || (isUserAdmin && staffUsers.filter(u => u.role === 'admin').length <= 1)}
                              onClick={() => handleDeleteStaff(user.id)}
                              className={`p-1.5 rounded-lg transition ${
                                isCurrent || (isUserAdmin && staffUsers.filter(u => u.role === 'admin').length <= 1)
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isCurrent ? 'Cannot delete self' : 'Delete staff account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Role Permissions Legend */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Role Capabilities Matrix</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-amber-800">👑 Administrator</div>
                <div className="text-slate-500 mt-0.5">
                  Exclusive rights to create staff accounts, assign roles, provision multiple companies, edit banking/GST, and system settings.
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-emerald-800">👔 Billing Manager</div>
                <div className="text-slate-500 mt-0.5">
                  Full creation and management of invoices, proformas, challans, recording payments, client records, and item catalogs.
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-blue-800">💼 Sales Staff</div>
                <div className="text-slate-500 mt-0.5">
                  Can generate sales invoices, quotations/proformas, delivery challans, and query client information.
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="font-bold text-purple-800">🔍 Auditor</div>
                <div className="text-slate-500 mt-0.5">
                  Read-only compliance mode: can review all ledgers, inspect tax breakdowns, and export PDF reports without altering data.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 7: GOOGLE DRIVE CLOUD SYNC */}
      {activeTab === 'drive' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Drive Cloud Storage & Synchronization</h3>
            <p className="text-slate-500 mt-0.5">
              Securely archive customer transactions, invoices, challan PDFs, and full database snapshots in your Google Drive.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {driveAccessToken ? 'Google Drive Connected' : 'Google Drive Disconnected'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Target Folder: <span className="font-mono font-medium text-slate-700">Business_Billing_Suite</span>
                  </div>
                </div>
              </div>

              <div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  driveAccessToken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {driveAccessToken ? 'OAuth Active' : 'Sign-In Required'}
                </span>
              </div>
            </div>

            {driveMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 font-medium">
                {driveMsg}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleManualDriveBackup}
                disabled={isDriveSyncing || !driveAccessToken}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {isDriveSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>Backup Full Billing Database to Drive</span>
              </button>

              <button
                type="button"
                onClick={handleManualDriveRestore}
                disabled={isDriveSyncing || !driveAccessToken}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restore Database from Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW COMPANY (ADMIN ONLY) */}
      {isCreateCompanyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Legal Business Entity</h3>
                  <p className="text-xs text-slate-500">
                    Add a new company with separate billing prefixes, logo, banking, and tax ID.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCompanyOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-4 pt-4 text-xs">
              {/* Company Logo Section in Modal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {newCompanyData.logoUrl ? (
                      <img src={newCompanyData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="modal-logo-file"
                      onChange={handleNewCompanyLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <label
                      htmlFor="modal-logo-file"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold cursor-pointer text-xs"
                    >
                      <Upload className="w-3 h-3" />
                      Browse File
                    </label>
                    <input
                      type="url"
                      placeholder="Or paste Logo URL..."
                      value={newCompanyData.logoUrl || ''}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, logoUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Technologies Pvt Ltd"
                    value={newCompanyData.name || ''}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAACR7055N1ZO"
                    value={newCompanyData.taxId || ''}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={newCompanyData.email || ''}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newCompanyData.phone || ''}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City & State</label>
                  <input
                    type="text"
                    placeholder="Mumbai, Maharashtra"
                    value={newCompanyData.city || ''}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Plot No 45, MIDC Industrial Area..."
                  value={newCompanyData.address || ''}
                  onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Currency & Prefixes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Currency</label>
                  <select
                    value={newCompanyData.defaultCurrency || 'INR'}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, defaultCurrency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={newCompanyData.invoicePrefix || 'INV-'}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Challan Prefix</label>
                  <input
                    type="text"
                    value={newCompanyData.challanPrefix || 'DC-'}
                    onChange={(e) => setNewCompanyData({ ...newCompanyData, challanPrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Bank Remittance */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800 mb-2">Primary Bank Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={newCompanyData.bankDetails?.bankName || ''}
                    onChange={(e) => setNewCompanyData({
                      ...newCompanyData,
                      bankDetails: { ...newCompanyData.bankDetails!, bankName: e.target.value }
                    })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={newCompanyData.bankDetails?.accountNumber || ''}
                    onChange={(e) => setNewCompanyData({
                      ...newCompanyData,
                      bankDetails: { ...newCompanyData.bankDetails!, accountNumber: e.target.value }
                    })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="IFSC / SWIFT"
                    value={newCompanyData.bankDetails?.ifscSwift || ''}
                    onChange={(e) => setNewCompanyData({
                      ...newCompanyData,
                      bankDetails: { ...newCompanyData.bankDetails!, ifscSwift: e.target.value }
                    })}
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Create Company Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Create Staff Modal */}
      {isCreateStaffOpen && (
        <CreateStaffModal
          isOpen={isCreateStaffOpen}
          onClose={() => setIsCreateStaffOpen(false)}
          onSaveStaff={handleCreateStaff}
          existingStaff={staffUsers}
        />
      )}

      {/* Admin Reset Password / PIN Modal */}
      {passwordResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs">Reset Staff Credentials</span>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-5 space-y-3.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{passwordResetTarget.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">{passwordResetTarget.email}</div>
                <div className="text-[10px] text-indigo-600 font-semibold uppercase mt-0.5">Role: {passwordResetTarget.role}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Quick PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="e.g. 1234"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordResetTarget(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
