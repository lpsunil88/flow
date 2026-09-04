import React, { useState } from 'react';
import { CompanyProfile, DocumentType, StaffUser } from '../types';
import { 
  LayoutDashboard, FileText, Users, Settings, 
  Menu, X, Cloud, Check, ChevronDown, 
  Receipt, Boxes, Plus, Building2, LogOut,
  ChevronLeft, ChevronRight, Truck, FileSpreadsheet,
  Layers, Shield
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  activeView: 'dashboard' | 'documents' | 'clients' | 'products' | 'settings';
  setActiveView: (view: 'dashboard' | 'documents' | 'clients' | 'products' | 'settings') => void;
  currentUser: StaffUser;
  staffUsers: StaffUser[];
  onSelectUser: (user: StaffUser) => void;
  onLogout?: () => void;
  companies?: CompanyProfile[];
  activeCompany?: CompanyProfile;
  onSelectCompany?: (companyId: string) => void;
  onOpenCreateCompany?: () => void;
  firebaseUser: FirebaseUser | null;
  driveAccessToken: string | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isAuthenticating: boolean;
  businessName: string;
  onCreateDocument?: (type: DocumentType) => void;
  documentsCount?: number;
  clientsCount?: number;
  itemsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  staffUsers,
  onSelectUser,
  onLogout,
  companies = [],
  activeCompany,
  onSelectCompany,
  onOpenCreateCompany,
  firebaseUser,
  driveAccessToken,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthenticating,
  businessName,
  onCreateDocument,
  documentsCount,
  clientsCount,
  itemsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const isAuditor = currentUser.role === 'auditor';

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'documents' as const,
      label: 'Invoices & Challans',
      icon: FileText,
      badge: documentsCount !== undefined ? documentsCount : null,
    },
    {
      id: 'products' as const,
      label: 'Products & Catalogs',
      icon: Boxes,
      badge: itemsCount !== undefined ? itemsCount : null,
    },
    {
      id: 'clients' as const,
      label: 'Clients',
      icon: Users,
      badge: clientsCount !== undefined ? clientsCount : null,
    },
    {
      id: 'settings' as const,
      label: 'Settings & Multi-Entity',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (viewId: 'dashboard' | 'documents' | 'clients' | 'products' | 'settings') => {
    setActiveView(viewId);
    setMobileMenuOpen(false);
  };

  const handleQuickCreate = (type: DocumentType) => {
    setCreateDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onCreateDocument) {
      onCreateDocument(type);
    }
  };

  return (
    <>
      {/* Mobile Top App Bar (Only on small screens) */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {activeCompany ? activeCompany.name.substring(0, 2).toUpperCase() : 'BS'}
            </div>
            <div className="leading-tight">
              <span className="font-bold text-xs text-white block truncate max-w-[170px]">
                {activeCompany?.name || businessName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeCompany?.taxId ? `GST: ${activeCompany.taxId}` : 'Billing Suite'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driveAccessToken ? (
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" title="Google Drive Connected" />
          ) : (
            <button
              onClick={onGoogleSignIn}
              type="button"
              className="text-[10px] font-semibold bg-white text-slate-800 px-2 py-1 rounded shadow-xs hover:bg-slate-100 transition"
            >
              Sign In
            </button>
          )}
          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 z-50 md:z-30 h-screen bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out select-none
          ${mobileMenuOpen ? 'left-0 shadow-2xl' : '-left-full md:left-0'}
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          
          {/* Header: Company & Entity Switcher */}
          <div className="p-4 border-b border-slate-800/90 relative">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setCompanyDropdownOpen(!companyDropdownOpen);
                    setUserDropdownOpen(false);
                    setCreateDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-left group ${
                    isCollapsed ? 'justify-center p-2' : ''
                  }`}
                  title="Switch Active Business Entity"
                >
                  {activeCompany?.logoUrl ? (
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.name}
                      className="w-9 h-9 rounded-lg object-cover bg-white p-0.5 shrink-0 border border-slate-600"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                      {activeCompany ? activeCompany.name.substring(0, 2).toUpperCase() : <Building2 className="w-5 h-5" />}
                    </div>
                  )}

                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate group-hover:text-indigo-200 transition">
                        {activeCompany?.name || businessName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {activeCompany?.taxId ? `GST: ${activeCompany.taxId}` : 'Primary Entity'}
                      </div>
                    </div>
                  )}

                  {!isCollapsed && (
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 ml-1 transition-transform duration-200" />
                  )}
                </button>

                {/* Company Switcher Dropdown Menu */}
                {companyDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Select Active Entity</span>
                      <span className="text-indigo-400 font-normal lowercase">({companies.length} available)</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                      {companies.map((comp) => {
                        const isActive = activeCompany?.id === comp.id;
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => {
                              if (onSelectCompany) onSelectCompany(comp.id);
                              setCompanyDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                              isActive ? 'bg-indigo-950/40 text-white' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {comp.logoUrl ? (
                                <img
                                  src={comp.logoUrl}
                                  alt={comp.name}
                                  className="w-7 h-7 rounded-md object-cover bg-white p-0.5 shrink-0"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-md bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {comp.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                                  <span>{comp.name}</span>
                                  {isActive && (
                                    <span className="text-[9px] px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded font-normal">Active</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {comp.taxId ? `GST: ${comp.taxId}` : comp.city} • {comp.defaultCurrency}
                                </div>
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    {isAdmin && onOpenCreateCompany && (
                      <div className="pt-1.5 mt-1 border-t border-slate-800 px-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyDropdownOpen(false);
                            onOpenCreateCompany();
                          }}
                          className="w-full py-2 px-2.5 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Entity</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Create Action Button */}
          <div className="px-3 pt-4 pb-2 relative">
            {!isCollapsed ? (
              <div className="relative">
                <button
                  type="button"
                  disabled={isAuditor}
                  onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                    isAuditor
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30 hover:shadow-indigo-600/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span>New Document</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-indigo-200 transition-transform duration-200 ${createDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Quick Create Dropdown Menu */}
                {createDropdownOpen && !isAuditor && (
                  <div className="absolute left-3 right-3 top-full mt-1 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => handleQuickCreate('invoice')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-indigo-600/30 flex items-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCreate('proforma')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-indigo-600/30 flex items-center gap-2 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                      <span>Proforma Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCreate('challan')}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-indigo-600/30 flex items-center gap-2 transition"
                    >
                      <Truck className="w-4 h-4 text-teal-400" />
                      <span>Delivery Challan</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={isAuditor}
                onClick={() => onCreateDocument && onCreateDocument('invoice')}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition"
                title="Create New Invoice"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links Group */}
          <div className="px-3 py-3 space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Main Menu
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30 font-bold' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                      ${isCollapsed ? 'justify-center px-0' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== null && item.badge > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active Accent Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Google Drive Integration Widget in Sidebar */}
          <div className="px-3 py-2 mt-auto">
            {!isCollapsed ? (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-[11px]">Google Drive</span>
                  </div>
                  {driveAccessToken ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Synced
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Offline</span>
                  )}
                </div>

                {driveAccessToken ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 truncate">
                      {firebaseUser?.email || 'Cloud sync active'}
                    </p>
                    <button
                      type="button"
                      onClick={onGoogleSignOut}
                      className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition"
                    >
                      Disconnect Drive
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-slate-400 mb-2 leading-tight">
                      Backup documents & auto-upload PDF copies.
                    </p>
                    <button
                      type="button"
                      onClick={onGoogleSignIn}
                      disabled={isAuthenticating}
                      className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg shadow-xs transition"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center p-2">
                <button
                  type="button"
                  onClick={driveAccessToken ? onGoogleSignOut : onGoogleSignIn}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    driveAccessToken ? 'bg-emerald-950/80 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={driveAccessToken ? 'Google Drive Connected' : 'Connect Google Drive'}
                >
                  <Cloud className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Section: User Profile & Role Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setCompanyDropdownOpen(false);
                setCreateDropdownOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 transition text-left group ${
                isCollapsed ? 'justify-center p-1.5' : ''
              }`}
              title="User profile & role switcher"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 ring-2 ring-indigo-500/30">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                    <span className="truncate">{currentUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className={`inline-flex px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                      currentUser.role === 'admin' 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : currentUser.role === 'staff' 
                        ? 'bg-blue-500/20 text-blue-300' 
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {currentUser.role}
                    </span>
                    <span className="truncate text-slate-500">• {currentUser.email}</span>
                  </div>
                </div>
              )}

              {!isCollapsed && (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-0.5" />
              )}
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Switch User / Role</span>
                  <Shield className="w-3 h-3 text-slate-500" />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                  {staffUsers.map((user) => {
                    const isSelected = currentUser.id === user.id;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          onSelectUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          isSelected ? 'bg-indigo-950/40 text-white' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs truncate flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelected && (
                                <span className="text-[9px] px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded">Current</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              <span className="uppercase font-bold text-[9px] text-slate-300">{user.role}</span> • {user.email}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {onLogout && (
                  <div className="pt-2 mt-1 border-t border-slate-800 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold rounded-lg transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out & Exit</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <div className="hidden md:flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 text-[11px] flex items-center gap-1.5 transition"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 mx-auto" />
              ) : (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Collapse sidebar</span>
                </>
              )}
            </button>
            {!isCollapsed && (
              <span className="text-[10px] text-slate-400 font-mono">v3.2</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
