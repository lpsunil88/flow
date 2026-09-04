import React, { useState, useEffect } from 'react';
import { 
  Client, CompanyProfile, CurrencyConfig, Document, DocumentType, 
  PaymentRecord, StaffUser, Item, ProductList 
} from './types';
import { 
  INITIAL_CLIENTS, INITIAL_COMPANIES, INITIAL_COMPANY, INITIAL_CURRENCIES, 
  INITIAL_DOCUMENTS, INITIAL_STAFF, INITIAL_ITEMS, INITIAL_PRODUCT_LISTS 
} from './mockData';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/auth';
import { uploadPdfToDrive, saveBillingDataToDrive } from './services/googleDrive';
import { generateDocumentPdfBlob } from './services/pdfGenerator';
import { User as FirebaseUser } from 'firebase/auth';

import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentViewModal } from './components/DocumentViewModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { ReminderModal } from './components/ReminderModal';
import { ClientManagement } from './components/ClientManagement';
import { ItemManagement } from './components/ItemManagement';
import { SettingsView } from './components/SettingsView';
import { LoginPage } from './components/LoginPage';
import { BottomActionDock } from './components/BottomActionDock';
import { GoogleAuthHelpModal, AuthErrorInfo } from './components/GoogleAuthHelpModal';

import { LayoutDashboard, FileText, Users, Settings, Plus, Cloud, CheckCircle2, Boxes } from 'lucide-react';

// Production initialization: clear any legacy test/mock data from earlier test sessions
const PROD_INIT_FLAG = 'bbs_production_ready_v3';
if (typeof window !== 'undefined' && localStorage.getItem(PROD_INIT_FLAG) !== 'true') {
  localStorage.removeItem('bbs_documents_v1');
  localStorage.removeItem('bbs_clients_v1');
  localStorage.removeItem('bbs_items_v2');
  localStorage.removeItem('bbs_product_lists_v2');
  localStorage.removeItem('bbs_companies_v2');
  localStorage.removeItem('bbs_staff_v1');
  localStorage.removeItem('bbs_company_v1');
  localStorage.removeItem('bbs_active_comp_id_v2');
  localStorage.setItem(PROD_INIT_FLAG, 'true');
}

const STORAGE_KEYS = {
  DOCS: 'bbs_prod_documents_v1',
  CLIENTS: 'bbs_prod_clients_v1',
  COMPANIES: 'bbs_prod_companies_v1',
  ACTIVE_COMPANY_ID: 'bbs_prod_active_comp_id_v1',
  CURRENCIES: 'bbs_prod_currencies_v1',
  STAFF: 'bbs_prod_staff_v1',
  ITEMS: 'bbs_prod_items_v1',
  PRODUCT_LISTS: 'bbs_prod_product_lists_v1',
};

