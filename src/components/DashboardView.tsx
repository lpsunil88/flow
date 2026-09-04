import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, StaffUser } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { 
  IndianRupee, TrendingUp, AlertTriangle, CheckCircle2, FileText, 
  Truck, ArrowUpRight, Clock, Calendar, BarChart3, Plus, ArrowRight 
} from 'lucide-react';

interface DashboardViewProps {
  documents: Document[];
  currencies: CurrencyConfig[];
  company: CompanyProfile;
  currentUser: StaffUser;
  onOpenCreate: (type: 'invoice' | 'proforma' | 'challan') => void;
  onViewDoc: (doc: Document) => void;
  onNavigateToDocs: (filterType?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  currencies,
  company,
  currentUser,
  onOpenCreate,
  onViewDoc,
  onNavigateToDocs,
}) => {
  const [timePeriod, setTimePeriod] = useState<'all' | '30d' | '90d'>('all');

  // Filter documents based on period if needed
  const periodDocs = documents.filter((doc) => {
    if (timePeriod === 'all') return true;
    const docDate = new Date(doc.date).getTime();
    const now = Date.now();
    const days = timePeriod === '30d' ? 30 : 90;
    return now - docDate <= days * 24 * 60 * 60 * 1000;
  });

  // Calculate KPIs
  const invoices = periodDocs.filter((d) => d.type === 'invoice');
  const proformas = periodDocs.filter((d) => d.type === 'proforma');
  const challans = periodDocs.filter((d) => d.type === 'challan');

  // Normalize all currency totals to base currency using exchange rates for unified reporting
  const convertToBase = (amount: number, currCode: string) => {
    const baseCode = company.defaultCurrency || 'INR';
    if (currCode === baseCode) return amount;
    const baseConfig = currencies.find((c) => c.code === baseCode);
    const currConfig = currencies.find((c) => c.code === currCode);
    const baseRate = baseConfig?.exchangeRate || 1.0;
    const currRate = currConfig?.exchangeRate || 1.0;
    return (amount / currRate) * baseRate;
  };

  const totalInvoicedBase = invoices.reduce((acc, d) => acc + convertToBase(d.grandTotal, d.currency), 0);
  const totalPaidBase = invoices.reduce((acc, d) => acc + convertToBase(d.paidAmount, d.currency), 0);
  const outstandingBase = Math.max(0, totalInvoicedBase - totalPaidBase);

  // Overdue calculations
  const today = new Date().toISOString().split('T')[0];
  const overdueDocs = invoices.filter(
    (d) => (d.status === 'overdue' || (d.dueDate < today && d.paidAmount < d.grandTotal)) && d.status !== 'paid'
  );
  const totalOverdueBase = overdueDocs.reduce(
    (acc, d) => acc + convertToBase(d.grandTotal - d.paidAmount, d.currency),
    0
  );

  const totalProformaBase = proformas.reduce((acc, d) => acc + convertToBase(d.grandTotal, d.currency), 0);
  const openChallans = challans.filter((d) => d.challanDetails?.returnable);

  // Total Tax liability collected
  const totalTaxCollectedBase = invoices.reduce((acc, d) => acc + convertToBase(d.taxAmount, d.currency), 0);

  // Aging Analysis
  const aging = {
    current: 0,
    days1to15: 0,
    days16to30: 0,
    days30plus: 0,
  };

  invoices.forEach((d) => {
    const remaining = Math.max(0, d.grandTotal - d.paidAmount);
    if (remaining <= 0) return;
    const diffDays = Math.floor((Date.now() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const baseRem = convertToBase(remaining, d.currency);

    if (diffDays <= 0) aging.current += baseRem;
    else if (diffDays <= 15) aging.days1to15 += baseRem;
    else if (diffDays <= 30) aging.days16to30 += baseRem;
    else aging.days30plus += baseRem;
  });

  // Recent Transactions
  const recentDocs = [...documents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Dynamic monthly statistics for the last 4 months
  const monthlyStats = React.useMemo(() => {
    const result: { label: string; invoiced: number; collected: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const label = d.toLocaleString('default', { month: 'short' }) + (i === 0 ? ' (Current)' : '');

      const monthInvoices = invoices.filter((inv) => inv.date && inv.date.startsWith(monthKey));
      const invTotal = monthInvoices.reduce((acc, inv) => acc + convertToBase(inv.grandTotal, inv.currency), 0);
      const colTotal = monthInvoices.reduce((acc, inv) => acc + convertToBase(inv.paidAmount, inv.currency), 0);
      result.push({ label, invoiced: invTotal, collected: colTotal });
    }
    return result;
  }, [invoices, currencies]);

  const maxMonthlyVal = Math.max(...monthlyStats.map((m) => Math.max(m.invoiced, m.collected)), 1);

  const realizationRate = totalInvoicedBase > 0 
    ? Math.min(100, Math.round((totalPaidBase / totalInvoicedBase) * 100))
    : 0;

  const paidInvoices = invoices.filter((d) => d.status === 'paid' && d.payments && d.payments.length > 0);
  const avgCycleDays = paidInvoices.length > 0
    ? (
        paidInvoices.reduce((acc, d) => {
          const start = new Date(d.date).getTime();
          const end = new Date(d.payments[d.payments.length - 1].date).getTime();
          return acc + Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        }, 0) / paidInvoices.length
      ).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Real-Time Financial Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of invoicing, payment collections, aging receivables, and delivery movements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setTimePeriod('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                timePeriod === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimePeriod('90d')}
              className={`px-3 py-1 rounded-md transition-all ${
                timePeriod === '90d' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setTimePeriod('30d')}
              className={`px-3 py-1 rounded-md transition-all ${
                timePeriod === '30d' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalInvoicedBase, company.defaultCurrency, currencies)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>{invoices.length} tax invoices generated</span>
            </div>
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Collected</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">
              {formatCurrency(totalPaidBase, company.defaultCurrency, currencies)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
              <span>{totalInvoicedBase > 0 ? Math.round((totalPaidBase / totalInvoicedBase) * 100) : 0}% recovery rate</span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(outstandingBase, company.defaultCurrency, currencies)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <span>Pending customer settlements</span>
            </div>
          </div>
        </div>

        {/* Overdue Risk */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Alerts</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 tracking-tight">
              {formatCurrency(totalOverdueBase, company.defaultCurrency, currencies)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-semibold">
              <span>{overdueDocs.length} invoices past due</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Proforma Pipeline
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(totalProformaBase, company.defaultCurrency, currencies)}
            </span>
            <span className="text-[11px] text-slate-500 block">{proformas.length} quotes awaiting conversion</span>
          </div>
          <FileText className="w-8 h-8 text-amber-500 opacity-60" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Delivery Challans
            </span>
            <span className="text-lg font-bold text-slate-900">{challans.length} Dispatched</span>
            <span className="text-[11px] text-slate-500 block">{openChallans.length} returnable on trial</span>
          </div>
          <Truck className="w-8 h-8 text-teal-600 opacity-60" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Tax Collected (Liability)
            </span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(totalTaxCollectedBase, company.defaultCurrency, currencies)}
            </span>
            <span className="text-[11px] text-slate-500 block">Accrued across all regimes</span>
          </div>
          <BarChart3 className="w-8 h-8 text-indigo-500 opacity-60" />
        </div>
      </div>

      {/* Analytics & Aging Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Receivables Aging Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Receivables Aging Analysis
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">DUE WINDOWS</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 mb-4">
              Breakdown of pending receivables by days overdue
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-600">Current (Not Due Yet)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(aging.current, company.defaultCurrency, currencies)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${outstandingBase > 0 ? (aging.current / outstandingBase) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-600">1 - 15 Days Past Due</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(aging.days1to15, company.defaultCurrency, currencies)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${outstandingBase > 0 ? (aging.days1to15 / outstandingBase) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-600">16 - 30 Days Past Due</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(aging.days16to30, company.defaultCurrency, currencies)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${outstandingBase > 0 ? (aging.days16to30 / outstandingBase) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-600">30+ Days Critical</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(aging.days30plus, company.defaultCurrency, currencies)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-2 rounded-full"
                    style={{ width: `${outstandingBase > 0 ? (aging.days30plus / outstandingBase) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total Overdue:</span>
            <span className="font-bold text-rose-600">{formatCurrency(totalOverdueBase, company.defaultCurrency, currencies)}</span>
          </div>
        </div>

        {/* Visual Revenue Performance Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Revenue & Collection Efficiency
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Comparison of billed volume vs cash settlements
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-xs"></span>
                <span className="text-slate-600">Invoiced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
                <span className="text-slate-600">Collected</span>
              </div>
            </div>
          </div>

          {/* Dynamic Clean Bar Graph Representation */}
          {invoices.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-b border-slate-200 text-slate-400">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No invoice records yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Monthly revenue and collection metrics will appear automatically as you issue invoices and record settlements.
              </p>
            </div>
          ) : (
            <div className="h-44 flex items-end gap-6 pt-6 pb-2 px-4 border-b border-slate-200">
              {monthlyStats.map((m, idx) => {
                const invPct = Math.round((m.invoiced / maxMonthlyVal) * 100);
                const colPct = Math.round((m.collected / maxMonthlyVal) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      <div
                        className="w-1/2 bg-indigo-600 rounded-t min-h-[4px] transition-all"
                        style={{ height: `${Math.max(4, invPct)}%` }}
                        title={`${m.label} Invoiced: ${formatCurrency(m.invoiced, company.defaultCurrency, currencies)}`}
                      />
                      <div
                        className="w-1/2 bg-emerald-500 rounded-t min-h-[4px] transition-all"
                        style={{ height: `${Math.max(4, colPct)}%` }}
                        title={`${m.label} Collected: ${formatCurrency(m.collected, company.defaultCurrency, currencies)}`}
                      />
                    </div>
                    <span className={`text-[11px] font-medium truncate max-w-[70px] ${idx === 3 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <div>Average Payment Cycle: <span className="font-semibold text-slate-900">{avgCycleDays ? `${avgCycleDays} Days` : 'N/A (No closed cycles)'}</span></div>
            <div>Realization Rate: <span className="font-semibold text-emerald-600">{realizationRate}%</span></div>
          </div>
        </div>

      </div>

      {/* Recent Transactions Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Transactions & Dispatches
            </h3>
          </div>
          <button
            onClick={() => onNavigateToDocs()}
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <span>View All ({documents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No transaction records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create and issue your first invoice, proforma estimate, or delivery challan to track accounts.
            </p>
            {currentUser.role !== 'auditor' && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => onOpenCreate('invoice')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  + Create Invoice
                </button>
                <button
                  onClick={() => onOpenCreate('proforma')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  + Proforma
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg mt-0.5 ${
                  doc.type === 'invoice' ? 'bg-indigo-50 text-indigo-600' :
                  doc.type === 'proforma' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
                }`}>
                  {doc.type === 'invoice' ? <IndianRupee className="w-4 h-4" /> :
                   doc.type === 'proforma' ? <FileText className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{doc.documentNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-800">{doc.clientCompany || doc.clientName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Issued: {doc.date} • Due: {doc.dueDate} • By {doc.createdBy}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <div className="font-bold text-slate-900 text-sm">
                    {formatCurrency(doc.grandTotal, doc.currency, currencies)}
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      doc.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                      doc.status === 'partial' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onViewDoc(doc)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

    </div>
  );
};
