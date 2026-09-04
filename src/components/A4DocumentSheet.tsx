import React from 'react';
import { CompanyProfile, CurrencyConfig, Document } from '../types';
import { formatCurrency } from '../services/pdfGenerator';
import { formatAmountToWords, getStateDisplay } from '../utils/numberToWords';

interface A4DocumentSheetProps {
  document: Document;
  company: CompanyProfile;
  currencies?: CurrencyConfig[];
  watermarkText?: string;
  copyLabel?: string;
  purposeText?: string;
}

export const A4DocumentSheet: React.FC<A4DocumentSheetProps> = ({
  document: doc,
  company,
  currencies = [],
  watermarkText,
  copyLabel,
  purposeText,
}) => {
  // Determine state codes & names
  const consignorState = getStateDisplay(
    doc.dispatchAddress?.state || company.city,
    doc.dispatchAddress?.taxId || company.taxId,
    doc.dispatchAddress?.stateCode
  );

  const consigneeState = getStateDisplay(
    doc.shippingAddress?.state || doc.clientAddress,
    doc.shippingAddress?.taxId || doc.clientTaxId,
    doc.shippingAddress?.stateCode
  );

  // Default labels matching exact style
  const documentTitle =
    doc.type === 'challan'
      ? 'DELIVERY CHALLAN'
      : doc.type === 'invoice'
      ? 'TAX INVOICE'
      : 'PROFORMA INVOICE';

  const divisionText =
    company.department || 'CORPORATE MERCHANDISING DIVISION';

  const subtitleText =
    doc.type === 'challan'
      ? '(Goods transport for Job Work, Inter-Branch Transfer, Branding & Consignment Dispatch)'
      : doc.type === 'invoice'
      ? '(Issued under Section 31 of CGST Act, 2017 & Tax Invoice Rules)'
      : '(Proforma Invoice & Commercial Quotation for Advance Acceptance)';

  const defaultCopyLabel =
    copyLabel ||
    (doc.type === 'challan'
      ? 'ORIGINAL FOR CONSIGNEE'
      : doc.type === 'invoice'
      ? 'ORIGINAL FOR RECIPIENT'
      : 'CUSTOMER COPY');

  const defaultPurpose =
    purposeText ||
    (doc.type === 'challan'
      ? 'STOCK TRANSFER'
      : doc.type === 'invoice'
      ? 'OUTWARD TAXABLE SUPPLY'
      : 'COMMERCIAL QUOTATION');

  const legalDeclaration =
    doc.type === 'challan'
      ? 'Certified that particulars given above are true and correct and goods are dispatched under Rule 55 of CGST Rules, 2017 without sale.'
      : doc.type === 'invoice'
      ? 'Certified that particulars given above are true and correct and this invoice depicts the actual price of the goods or services described under Section 31 of CGST Act, 2017.'
      : 'This proforma invoice is an official quotation. Prices, taxes, and dispatch terms are subject to final order confirmation.';

  const defaultWatermark = watermarkText || (doc.type === 'challan' ? 'ORIGINAL' : doc.type === 'invoice' ? 'TAX INVOICE' : 'PROFORMA');

  // Total items calculation
  const totalQuantity = doc.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  // Formatted date string with optional time
  const formattedDateTime = doc.date ? `${doc.date} (01:09 PM)` : '2026-09-04 (01:09 PM)';

  // Determine Initials for monogram
  const monogram = company.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'SC';

  // Tax breakdown (IGST vs CGST + SGST)
  const isInterState = doc.igstAmount && doc.igstAmount > 0;
  const halfTax = doc.taxAmount / 2;
  const cgstVal = doc.cgstAmount ?? halfTax;
  const sgstVal = doc.sgstAmount ?? halfTax;

  const signatoryName =
    doc.authorizedSignatoryName ||
    company.authorizedSignatoryName ||
    'Sunil Kumar';

  return (
    <div
      id="a4-printable-sheet"
      className="a4-sheet-container w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 shadow-xl border border-slate-200 p-8 sm:p-10 relative font-sans text-xs box-border print:border-none print:shadow-none print:p-6 print:w-[210mm] print:min-h-[297mm] print:m-0"
      style={{
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle Background Watermark */}
      <div
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.04] z-0 overflow-hidden"
        aria-hidden="true"
      >
        <span className="text-slate-900 font-black text-8xl md:text-9xl uppercase tracking-widest rotate-[-30deg]">
          {defaultWatermark}
        </span>
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-[275mm]">
        {/* TOP SECTION */}
        <div>
          {/* Top Document Category & Title Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <div className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                {divisionText}
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none mt-0.5">
                {documentTitle}
              </h1>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                {subtitleText}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {defaultCopyLabel}
              </div>
              <div className="text-[11.5px] text-slate-800 mt-0.5">
                <span className="text-slate-500 font-medium">Purpose: </span>
                <strong className="font-bold text-slate-950">{defaultPurpose}</strong>
              </div>
            </div>
          </div>

          {/* Solid Thick Horizontal Divider */}
          <div className="h-[2.5px] bg-slate-950 w-full mt-2 mb-3" />

          {/* Company Profile Header */}
          <div className="space-y-1">
            <div className="flex items-start gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-10 h-10 object-contain rounded border border-slate-200 p-0.5 shrink-0 bg-white"
                />
              ) : (
                <div className="w-10 h-10 rounded border border-amber-300 bg-amber-50 text-amber-500 font-bold text-lg flex items-center justify-center shrink-0">
                  {monogram}
                </div>
              )}

              <div>
                <h2 className="text-base font-black text-slate-950 leading-tight">
                  {company.name || 'Sutraa Creations Private Limited'}
                </h2>
                <div className="text-[11px] text-slate-600 font-medium">
                  {company.name || 'Sutraa Creations Private Limited'}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-700 leading-snug pt-1">
              <div>
                <strong className="font-semibold text-slate-900">Regd. Office:</strong>{' '}
                {company.address || 'B-4, Ashok Guruprasad CHS Hanuman Road'},{' '}
                {company.city || 'Vileparle East, Mumbai - 400057, Maharashtra'}
              </div>

              <div className="flex flex-wrap gap-x-4 pt-0.5">
                <span>
                  <strong className="font-semibold text-slate-900">GSTIN:</strong>{' '}
                  <span className="font-mono">{company.taxId || '27AAGCS6232B1ZM'}</span>
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">PAN:</strong>{' '}
                  <span className="font-mono">
                    {company.taxId && company.taxId.length >= 12
                      ? company.taxId.substring(2, 12)
                      : 'AAGCS6232B'}
                  </span>
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">CIN:</strong>{' '}
                  <span className="font-mono">{company.cin || ''}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 text-slate-700 pt-0.5">
                <span>
                  <strong className="font-semibold text-slate-900">Phone:</strong>{' '}
                  {company.phone || '+917840069490'}
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Email:</strong>{' '}
                  {company.email || 'sunil@sutraa.in'}
                </span>
                <span>•</span>
                <span>
                  <strong className="font-semibold text-slate-900">State:</strong>{' '}
                  {consignorState.name} ({consignorState.code})
                </span>
              </div>
            </div>
          </div>

          {/* Thin separator line */}
          <div className="h-[1px] bg-slate-200 w-full my-2.5" />

          {/* 4-Column Metadata Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 text-[11px]">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {doc.type === 'challan'
                  ? 'CHALLAN NUMBER:'
                  : doc.type === 'invoice'
                  ? 'INVOICE NUMBER:'
                  : 'PROFORMA NUMBER:'}
              </div>
              <div className="font-bold text-slate-950 font-mono mt-0.5">
                {doc.documentNumber || 'SCPL/26-27/DC-0004'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {doc.type === 'challan'
                  ? 'CHALLAN DATE & TIME:'
                  : doc.type === 'invoice'
                  ? 'INVOICE DATE & TIME:'
                  : 'PROFORMA DATE & TIME:'}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {formattedDateTime}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {doc.type === 'challan'
                  ? 'E-WAY BILL NO:'
                  : doc.type === 'invoice'
                  ? 'DUE DATE:'
                  : 'VALIDITY PERIOD:'}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {doc.type === 'challan'
                  ? doc.challanDetails?.deliveryNote || 'N/A'
                  : doc.dueDate || 'N/A'}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {doc.type === 'challan'
                  ? 'VEHICLE NUMBER:'
                  : doc.type === 'invoice'
                  ? 'VEHICLE / REF:'
                  : 'REF / ORDER NO:'}
              </div>
              <div className="font-semibold text-slate-900 mt-0.5">
                {doc.challanDetails?.vehicleNo || 'N/A'}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 w-full mb-3" />

          {/* Consignor (Dispatch Location) & Consignee (Recipient) Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Consignor Card */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-white text-[11px] space-y-1 shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1 text-[10px] font-bold text-slate-700">
                <span className="uppercase tracking-wider">
                  {doc.type === 'invoice' ? 'SELLER (DISPATCH LOCATION)' : 'CONSIGNOR (DISPATCH LOCATION)'}
                </span>
                <span className="font-mono text-slate-900">
                  STATE: {consignorState.code}
                </span>
              </div>

              <div className="font-bold text-slate-950 text-[11.5px] pt-0.5">
                {doc.dispatchAddress?.name || company.name}
              </div>

              <div className="text-slate-600 leading-tight">
                {doc.dispatchAddress?.address || company.address || 'D-39 Sector 2 Noida Uttar Pradesh'}
              </div>
              <div className="text-slate-600">
                {doc.dispatchAddress?.city || company.city || 'Noida'} -{' '}
                {doc.dispatchAddress?.pincode || '201301'}, {consignorState.name}
              </div>

              <div className="text-slate-900 pt-0.5">
                <strong className="font-semibold">GSTIN:</strong>{' '}
                <span className="font-mono">
                  {doc.dispatchAddress?.taxId || company.taxId || '27AAGCS6232B1ZM'}
                </span>
              </div>

              <div className="text-slate-700">
                <strong className="font-semibold">Contact:</strong>{' '}
                {doc.dispatchAddress?.phone
                  ? `${doc.dispatchAddress.name || 'Dispatch Manager'} (${doc.dispatchAddress.phone})`
                  : company.phone
                  ? `Sunil Kumar (${company.phone})`
                  : 'Sunil Kumar (7840069490)'}
              </div>
            </div>

            {/* Consignee Card */}
            <div className="border border-slate-300 rounded-lg p-2.5 bg-white text-[11px] space-y-1 shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1 text-[10px] font-bold text-slate-700">
                <span className="uppercase tracking-wider">
                  {doc.type === 'invoice' ? 'BUYER (BILLED TO)' : 'CONSIGNEE (RECIPIENT)'}
                </span>
                <span className="font-mono text-slate-900">
                  STATE: {consigneeState.code}
                </span>
              </div>

              <div className="font-bold text-slate-950 text-[11.5px] pt-0.5">
                {doc.shippingAddress?.company || doc.clientCompany || doc.clientName || 'Sutraa Creations Private Limited'}
                {doc.shippingAddress?.company && doc.shippingAddress.company !== doc.clientName && (
                  <span className="text-slate-500 font-normal"> ({doc.clientName})</span>
                )}
              </div>

              <div className="text-slate-600 leading-tight">
                {doc.shippingAddress?.address || doc.clientAddress || 'B-4, Ashok Guruprasad CHS Ltd, Hanuman Road, Vile Parle (E)'}
              </div>
              <div className="text-slate-600">
                {doc.shippingAddress?.city || 'Mumbai'} -{' '}
                {doc.shippingAddress?.pincode || '400057'}, {consigneeState.name}
              </div>

              <div className="text-slate-900 pt-0.5">
                <strong className="font-semibold">GSTIN:</strong>{' '}
                <span className="font-mono">{doc.shippingAddress?.taxId || doc.clientTaxId || '27AAGCS6232B1ZM'}</span>
              </div>

              <div className="text-slate-700">
                <strong className="font-semibold">Place of Supply:</strong>{' '}
                <span>{consigneeState.code}-{consigneeState.name}</span>
              </div>
            </div>
          </div>

          {/* Transport / Logistics Details Strip */}
          <div className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-[10.5px] text-slate-700 flex flex-wrap justify-between items-center gap-2 mb-3 shadow-2xs">
            <div>
              <span className="text-slate-500 font-medium">Transport Mode: </span>
              <strong className="font-semibold text-slate-900">{doc.challanDetails?.dispatchThrough || 'Road'}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Transporter: </span>
              <strong className="font-semibold text-slate-900">{doc.challanDetails?.deliveryNote || '-'}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">LR/GR No & Date: </span>
              <strong className="font-semibold text-slate-900">{doc.challanDetails?.receivedBy || 'Direct Handover'}</strong>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Driver/Contact: </span>
              <strong className="font-semibold text-slate-900">Authorized Fleet</strong>
            </div>
          </div>

          {/* Merchandise Goods Items Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white mb-3">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50/70 text-[10px] font-bold text-slate-800">
                  <th className="py-2 px-2 text-center w-8 border-r border-slate-300">#</th>
                  <th className="py-2 px-3 border-r border-slate-300">
                    {doc.type === 'challan'
                      ? 'Description of Merchandise Goods'
                      : 'Description of Goods / Services'}
                  </th>
                  <th className="py-2 px-2 text-center w-24 border-r border-slate-300">HSN/SAC</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-300">Qty</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-slate-300">UOM</th>
                  <th className="py-2 px-2 text-right w-20 border-r border-slate-300">Rate (₹)</th>
                  <th className="py-2 px-2 text-right w-24 border-r border-slate-300">Taxable Val (₹)</th>
                  <th className="py-2 px-2 text-right w-24 border-r border-slate-300">
                    {isInterState ? 'IGST (₹)' : 'Tax (₹)'}
                  </th>
                  <th className="py-2 px-2 text-right w-24">Total (₹)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {doc.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No items added to document.
                    </td>
                  </tr>
                ) : (
                  doc.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-2 text-center text-slate-600 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{item.description}</div>
                        <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">
                          SKU: {item.hsnCode ? `PS-${item.hsnCode}` : 'PS-GIFTSET'}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-200">
                        {item.hsnCode || '42023120'}
                      </td>

                      <td className="py-2.5 px-2 text-center font-semibold text-slate-900 border-r border-slate-200">
                        {item.quantity}
                      </td>

                      <td className="py-2.5 px-2 text-center uppercase text-slate-600 font-medium border-r border-slate-200">
                        {item.unit || 'PCS'}
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900 border-r border-slate-200">
                        ₹{item.amount.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono text-slate-700 border-r border-slate-200">
                        ₹{item.taxAmount.toFixed(2)}{' '}
                        <span className="text-[9.5px] text-slate-500">({item.taxRate}%)</span>
                      </td>

                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-950">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}

                {/* TOTAL ITEMS / QUANTITY ROW */}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-[11px] text-slate-900">
                  <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-wider border-r border-slate-300">
                    TOTAL ITEMS / QUANTITY:
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-slate-950 border-r border-slate-300">
                    {totalQuantity}
                  </td>
                  <td className="border-r border-slate-300"></td>
                  <td className="border-r border-slate-300"></td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950 border-r border-slate-300">
                    ₹{doc.subtotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950 border-r border-slate-300">
                    ₹{doc.taxAmount.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-950">
                    ₹{doc.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 my-3">
            {/* Left 7 Columns: Words & Purpose */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  AMOUNT CHARGEABLE IN WORDS:
                </div>
                <div className="font-bold italic text-[11.5px] text-slate-800 mt-0.5">
                  {formatAmountToWords(doc.grandTotal, doc.currency)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  PURPOSE / REMARKS:
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5 leading-relaxed">
                  {doc.notes ||
                    (doc.type === 'challan'
                      ? 'Stock transfer / Dispatch for corporate delivery'
                      : 'Commercial delivery & corporate merchandising dispatch')}
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Totals Box */}
            <div className="sm:col-span-5 bg-white rounded-lg p-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Total Taxable Value:</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{doc.subtotal.toFixed(2)}
                </span>
              </div>

              {isInterState ? (
                <div className="flex justify-between text-slate-700">
                  <span>Total IGST:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{doc.taxAmount.toFixed(2)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Total CGST:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{cgstVal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Total SGST:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{sgstVal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              {doc.shippingCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Shipping & Handling:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{doc.shippingCharges.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-bold text-slate-950 border-t-2 border-b-2 border-slate-950 py-1.5 mt-1">
                <span>Grand Total:</span>
                <span className="font-mono text-base">₹{doc.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Declarations, Terms & Signatures Box */}
          <div className="border border-slate-300 rounded-lg p-3 bg-white grid grid-cols-1 sm:grid-cols-12 gap-4 shadow-2xs">
            {/* Terms & Certification (7 Columns) */}
            <div className="sm:col-span-7 space-y-2 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-3">
              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  DECLARATION & TERMS:
                </div>
                <p className="text-[10px] italic text-slate-600 leading-tight mt-0.5">
                  {legalDeclaration}
                </p>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5">
                <div>• All matters are subject to {company.city || 'Mumbai'} Jurisdiction</div>
                <div>
                  • For Electronic Fund Transfer: {company.bankDetails?.bankName ? `${company.bankDetails.bankName} (A/C: ${company.bankDetails.accountNumber} | IFSC: ${company.bankDetails.ifscSwift})` : 'RTGS/NEFT/UPI Available'}
                </div>
                {company.bankDetails?.upiId && (
                  <div>• UPI Digital Handle: {company.bankDetails.upiId}</div>
                )}
              </div>
            </div>

            {/* Authorized Signatory Block (5 Columns) */}
            <div className="sm:col-span-5 flex flex-col justify-between text-right pl-0 sm:pl-2">
              <div>
                <div className="text-[10.5px] font-bold text-slate-950 uppercase tracking-tight">
                  FOR {company.name || 'SUTRAA CREATIONS PRIVATE LIMITED'}
                </div>
                <div className="text-[9.5px] text-slate-500 font-medium">
                  Authorized Signatory
                </div>
              </div>

              {/* Signatures Dual Lines */}
              <div className="pt-8 flex justify-between items-end gap-2 text-center text-[9.5px] text-slate-600">
                <div className="flex-1">
                  <div className="border-t border-slate-400 pt-1 text-slate-700">
                    Receiver's Signature
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-[10px] mb-0.5">
                    {signatoryName}
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-slate-700">
                    Authorized signatory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Most Computer Generated Notice */}
        <div className="text-center text-[9.5px] text-slate-500 pt-4 pb-1">
          This is a computer-generated {doc.type === 'challan' ? 'delivery challan' : doc.type === 'invoice' ? 'tax invoice' : 'proforma invoice'} issued for corporate merchandising operations.
        </div>
      </div>
    </div>
  );
};