export default function App() {
  // Multi-Company State
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: CompanyProfile) => ({
            ...c,
            defaultCurrency: c.defaultCurrency === 'USD' ? 'INR' : (c.defaultCurrency || 'INR'),
          }));
        }
      } catch (e) {
        console.error('Failed to parse companies from storage', e);
      }
    }
    return INITIAL_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
    if (saved && companies.some(c => c.id === saved)) return saved;
    return companies[0]?.id || 'comp-1';
  });

  const company = companies.find(c => c.id === activeCompanyId) || companies[0];

  // Documents & Clients
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((d: Document) => ({
            ...d,
            currency: d.currency === 'USD' ? 'INR' : (d.currency || 'INR'),
          }));
        }
      } catch (e) {
        console.error('Failed to parse documents from storage', e);
      }
    }
    return INITIAL_DOCUMENTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((cl: Client) => ({
            ...cl,
            currency: cl.currency === 'USD' ? 'INR' : (cl.currency || 'INR'),
          }));
        }
      } catch (e) {
        console.error('Failed to parse clients from storage', e);
      }
    }
    return INITIAL_CLIENTS;
  });

  // Items & Multiple Product Lists
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [productLists, setProductLists] = useState<ProductList[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCT_LISTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((pl: ProductList) => ({
            ...pl,
            currency: pl.currency === 'USD' ? 'INR' : (pl.currency || 'INR'),
          }));
        }
      } catch (e) {
        console.error('Failed to parse product lists from storage', e);
      }
    }
    return INITIAL_PRODUCT_LISTS;
  });

  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const inr = parsed.find((c: CurrencyConfig) => c.code === 'INR') || {
            code: 'INR',
            symbol: '₹',
            name: 'Indian Rupee',
            exchangeRate: 1.0,
          };
          const others = parsed.filter((c: CurrencyConfig) => c.code !== 'INR');
          return [inr, ...others];
        }
      } catch (e) {
        console.error('Failed to parse currencies from storage', e);
      }
    }
    return INITIAL_CURRENCIES;
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  // User Authentication & Session State
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('bbs_logged_in_user_id') || 'user-admin';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    // If explicitly signed out, stay signed out; default to active session
    const flag = localStorage.getItem('bbs_is_logged_in');
    return flag !== 'false';
  });

  const currentUser = staffUsers.find((u) => u.id === currentUserId) || staffUsers[0] || INITIAL_STAFF[0];
  const [activeView, setActiveView] = useState<'dashboard' | 'documents' | 'clients' | 'products' | 'settings'>('dashboard');

  const handleLogin = (user: StaffUser, selectedCompanyId?: string) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    localStorage.setItem('bbs_logged_in_user_id', user.id);
    localStorage.setItem('bbs_is_logged_in', 'true');
    if (selectedCompanyId && companies.some(c => c.id === selectedCompanyId)) {
      setActiveCompanyId(selectedCompanyId);
    }
    setGlobalBannerMsg(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
    setTimeout(() => setGlobalBannerMsg(null), 4000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('bbs_is_logged_in', 'false');
    setGlobalBannerMsg('Signed out of billing workspace.');
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  // Modals & Sub-views
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [creatingDocType, setCreatingDocType] = useState<DocumentType | null>(null);
  const [recordingPaymentDoc, setRecordingPaymentDoc] = useState<Document | null>(null);
  const [reminderDoc, setReminderDoc] = useState<Document | null>(null);

  // Google Drive & Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [globalBannerMsg, setGlobalBannerMsg] = useState<string | null>(null);
  const [authHelpModalOpen, setAuthHelpModalOpen] = useState(false);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, activeCompanyId);
  }, [activeCompanyId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCT_LISTS, JSON.stringify(productLists));
  }, [productLists]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCIES, JSON.stringify(currencies));
  }, [currencies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffUsers));
  }, [staffUsers]);

  // Initialize Firebase Auth listener on startup
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setFirebaseUser(user);
        setDriveAccessToken(token);
      },
      () => {
        setFirebaseUser(null);
        setDriveAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      const res = await googleSignIn();
      if (res) {
        setFirebaseUser(res.user);
        setDriveAccessToken(res.accessToken);
        setAuthHelpModalOpen(false);
        setAuthErrorInfo(null);
        setGlobalBannerMsg('Google Drive connected! Billing documents can now be saved and synced automatically.');
        setTimeout(() => setGlobalBannerMsg(null), 5000);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      const code = err?.code || 'auth/unknown';
      const message = err?.message || 'Authentication error';
      setAuthErrorInfo({
        code,
        message,
        domain: typeof window !== 'undefined' ? window.location.hostname : '',
      });
      setAuthHelpModalOpen(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setFirebaseUser(null);
    setDriveAccessToken(null);
    setGlobalBannerMsg('Disconnected from Google Drive.');
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  // Document Operations
  const handleSaveDocument = async (doc: Document, andSyncDrive: boolean) => {
    const docToSave = {
      ...doc,
      companyId: activeCompanyId,
    };

    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === docToSave.id);
      if (exists) {
        return prev.map((d) => (d.id === docToSave.id ? docToSave : d));
      }
      return [docToSave, ...prev];
    });

    setCreatingDocType(null);
    setEditingDoc(null);

    // If client exists, update balance
    updateClientBalance(docToSave.clientId);

    if (andSyncDrive && driveAccessToken) {
      try {
        setGlobalBannerMsg(`Generating PDF & uploading ${docToSave.documentNumber} to Google Drive...`);
        const pdfBlob = generateDocumentPdfBlob(docToSave, company, currencies);
        const fileName = `${docToSave.documentNumber}_${docToSave.type.toUpperCase()}.pdf`;
        const driveFile = await uploadPdfToDrive(driveAccessToken, fileName, pdfBlob);
        
        // Update document with Drive file ID & link
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docToSave.id
              ? {
                  ...d,
                  driveFileId: driveFile.fileId,
                  driveViewLink: driveFile.webViewLink,
                  lastSyncedWithDrive: new Date().toISOString(),
                }
              : d
          )
        );
        setGlobalBannerMsg(`Document ${docToSave.documentNumber} securely saved to Google Drive!`);
        setTimeout(() => setGlobalBannerMsg(null), 4000);
      } catch (err) {
        console.error('Drive backup failed:', err);
        setGlobalBannerMsg('Document saved locally. Google Drive sync failed (token may have expired).');
        setTimeout(() => setGlobalBannerMsg(null), 5000);
      }
    } else {
      setGlobalBannerMsg(`Document ${docToSave.documentNumber} saved successfully.`);
      setTimeout(() => setGlobalBannerMsg(null), 3000);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (doc.clientId) updateClientBalance(doc.clientId);
    setGlobalBannerMsg(`Document ${doc.documentNumber} removed.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleConvertToInvoice = (sourceDoc: Document) => {
    const newDoc: Document = {
      ...sourceDoc,
      id: `doc-${Date.now()}`,
      documentNumber: `${company.invoicePrefix}${Math.floor(100 + Math.random() * 900)}`,
      type: 'invoice',
      status: 'unpaid',
      sourceProformaId: sourceDoc.type === 'proforma' ? sourceDoc.id : undefined,
      sourceChallanId: sourceDoc.type === 'challan' ? sourceDoc.id : undefined,
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      payments: [],
      paidAmount: 0,
      driveFileId: undefined,
      driveViewLink: undefined,
      lastSyncedWithDrive: undefined,
    };

    setEditingDoc(newDoc);
    setCreatingDocType('invoice');
  };

  // Payment Recording
  const handleSavePayment = (docId: string, payment: PaymentRecord) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const newPayments = [...(d.payments || []), payment];
        const newPaidAmount = newPayments.reduce((acc, p) => acc + p.amount, 0);
        const newBalance = Math.max(0, d.grandTotal - newPaidAmount);
        const newStatus =
          newBalance === 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : d.status;

        const updatedDoc = {
          ...d,
          payments: newPayments,
          paidAmount: newPaidAmount,
          status: newStatus,
        };

        if (viewingDoc && viewingDoc.id === docId) {
          setViewingDoc(updatedDoc);
        }
        return updatedDoc;
      })
    );

    const targetDoc = documents.find((d) => d.id === docId);
    if (targetDoc) updateClientBalance(targetDoc.clientId);

    setRecordingPaymentDoc(null);
    setGlobalBannerMsg(`Payment of ${payment.amount} recorded successfully.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  // Reminders
  const handleReminderSent = (
    docId: string,
    reminder: { channel: 'whatsapp' | 'email'; templateName: string; sentTo: string }
  ) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const newRecord = {
          id: `rem-${Date.now()}`,
          date: new Date().toISOString(),
          ...reminder,
        };
        const updated = {
          ...d,
          remindersSent: [...(d.remindersSent || []), newRecord],
        };
        if (viewingDoc && viewingDoc.id === docId) setViewingDoc(updated);
        return updated;
      })
    );
    setReminderDoc(null);
    setGlobalBannerMsg(`Reminder dispatched via ${reminder.channel.toUpperCase()}!`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  // Re-calculate client balances
  const updateClientBalance = (clientId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const clientInvoices = documents.filter((d) => d.clientId === clientId && d.type === 'invoice');
        const billed = clientInvoices.reduce((acc, d) => acc + d.grandTotal, 0);
        const paid = clientInvoices.reduce((acc, d) => acc + d.paidAmount, 0);
        return {
          ...c,
          totalBilled: billed,
          outstandingBalance: Math.max(0, billed - paid),
        };
      })
    );
  };

  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      if (exists) {
        return prev.map((c) => (c.id === client.id ? client : c));
      }
      return [{ ...client, companyId: activeCompanyId }, ...prev];
    });
    setGlobalBannerMsg(`Client ${client.name} updated successfully.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  // Company management handlers
  const handleSaveCompany = (updated: CompanyProfile) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    setGlobalBannerMsg(`Company ${updated.name} profile updated.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleCreateCompany = (newComp: CompanyProfile) => {
    setCompanies(prev => [...prev, newComp]);
    setActiveCompanyId(newComp.id);
    setGlobalBannerMsg(`New Company "${newComp.name}" created and switched to active!`);
    setTimeout(() => setGlobalBannerMsg(null), 4000);
  };

  const handleDeleteCompany = (companyId: string) => {
    if (companies.length <= 1) {
      alert('Cannot delete the last remaining business entity.');
      return;
    }
    const remaining = companies.filter(c => c.id !== companyId);
    setCompanies(remaining);
    if (activeCompanyId === companyId) {
      setActiveCompanyId(remaining[0].id);
    }
    setGlobalBannerMsg('Company deleted successfully.');
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  // Item and Product List Handlers
  const handleSaveItem = (item: Item) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? item : i);
      return [{ ...item, companyId: activeCompanyId }, ...prev];
    });
    setGlobalBannerMsg(`Item "${item.name}" saved to catalog.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    setGlobalBannerMsg('Item removed from catalog.');
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleSaveProductList = (list: ProductList) => {
    setProductLists(prev => {
      const exists = prev.some(l => l.id === list.id);
      if (exists) return prev.map(l => l.id === list.id ? list : l);
      return [{ ...list, companyId: activeCompanyId }, ...prev];
    });
    setGlobalBannerMsg(`Product List "${list.name}" saved.`);
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const handleDeleteProductList = (listId: string) => {
    setProductLists(prev => prev.filter(l => l.id !== listId));
    setGlobalBannerMsg('Product list deleted.');
    setTimeout(() => setGlobalBannerMsg(null), 3000);
  };

  const getAllAppData = () => {
    return {
      documents,
      clients,
      companies,
      company,
      items,
      productLists,
      currencies,
      staffUsers,
      exportedAt: new Date().toISOString(),
    };
  };

  const handleRestoreData = (restored: any) => {
    if (restored.documents) setDocuments(restored.documents);
    if (restored.clients) setClients(restored.clients);
    if (restored.companies) setCompanies(restored.companies);
    if (restored.items) setItems(restored.items);
    if (restored.productLists) setProductLists(restored.productLists);
    if (restored.currencies) setCurrencies(restored.currencies);
    if (restored.staffUsers) setStaffUsers(restored.staffUsers);
  };

  // If user is logged out, render the Login Screen
  if (!isLoggedIn) {
    return (
      <LoginPage
        staffUsers={staffUsers}
        companies={companies}
        activeCompany={company}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          setEditingDoc(null);
          setCreatingDocType(null);
        }}
        currentUser={currentUser}
        staffUsers={staffUsers}
        onSelectUser={(u) => {
          setCurrentUserId(u.id);
          localStorage.setItem('bbs_logged_in_user_id', u.id);
        }}
        onLogout={handleLogout}
        companies={companies}
        activeCompany={company}
        onSelectCompany={(id) => {
          setActiveCompanyId(id);
          const matched = companies.find(c => c.id === id);
          if (matched) {
            setGlobalBannerMsg(`Switched active entity to ${matched.name}`);
            setTimeout(() => setGlobalBannerMsg(null), 3000);
          }
        }}
        onOpenCreateCompany={() => {
          setActiveView('settings');
        }}
        firebaseUser={firebaseUser}
        driveAccessToken={driveAccessToken}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isAuthenticating={isAuthenticating}
        businessName={company.name}
        onCreateDocument={(type) => {
          setCreatingDocType(type);
          setEditingDoc(null);
        }}
        documentsCount={documents.length}
        clientsCount={clients.length}
        itemsCount={items.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3 bg-white border-b border-slate-200/90 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {activeView === 'dashboard' && 'Financial Overview & Analytics'}
              {activeView === 'documents' && 'Invoices, Proformas & Delivery Challans'}
              {activeView === 'products' && 'Product Catalog & Price Lists'}
              {activeView === 'clients' && 'Client Directory & Accounts'}
              {activeView === 'settings' && 'Company Settings & Multi-Entity Management'}
            </h1>
            <span className="text-xs text-slate-300 font-medium">|</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {company.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!creatingDocType && !editingDoc && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentUser.role === 'auditor'}
                  onClick={() => {
                    setCreatingDocType('invoice');
                    setEditingDoc(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition disabled:opacity-50"
                  title="Create New Tax Invoice"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Invoice</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Global Notification Banner */}
        {globalBannerMsg && (
          <div className="bg-slate-900 border-b border-indigo-500/40 text-white text-xs py-2 px-6 shadow-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{globalBannerMsg}</span>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 pb-32 sm:pb-28">
        {/* Editor Screen (when creating or editing a document) */}
        {creatingDocType || editingDoc ? (
          <DocumentEditor
            initialDocument={editingDoc}
            defaultType={creatingDocType || 'invoice'}
            clients={clients}
            company={company}
            currencies={currencies}
            currentUser={currentUser}
            driveAccessToken={driveAccessToken}
            itemsCatalog={items}
            productLists={productLists}
            onSave={handleSaveDocument}
            onCancel={() => {
              setCreatingDocType(null);
              setEditingDoc(null);
            }}
          />
        ) : (
          <>
            {/* View 1: Real-time Financial Dashboard */}
            {activeView === 'dashboard' && (
              <DashboardView
                documents={documents}
                currencies={currencies}
                company={company}
                currentUser={currentUser}
                onOpenCreate={(type) => setCreatingDocType(type)}
                onViewDoc={(doc) => setViewingDoc(doc)}
                onNavigateToDocs={() => setActiveView('documents')}
              />
            )}

            {/* View 2: Documents Ledger (Invoices, Proformas, Challans) */}
            {activeView === 'documents' && (
              <DocumentList
                documents={documents}
                currencies={currencies}
                company={company}
                currentUser={currentUser}
                driveAccessToken={driveAccessToken}
                onViewDoc={(doc) => setViewingDoc(doc)}
                onEditDoc={(doc) => setEditingDoc(doc)}
                onOpenCreate={(type) => setCreatingDocType(type)}
                onRecordPayment={(doc) => setRecordingPaymentDoc(doc)}
                onSendReminder={(doc) => setReminderDoc(doc)}
                onConvertToInvoice={handleConvertToInvoice}
                onDeleteDoc={handleDeleteDocument}
              />
            )}

            {/* View 3: Client Database */}
            {activeView === 'clients' && (
              <ClientManagement
                clients={clients}
                documents={documents}
                currencies={currencies}
                currentUser={currentUser}
                onSaveClient={handleSaveClient}
                onDeleteClient={handleDeleteClient}
                onCreateDocForClient={(client) => {
                  setCreatingDocType('invoice');
                }}
                onViewDoc={(doc) => setViewingDoc(doc)}
              />
            )}

            {/* View 4: Item Master & Multiple Product Lists */}
            {activeView === 'products' && (
              <ItemManagement
                items={items}
                productLists={productLists}
                currencies={currencies}
                currentCurrency={company.defaultCurrency}
                currentUser={currentUser}
                activeCompanyId={activeCompanyId}
                onSaveItem={handleSaveItem}
                onDeleteItem={handleDeleteItem}
                onSaveProductList={handleSaveProductList}
                onDeleteProductList={handleDeleteProductList}
              />
            )}

            {/* View 5: Settings, Multi-Company Management & Themes */}
            {activeView === 'settings' && (
              <SettingsView
                company={company}
                companies={companies}
                currentCompanyId={activeCompanyId}
                currencies={currencies}
                staffUsers={staffUsers}
                currentUser={currentUser}
                driveAccessToken={driveAccessToken}
                onSaveCompany={handleSaveCompany}
                onSwitchCompany={(id) => {
                  setActiveCompanyId(id);
                  const matched = companies.find(c => c.id === id);
                  if (matched) {
                    setGlobalBannerMsg(`Switched active entity to ${matched.name}`);
                    setTimeout(() => setGlobalBannerMsg(null), 3000);
                  }
                }}
                onCreateCompany={handleCreateCompany}
                onDeleteCompany={handleDeleteCompany}
                onSaveCurrencies={setCurrencies}
                onSaveStaff={setStaffUsers}
                onCloudSyncSuccess={() => {
                  setGlobalBannerMsg('Google Drive backup complete!');
                  setTimeout(() => setGlobalBannerMsg(null), 4000);
                }}
                getAllAppData={getAllAppData}
                onRestoreData={handleRestoreData}
              />
            )}
          </>
        )}
      </main>
      </div>

      {/* Mobile Bottom Navigation Bar for on-the-go billing */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setActiveView('dashboard');
            setCreatingDocType(null);
            setEditingDoc(null);
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${
            activeView === 'dashboard' && !creatingDocType && !editingDoc
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveView('documents');
            setCreatingDocType(null);
            setEditingDoc(null);
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${
            activeView === 'documents' && !creatingDocType && !editingDoc
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Ledger</span>
        </button>

        {currentUser.role !== 'auditor' && (
          <button
            onClick={() => setCreatingDocType('invoice')}
            className="flex flex-col items-center justify-center -mt-5 w-11 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md"
            title="Create Invoice"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={() => {
            setActiveView('products');
            setCreatingDocType(null);
            setEditingDoc(null);
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${
            activeView === 'products' && !creatingDocType && !editingDoc
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span>Products</span>
        </button>

        <button
          onClick={() => {
            setActiveView('clients');
            setCreatingDocType(null);
            setEditingDoc(null);
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${
            activeView === 'clients' && !creatingDocType && !editingDoc
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Clients</span>
        </button>

        <button
          onClick={() => {
            setActiveView('settings');
            setCreatingDocType(null);
            setEditingDoc(null);
          }}
          className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${
            activeView === 'settings' && !creatingDocType && !editingDoc
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Document View & PDF Preview Modal */}
      {viewingDoc && (
        <DocumentViewModal
          document={viewingDoc}
          company={company}
          currencies={currencies}
          currentUser={currentUser}
          driveAccessToken={driveAccessToken}
          onClose={() => setViewingDoc(null)}
          onRecordPayment={(doc) => setRecordingPaymentDoc(doc)}
          onSendReminder={(doc) => setReminderDoc(doc)}
          onConvertToInvoice={handleConvertToInvoice}
          onUpdateDocument={(updated) => {
            setViewingDoc(updated);
            setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
        />
      )}

      {/* Record Payment Modal */}
      {recordingPaymentDoc && (
        <RecordPaymentModal
          document={recordingPaymentDoc}
          company={company}
          currencies={currencies}
          currentUserName={currentUser.name}
          onClose={() => setRecordingPaymentDoc(null)}
          onSavePayment={handleSavePayment}
        />
      )}

      {/* Reminder Dispatch Modal */}
      {reminderDoc && (
        <ReminderModal
          document={reminderDoc}
          company={company}
          currencies={currencies}
          onClose={() => setReminderDoc(null)}
          onReminderSent={handleReminderSent}
        />
      )}

      {/* Google Drive Domain Authorization & Auth Help Modal */}
      <GoogleAuthHelpModal
        isOpen={authHelpModalOpen}
        errorInfo={authErrorInfo}
        onClose={() => setAuthHelpModalOpen(false)}
        onRetry={handleGoogleSignIn}
        isAuthenticating={isAuthenticating}
      />

      {/* Floating Bottom Action Dock for Invoices, Proformas, and Challans */}
      <BottomActionDock
        currentUser={currentUser}
        onCreateDocument={(type) => {
          setEditingDoc(null);
          setCreatingDocType(type);
        }}
        isEditingOrCreating={!!creatingDocType || !!editingDoc}
      />
    </div>
  );
}
