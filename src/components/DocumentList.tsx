import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, DocumentType, StaffUser } from '../types';
import { formatCurrency, downloadDocumentPdf } from '../services/pdfGenerator';
import { 
  Search, Filter, Plus, FileText, Receipt, Truck, Download, 
  ExternalLink, CreditCard, Send, CheckCircle2, Trash2, Edit, 
  CloudCheck, ArrowUpDown, ChevronRight, FileCheck 
} from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  currencies: CurrencyConfig[];
  company: CompanyProfile;
  currentUser: StaffUser;
  driveAccessToken: string | null;
  activeTypeFilter?: DocumentType | 'all';
  onViewDoc: (doc: Document) => void;
  onEditDoc: (doc: Document) => void;
  onOpenCreate: (type: DocumentType) => void;
  onRecordPayment: (doc: Document) => void;
  onSendReminder: (doc: Document) => void;
  onConvertToInvoice: (proformaDoc: Document) => void;
  onDeleteDoc: (docId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currencies,
  company,
  currentUser,
  driveAccessToken,
  activeTypeFilter = 'all',
  onViewDoc,
  onEditDoc,
  onOpenCreate,
  onRecordPayment,
  onSendReminder,
  onConvertToInvoice,
  onDeleteDoc,
}) => {
  const [selectedTab, setSelectedTab] = useState<DocumentType | 'all'>(activeTypeFilter);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Filter documents
  const filtered = documents.filter((doc) => {
    // Type tab
    if (selectedTab !== 'all' && doc.type !== selectedTab) return false;

    // Status filter
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = doc.documentNumber.toLowerCase().includes(q);
      const matchClient = (doc.clientCompany || '').toLowerCase().includes(q) || doc.clientName.toLowerCase().includes(q);
      const matchItem = doc.items.some((it) => it.description.toLowerCase().includes(q));
      if (!matchNum && !matchClient && !matchItem) return false;
    }

    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount_desc') return b.grandTotal - a.grandTotal;
    if (sortBy === 'amount_asc') return a.grandTotal - b.grandTotal;
    return 0;
  });

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Creation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Dispatch Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage tax invoices, proforma estimates, and goods delivery challans
          </p>
        </div>

        {currentUser.role !== 'auditor' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCreate('invoice')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
            <button
              onClick={() => onOpenCreate('proforma')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <span>+ Proforma</span>
            </button>
            <button
              onClick={() => onOpenCreate('challan')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <span>+ Challan</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Documents ({documents.length})
            </button>

            <button
              onClick={() => setSelectedTab('invoice')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTab === 'invoice'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoices ({documents.filter((d) => d.type === 'invoice').length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('proforma')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTab === 'proforma'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Proforma ({documents.filter((d) => d.type === 'proforma').length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('challan')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTab === 'challan'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Challans ({documents.filter((d) => d.type === 'challan').length})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700"
            >
              <option value="date_desc">Newest Date First</option>
              <option value="date_asc">Oldest Date First</option>
              <option value="amount_desc">Highest Value First</option>
              <option value="amount_asc">Lowest Value First</option>
            </select>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, client company, or line item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 w-full sm:w-auto"
            >
              <option value="all">All Payment Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Settled</option>
              <option value="overdue">Overdue Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Records List */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No documents match your query</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or create a new transaction.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Doc # / Nature</th>
                  <th className="py-3 px-4">Customer & Client</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Drive Sync</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((doc) => {
                  const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              doc.type === 'invoice'
                                ? 'bg-indigo-100 text-indigo-800'
                                : doc.type === 'proforma'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {doc.type === 'invoice' ? 'INV' : doc.type === 'proforma' ? 'PI' : 'DC'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {doc.documentNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {doc.items.length} line {doc.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{doc.clientCompany || doc.clientName}</div>
                        <div className="text-[11px] text-slate-500">{doc.clientName} • {doc.clientEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div>Issue: <span className="font-medium text-slate-800">{doc.date}</span></div>
                        <div className="text-[11px] text-slate-500">
                          Due: <span className="font-medium text-slate-700">{doc.dueDate}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${getBadgeStyle(doc.status)}`}>
                          {doc.status.toUpperCase()}
                        </span>
                        {doc.paidAmount > 0 && doc.status === 'partial' && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Paid: {formatCurrency(doc.paidAmount, doc.currency, currencies)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.driveViewLink ? (
                          <a
                            href={doc.driveViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>On Drive</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Local Only</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(doc.grandTotal, doc.currency, currencies)}
                        </div>
                        {balanceDue > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium">
                            Due: {formatCurrency(balanceDue, doc.currency, currencies)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewDoc(doc)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors"
                            title="View Document & Actions"
                          >
                            View
                          </button>

                          <button
                            onClick={() => downloadDocumentPdf(doc, company, currencies)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {doc.type === 'proforma' && onConvertToInvoice && currentUser.role !== 'auditor' && (
                            <button
                              onClick={() => onConvertToInvoice(doc)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded transition-colors"
                              title="Convert Proforma to Invoice"
                            >
                              <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                              Convert
                            </button>
                          )}

                          {doc.type === 'invoice' && balanceDue > 0 && currentUser.role !== 'auditor' && (
                            <button
                              onClick={() => onRecordPayment(doc)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded transition-colors"
                              title="Record Payment"
                            >
                              Pay
                            </button>
                          )}

                          {doc.type === 'invoice' && balanceDue > 0 && (
                            <button
                              onClick={() => onSendReminder(doc)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="Send Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete document ${doc.documentNumber}?`)) {
                                  onDeleteDoc(doc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden divide-y divide-slate-100 text-xs">
            {sorted.map((doc) => {
              const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);
              return (
                <div key={doc.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            doc.type === 'invoice'
                              ? 'bg-indigo-100 text-indigo-800'
                              : doc.type === 'proforma'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {doc.type === 'invoice' ? 'INV' : doc.type === 'proforma' ? 'PI' : 'DC'}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {doc.documentNumber}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 mt-1">{doc.clientCompany || doc.clientName}</div>
                      <div className="text-slate-500 text-[11px]">Due: {doc.dueDate}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm font-mono">
                        {formatCurrency(doc.grandTotal, doc.currency, currencies)}
                      </div>
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border mt-1 ${getBadgeStyle(doc.status)}`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {doc.driveViewLink ? (
                      <a
                        href={doc.driveViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Google Drive</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">Local Only</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadDocumentPdf(doc, company, currencies)}
                        className="p-1.5 text-slate-600 bg-slate-100 rounded"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {doc.type === 'invoice' && balanceDue > 0 && (
                        <button
                          onClick={() => onRecordPayment(doc)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium text-xs"
                        >
                          Pay
                        </button>
                      )}

                      <button
                        onClick={() => onViewDoc(doc)}
                        className="px-3 py-1 bg-slate-900 text-white rounded font-semibold text-xs"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
