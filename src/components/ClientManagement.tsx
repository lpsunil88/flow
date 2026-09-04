import React, { useState } from 'react';
import { Client, CurrencyConfig, Document, StaffUser } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { fetchGstDetails } from '../services/gstService';
import { 
  Plus, Search, Building2, Mail, Phone, MapPin, FileText, 
  ExternalLink, Edit, Trash2, X, Download, UserCheck, ShieldAlert,
  Sparkles, Loader2 
} from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  documents: Document[];
  currencies: CurrencyConfig[];
  currentUser: StaffUser;
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onCreateDocForClient: (client: Client) => void;
  onViewDoc: (doc: Document) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  documents,
  currencies,
  currentUser,
  onSaveClient,
  onDeleteClient,
  onCreateDocForClient,
  onViewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFetchGstInModal = async () => {
    if (!editingClient || !editingClient.taxId?.trim()) return;
    setIsFetchingGst(true);
    setGstFeedback(null);

    try {
      const d = await fetchGstDetails(editingClient.taxId.trim());
      setIsFetchingGst(false);

      setEditingClient({
        ...editingClient,
        company: d.legalName,
        name: editingClient.name || d.tradeName || d.legalName,
        taxId: d.gstin,
        address: `${d.address}, ${d.city}, ${d.stateName} - ${d.pincode}`,
        currency: 'INR',
        notes: editingClient.notes 
          ? `${editingClient.notes} | Auto-fetched from GSTIN (${d.taxpayerType}, Status: ${d.status})` 
          : `Auto-fetched from GSTIN ${d.gstin} (${d.taxpayerType}, Status: ${d.status})`,
      });
      setGstFeedback({
        type: 'success',
        message: `Successfully verified and populated: ${d.tradeName || d.legalName} (${d.stateName})`,
      });
    } catch (err: any) {
      setIsFetchingGst(false);
      setGstFeedback({
        type: 'error',
        message: err.message || 'Could not verify GSTIN details. Please check the 15-character number.',
      });
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.taxId && c.taxId.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingClient({
      id: `client-${Date.now()}`,
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      currency: 'USD',
      notes: '',
      totalBilled: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (c: Client) => {
    setEditingClient(c);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    onSaveClient(editingClient);
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const exportClientsCsv = () => {
    const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Address', 'Tax ID', 'Currency', 'Total Billed', 'Outstanding Balance'];
    const rows = clients.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.company}"`,
      c.email,
      `"${c.phone}"`,
      `"${c.address}"`,
      c.taxId,
      c.currency,
      c.totalBilled,
      c.outstandingBalance,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Clients_Database_${new Date().toISOString().split('T')[0]}.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const clientDocs = selectedClientForHistory
    ? documents.filter((d) => d.clientId === selectedClientForHistory.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Client Database & Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client profiles, tax identifiers, billing currencies, and outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportClientsCsv}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {currentUser.role !== 'auditor' && (
            <button
              onClick={handleOpenAdd}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by client name, company, email, or tax ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No clients found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm 
              ? 'No client matching your search query was found. Try clearing your search.' 
              : 'Add your business clients and customer contacts to start issuing invoices, dispatch challans, and tracking accounts.'}
          </p>
          {currentUser.role !== 'auditor' && !searchTerm && (
            <button
              onClick={handleOpenAdd}
              type="button"
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
            >
              + Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
          // Dynamic calculation of outstanding from actual documents
          const clientInvoices = documents.filter((d) => d.clientId === client.id && d.type === 'invoice');
          const totalBilledCalc = clientInvoices.reduce((acc, d) => acc + d.grandTotal, 0);
          const totalPaidCalc = clientInvoices.reduce((acc, d) => acc + d.paidAmount, 0);
          const outstandingCalc = Math.max(0, totalBilledCalc - totalPaidCalc);

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{client.company || client.name}</h3>
                    {client.company && <p className="text-xs text-slate-500">{client.name}</p>}
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded">
                    {client.currency}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email || 'No email registered'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{client.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">Tax ID: {client.taxId || 'N/A'}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-start gap-2 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial Balance Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Invoiced</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(totalBilledCalc, client.currency, currencies)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Outstanding</span>
                    <span className={`font-bold ${outstandingCalc > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(outstandingCalc, client.currency, currencies)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForHistory(client)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>History ({clientInvoices.length})</span>
                </button>

                <div className="flex items-center gap-1">
                  {currentUser.role !== 'auditor' && (
                    <button
                      type="button"
                      onClick={() => onCreateDocForClient(client)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded transition-colors"
                      title="Create Invoice for client"
                    >
                      + Bill
                    </button>
                  )}

                  {currentUser.role !== 'auditor' && (
                    <button
                      type="button"
                      onClick={() => handleEdit(client)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete client ${client.name}?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Edit / Add Client Modal */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingClient.name ? 'Edit Client Profile' : 'Add New Client'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={editingClient.company}
                    onChange={(e) => setEditingClient({ ...editingClient, company: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">GSTIN / Tax ID</label>
                    <button
                      type="button"
                      disabled={isFetchingGst || !editingClient.taxId?.trim()}
                      onClick={handleFetchGstInModal}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 disabled:opacity-40"
                    >
                      {isFetchingGst ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                      <span>Auto-Fetch Details</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 27AAACR7055N1ZO"
                    value={editingClient.taxId}
                    onChange={(e) => {
                      setEditingClient({ ...editingClient, taxId: e.target.value.toUpperCase() });
                      if (gstFeedback) setGstFeedback(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                    <span>Try sample:</span>
                    <button
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, taxId: '27AAACR7055N1ZO' })}
                      className="underline text-indigo-600 hover:text-indigo-800 font-mono"
                    >
                      Reliance
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, taxId: '27AAACT2727Q1ZW' })}
                      className="underline text-indigo-600 hover:text-indigo-800 font-mono"
                    >
                      Tata
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditingClient({ ...editingClient, taxId: '29AABCI0249K1Z4' })}
                      className="underline text-indigo-600 hover:text-indigo-800 font-mono"
                    >
                      Infosys
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Currency</label>
                  <select
                    value={editingClient.currency}
                    onChange={(e) => setEditingClient({ ...editingClient, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {gstFeedback && (
                <div className={`p-2.5 rounded-lg border text-xs ${
                  gstFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {gstFeedback.message}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing & Shipping Address</label>
                <textarea
                  rows={2}
                  value={editingClient.address}
                  onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Notes / Special Terms</label>
                <input
                  type="text"
                  placeholder="e.g. Net 30 terms, dispatch challan required"
                  value={editingClient.notes || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md shadow-xs"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Transaction History Drawer */}
      {selectedClientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Client History: {selectedClientForHistory.company || selectedClientForHistory.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedClientForHistory.email} • {selectedClientForHistory.taxId || 'No Tax ID'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {clientDocs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No documents found for this client yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Doc #</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Due</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-semibold text-slate-900">{doc.documentNumber}</td>
                          <td className="p-3 uppercase text-[11px] font-bold text-slate-600">{doc.type}</td>
                          <td className="p-3 text-slate-600">{doc.date}</td>
                          <td className="p-3 text-slate-600">{doc.dueDate}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              doc.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              doc.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                              doc.status === 'partial' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatCurrency(doc.grandTotal, doc.currency, currencies)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClientForHistory(null);
                                onViewDoc(doc);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
