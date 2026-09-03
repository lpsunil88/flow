import React, { useState } from 'react';
import { CompanyProfile, StaffUser } from '../types';
import { 
  Building, LayoutDashboard, FileText, Users, Settings, 
  Menu, X, Cloud, User, Check, ChevronDown, 
  Receipt, Boxes, Plus, Building2, LogOut
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
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
}

export const Navbar: React.FC<NavbarProps> = ({
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Multi-Company Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {companies.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyDropdownOpen(!companyDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-1.5 pr-3 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition text-left group"
                    title="Switch Active Business Entity"
                  >
                    {activeCompany?.logoUrl ? (
                      <img
                        src={activeCompany.logoUrl}
                        alt={activeCompany.name}
                        className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                        {activeCompany ? activeCompany.name.substring(0, 2).toUpperCase() : <Building2 className="w-4 h-4" />}
                      </div>
                    )}
                    <div className="hidden sm:block max-w-[150px] lg:max-w-[200px]">
                      <div className="font-bold text-xs text-white truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{activeCompany?.name || businessName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {activeCompany?.taxId ? `GST: ${activeCompany.taxId}` : 'Entity'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-0.5" />
                  </button>

                  {/* Company Switcher Dropdown */}
                  {companyDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Select Active Company</span>
                        <span className="text-indigo-400 font-normal lowercase">({companies.length} entities)</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
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
                                isActive ? 'bg-indigo-950/40' : ''
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
                                  <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
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

                      {/* Admin Create Company Option */}
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
                            <span>Create New Company</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('documents')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'documents'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Invoices & Challans</span>
            </button>

            <button
              onClick={() => setActiveView('products')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'products'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Products & Catalogs</span>
            </button>

            <button
              onClick={() => setActiveView('clients')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'clients'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clients</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeView === 'settings'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Multi-Entity</span>
            </button>
          </nav>

          {/* Right Area: Google Drive Integration & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Google Drive Sign-In / Status */}
            {driveAccessToken ? (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium"
                title={`Google Drive connected: ${firebaseUser?.email || 'Active'}`}
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden lg:inline">Drive Connected</span>
                <button
                  onClick={onGoogleSignOut}
                  className="ml-1 text-slate-400 hover:text-white text-[10px] uppercase font-bold"
                  title="Sign out of Google Drive"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn}
                disabled={isAuthenticating}
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                title="Connect Google Drive for automated cloud storage"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span className="hidden sm:inline">{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
                <span className="sm:hidden">Drive</span>
              </button>
            )}

            {/* Staff Role Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setCompanyDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Switch Active Staff Role"
              >
                <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-[11px]`}>
                  {currentUser.name[0]}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold leading-none">{currentUser.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-indigo-400 capitalize">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Staff Role (Access Control)
                  </div>
                  {staffUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-[10px] font-bold`}>
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{user.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                        </div>
                      </div>
                      {currentUser.id === user.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))}

                  {/* Sign Out Option */}
                  {onLogout && (
                    <div className="pt-1.5 mt-1 border-t border-slate-800 px-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-2.5 py-2 text-left flex items-center gap-2 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-lg transition-colors text-xs font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (Lock Session)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 px-4 py-3 bg-slate-900 space-y-1">
          <button
            onClick={() => {
              setActiveView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Financial Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveView('documents');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'documents' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices & Challans</span>
          </button>

          <button
            onClick={() => {
              setActiveView('products');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Products & Catalogs</span>
          </button>

          <button
            onClick={() => {
              setActiveView('clients');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'clients' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client Database</span>
          </button>

          <button
            onClick={() => {
              setActiveView('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
              activeView === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Multi-Entity</span>
          </button>

          {onLogout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out ({currentUser.name})</span>
            </button>
          )}

          {driveAccessToken && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs px-2 text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cloud className="w-3.5 h-3.5" /> Drive Connected
              </span>
              <button onClick={onGoogleSignOut} className="text-[11px] underline">
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
