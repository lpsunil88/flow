import React, { useState } from 'react';
import { CompanyProfile, CurrencyConfig, Document, PaymentMethod, PaymentRecord } from '../types';
import { formatCurrency, getCurrencySymbol } from '../services/pdfGenerator';
import { CreditCard, X, Calendar, Hash, FileText } from 'lucide-react';

interface RecordPaymentModalProps {
  document: Document;
  company: CompanyProfile;
  currencies: CurrencyConfig[];
  currentUserName: string;
  onClose: () => void;
  onSavePayment: (docId: string, payment: PaymentRecord) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  document: doc,
  currencies,
  currentUserName,
  onClose,
  onSavePayment,
}) => {
  const remaining = Math.max(0, doc.grandTotal - doc.paidAmount);
  const [amount, setAmount] = useState<number>(remaining);
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date,
      amount: Number(amount),
      method,
      reference: reference.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      notes: notes.trim(),
      recordedBy: currentUserName,
    };

    onSavePayment(doc.id, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Record Client Payment</h3>
              <p className="text-xs text-slate-300">
                {doc.documentNumber} • {doc.clientCompany || doc.clientName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-sm">
            <div>
              <div className="text-xs text-slate-500">Total Invoiced</div>
              <div className="font-semibold text-slate-900">{formatCurrency(doc.grandTotal, doc.currency, currencies)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Remaining Balance</div>
              <div className="font-bold text-emerald-700">{formatCurrency(remaining, doc.currency, currencies)}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Amount ({doc.currency})
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-bold">
                {getCurrencySymbol(doc.currency || 'INR', currencies)}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining * 1.5}
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-base"
              />
            </div>
            {amount === remaining && (
              <p className="text-xs text-emerald-600 mt-1">Full settlement selected</p>
            )}
            {amount < remaining && amount > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Partial payment — remaining will be {formatCurrency(remaining - amount, doc.currency, currencies)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bank_transfer">Bank Transfer / Wire / NEFT</option>
                <option value="upi">UPI / Instant Pay</option>
                <option value="credit_card">Credit / Debit Card</option>
                <option value="cheque">Cheque / Demand Draft</option>
                <option value="cash">Cash Settlement</option>
                <option value="other">Other / Digital Gateway</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-9982310, CHQ#441029, Stripe txn"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Internal Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared in SVB corporate account"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
