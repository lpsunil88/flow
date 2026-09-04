import React, { useState, useRef } from 'react';
import { CompanyProfile, CurrencyConfig, StaffUser, UserRole, DocumentType } from '../types';
import { 
  Building2, Globe, Percent, Shield, Cloud, 
  Save, RefreshCw, CheckCircle2, UserCheck, Plus, Trash2, Key, 
  Upload, Image, Check, Palette, Sparkles, Loader2, Search, ExternalLink,
  Briefcase, Star, UserPlus, ShieldAlert, KeyRound, Lock, Eye, EyeOff,
  LayoutTemplate, FileText, Truck, Receipt, CheckSquare, Layers, Columns, Grid
} from 'lucide-react';
import { saveBillingDataToDrive, loadBillingDataFromDrive } from '../services/googleDrive';
import { fetchGstDetails, GstDetails } from '../services/gstService';
import { DOCUMENT_DESIGNS, DocumentDesign, INVOICE_THEMES, PROFORMA_THEMES, CHALLAN_THEMES } from '../services/themeEngine';
import { CreateStaffModal } from './CreateStaffModal';
import { DesignPreviewModal } from './DesignPreviewModal';

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
  const [activeTab, setActiveTab] = useState<'company' | 'entities' | 'designs' | 'themes' | 'taxes' | 'currencies' | 'staff' | 'drive'>('company');
  const [company, setCompany] = useState<CompanyProfile>(initialCompany);
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(initialCurrencies);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(initialStaff);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  // Document Designs state
  const [previewDesign, setPreviewDesign] = useState<DocumentDesign | null>(null);
  const [designFilter, setDesignFilter] = useState<'all' | 'formal' | 'modern' | 'gst' | 'logistics' | 'pos'>('all');

  // Logo file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Company Modal State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [newCompanyGstInput, setNewCompanyGstInput] = useState('');
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);
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

  // GST Auto-Fetch for New Company Modal
  const handleFetchGstForNewCompany = async () => {
    if (!newCompanyGstInput || newCompanyGstInput.trim().length < 15) {
      setGstError('Please enter a valid 15-digit GSTIN.');
      return;
    }

    setIsFetchingGst(true);
    setGstError(null);

    try {
      const d = await fetchGstDetails(newCompanyGstInput.trim().toUpperCase());
      setNewCompanyData(prev => ({
        ...prev,
        name: d.tradeName || d.legalName,
        taxId: d.gstin,
        address: d.address,
        city: `${d.city} - ${d.pincode}`,
        email: prev.email || `accounts@${(d.tradeName || d.legalName).toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        bankDetails: {
          ...prev.bankDetails!,
          accountName: d.legalName,
        }
      }));
    } catch (err: any) {
      setGstError(err.message || 'Error communicating with GST registry.');
    } finally {
      setIsFetchingGst(false);
    }
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

  const handleSetDefaultDesign = (type: DocumentType, designId: string) => {
    const designObj = DOCUMENT_DESIGNS.find(d => d.id === designId);
    setCompany(prev => {
      const updated = {
        ...prev,
        ...(type === 'invoice' ? { defaultInvoiceDesign: designId, invoiceTheme: designObj?.theme.id } : {}),
        ...(type === 'proforma' ? { defaultProformaDesign: designId, proformaTheme: designObj?.theme.id } : {}),
        ...(type === 'challan' ? { defaultChallanDesign: designId, challanTheme: designObj?.theme.id } : {}),
      };
      if (onSaveCompany) onSaveCompany(updated);
      return updated;
    });
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
            Configure business entities, upload official company logos, manage themes, tax regimes, and staff access.
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
          onClick={() => setActiveTab('designs')}
          className={`inline-flex items-center gap-2 py-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'designs' || activeTab === 'themes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>Document Designs (8 Layouts)</span>
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
                  setNewCompanyGstInput('');
                  setGstError(null);
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

      {/* TAB 3: MULTIPLE DOCUMENT DESIGNS & LAYOUT ARCHITECTURES */}
      {(activeTab === 'designs' || activeTab === 'themes') && (
        <div className="space-y-6">
          {/* Top Banner Explaining Multiple Designs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Multiple Document Designs ({DOCUMENT_DESIGNS.length} Layout Architectures)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Configure distinct document presentation structures for your business. Unlike basic color themes, each design provides a completely different layout architecture—including executive header banners, double-bordered legal frames, detailed GST statutory matrices, compact technical grids, logistics dispatch slips, and 80mm thermal retail receipts.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>8 Ready-to-Use Layouts</span>
              </span>
            </div>
          </div>

          {/* Active Company Default Layouts Box */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Default Layout Preset for {company.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  New documents will automatically use these selected design layouts unless overridden in the document editor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Default Tax Invoice */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Tax Invoice Design
                  </span>
                  <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Default
                  </span>
                </div>

                <select
                  disabled={!canEdit}
                  value={company.defaultInvoiceDesign || company.invoiceTheme || 'design-classic-corporate'}
                  onChange={(e) => handleSetDefaultDesign('invoice', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  {DOCUMENT_DESIGNS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.badge})
                    </option>
                  ))}
                </select>

                {(() => {
                  const curr = DOCUMENT_DESIGNS.find(
                    (d) => d.id === (company.defaultInvoiceDesign || company.invoiceTheme || 'design-classic-corporate')
                  ) || DOCUMENT_DESIGNS[0];
                  return (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate">{curr.badge} Layout</span>
                      <button
                        type="button"
                        onClick={() => setPreviewDesign(curr)}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Default Proforma Invoice */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Proforma & Quote Design
                  </span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded font-mono">
                    Default
                  </span>
                </div>

                <select
                  disabled={!canEdit}
                  value={company.defaultProformaDesign || company.proformaTheme || 'design-modern-minimal'}
                  onChange={(e) => handleSetDefaultDesign('proforma', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                >
                  {DOCUMENT_DESIGNS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.badge})
                    </option>
                  ))}
                </select>

                {(() => {
                  const curr = DOCUMENT_DESIGNS.find(
                    (d) => d.id === (company.defaultProformaDesign || company.proformaTheme || 'design-modern-minimal')
                  ) || DOCUMENT_DESIGNS[2];
                  return (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate">{curr.badge} Layout</span>
                      <button
                        type="button"
                        onClick={() => setPreviewDesign(curr)}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Default Delivery Challan */}
              <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-400" />
                    Delivery Challan Design
                  </span>
                  <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded font-mono">
                    Default
                  </span>
                </div>

                <select
                  disabled={!canEdit}
                  value={company.defaultChallanDesign || company.challanTheme || 'design-logistics-dispatch'}
                  onChange={(e) => handleSetDefaultDesign('challan', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-medium focus:ring-2 focus:ring-teal-500 text-xs"
                >
                  {DOCUMENT_DESIGNS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.badge})
                    </option>
                  ))}
                </select>

                {(() => {
                  const curr = DOCUMENT_DESIGNS.find(
                    (d) => d.id === (company.defaultChallanDesign || company.challanTheme || 'design-logistics-dispatch')
                  ) || DOCUMENT_DESIGNS[6];
                  return (
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate">{curr.badge} Layout</span>
                      <button
                        type="button"
                        onClick={() => setPreviewDesign(curr)}
                        className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">Filter Layouts:</span>
            <button
              onClick={() => setDesignFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Designs ({DOCUMENT_DESIGNS.length})
            </button>
            <button
              onClick={() => setDesignFilter('formal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'formal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Formal & Legal
            </button>
            <button
              onClick={() => setDesignFilter('modern')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'modern'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Modern & Executive
            </button>
            <button
              onClick={() => setDesignFilter('gst')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'gst'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              GST Tax Matrix & Grids
            </button>
            <button
              onClick={() => setDesignFilter('logistics')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'logistics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Logistics & Challan
            </button>
            <button
              onClick={() => setDesignFilter('pos')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                designFilter === 'pos'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Retail / Thermal POS
            </button>
          </div>

          {/* Document Designs Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOCUMENT_DESIGNS.filter((d) => {
              if (designFilter === 'formal') return d.layoutType === 'classic-corporate' || d.layoutType === 'tender-formal';
              if (designFilter === 'modern') return d.layoutType === 'executive-split' || d.layoutType === 'modern-minimal' || d.layoutType === 'creative-bold';
              if (designFilter === 'gst') return d.layoutType === 'tender-formal' || d.layoutType === 'compact-grid';
              if (designFilter === 'logistics') return d.layoutType === 'logistics-dispatch';
              if (designFilter === 'pos') return d.layoutType === 'thermal-slip';
              return true;
            }).map((d) => {
              const isDefaultInv = (company.defaultInvoiceDesign || company.invoiceTheme || 'design-classic-corporate') === d.id;
              const isDefaultPro = (company.defaultProformaDesign || company.proformaTheme || 'design-modern-minimal') === d.id;
              const isDefaultCha = (company.defaultChallanDesign || company.challanTheme || 'design-logistics-dispatch') === d.id;

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Top Tag & Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: `rgb(${d.theme.primaryColor.join(',')})` }}
                        />
                        <h4 className="font-bold text-slate-900 text-xs">{d.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {d.badge}
                      </span>
                    </div>

                    {/* Mini Wireframe Architecture Graphic */}
                    <div className="my-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[9px] text-slate-400 space-y-1.5 select-none">
                      {d.layoutType === 'executive-split' ? (
                        <div className="space-y-1">
                          <div className="h-3.5 bg-slate-900 rounded text-slate-200 flex items-center justify-between px-1.5 text-[8px]">
                            <span>LOGO</span>
                            <span>INVOICE #</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-4 bg-slate-200/80 rounded" />
                            <div className="h-4 bg-slate-200/80 rounded" />
                          </div>
                          <div className="h-5 bg-white border border-slate-200 rounded" />
                        </div>
                      ) : d.layoutType === 'classic-corporate' ? (
                        <div className="p-1 border-2 border-slate-400 rounded-xs space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-600 font-bold border-b border-slate-300 pb-0.5">
                            <span>FORMAL TAX INVOICE</span>
                            <span>SIGNATURE</span>
                          </div>
                          <div className="h-5 bg-white border border-slate-200 rounded-xs" />
                        </div>
                      ) : d.layoutType === 'thermal-slip' ? (
                        <div className="w-24 mx-auto p-1 border border-dashed border-slate-400 rounded-xs text-center space-y-0.5">
                          <div className="text-[7px] font-bold text-slate-700">*** 80MM SLIP ***</div>
                          <div className="h-2 bg-slate-200 rounded-xs" />
                          <div className="h-2 bg-slate-200 rounded-xs" />
                          <div className="text-[7px] text-slate-500">||||||||||||||</div>
                        </div>
                      ) : d.layoutType === 'logistics-dispatch' ? (
                        <div className="space-y-1">
                          <div className="h-3 bg-teal-800 rounded text-teal-100 px-1 text-[7px] font-bold">
                            VEHICLE NO • DISPATCH PASS
                          </div>
                          <div className="h-4 bg-white border border-slate-200 rounded-xs" />
                          <div className="grid grid-cols-2 gap-1 text-[7px]">
                            <div className="h-2.5 bg-slate-200 rounded-xs" />
                            <div className="h-2.5 bg-slate-200 rounded-xs" />
                          </div>
                        </div>
                      ) : d.layoutType === 'tender-formal' ? (
                        <div className="space-y-1">
                          <div className="h-2.5 bg-slate-700 rounded text-slate-200 px-1 text-[7px]">
                            HSN | CGST | SGST MATRIX
                          </div>
                          <div className="grid grid-cols-4 gap-0.5">
                            <div className="h-4 bg-white border border-slate-300 rounded-xs" />
                            <div className="h-4 bg-white border border-slate-300 rounded-xs" />
                            <div className="h-4 bg-white border border-slate-300 rounded-xs" />
                            <div className="h-4 bg-white border border-slate-300 rounded-xs" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[8px] text-slate-500">
                            <span>MODERN HEADER</span>
                            <span>TOTALS</span>
                          </div>
                          <div className="h-5 bg-white border border-slate-200 rounded-xs" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {d.description}
                    </p>

                    {/* Structural Highlight Pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {d.previewFeatures.map((feat, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* Active Defaults Indicator */}
                    {(isDefaultInv || isDefaultPro || isDefaultCha) && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {isDefaultInv && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Active Invoice Default
                          </span>
                        )}
                        {isDefaultPro && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Active Proforma Default
                          </span>
                        )}
                        {isDefaultCha && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            Active Challan Default
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDesign(d)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Live Layout Preview</span>
                    </button>

                    {canEdit && (
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        <button
                          type="button"
                          disabled={isDefaultInv}
                          onClick={() => handleSetDefaultDesign('invoice', d.id)}
                          className={`py-1 rounded font-semibold transition truncate ${
                            isDefaultInv
                              ? 'bg-indigo-50 text-indigo-700 cursor-default'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Set as Default Tax Invoice Design"
                        >
                          + Invoice
                        </button>
                        <button
                          type="button"
                          disabled={isDefaultPro}
                          onClick={() => handleSetDefaultDesign('proforma', d.id)}
                          className={`py-1 rounded font-semibold transition truncate ${
                            isDefaultPro
                              ? 'bg-amber-50 text-amber-700 cursor-default'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Set as Default Proforma Invoice Design"
                        >
                          + Proforma
                        </button>
                        <button
                          type="button"
                          disabled={isDefaultCha}
                          onClick={() => handleSetDefaultDesign('challan', d.id)}
                          className={`py-1 rounded font-semibold transition truncate ${
                            isDefaultCha
                              ? 'bg-teal-50 text-teal-700 cursor-default'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                          title="Set as Default Delivery Challan Design"
                        >
                          + Challan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TAX ENGINE & PREFIXES */}
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
            <p className="text-slate-500 mt-0.5">Rates relative to USD (1.00 base standard) for financial conversion.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4">Currency Name</th>
                  <th className="py-2.5 px-4">Exchange Rate (vs USD)</th>
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
                  Exclusive rights to create staff accounts, assign roles, provision multiple companies, edit banking/GST, and configure themes.
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
              {/* GSTIN Auto-Fetch Section */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <label className="block font-bold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Auto-Fill from GST Number (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27AAACR7055N1ZO"
                    value={newCompanyGstInput}
                    onChange={(e) => setNewCompanyGstInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono uppercase font-semibold text-xs"
                  />
                  <button
                    type="button"
                    disabled={isFetchingGst || newCompanyGstInput.trim().length < 15}
                    onClick={handleFetchGstForNewCompany}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    {isFetchingGst ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Fetch Details</span>
                  </button>
                </div>
                {gstError && <p className="text-rose-600 text-[11px]">{gstError}</p>}
              </div>

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

      {/* MODAL: LIVE DESIGN PREVIEW */}
      {previewDesign && (
        <DesignPreviewModal
          design={previewDesign}
          company={company}
          onClose={() => setPreviewDesign(null)}
          onSelectDesign={(design) => {
            handleSetDefaultDesign('invoice', design.id);
            setPreviewDesign(null);
          }}
        />
      )}
    </div>
  );
};
