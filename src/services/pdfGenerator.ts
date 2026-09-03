import { jsPDF } from 'jspdf';
import { CompanyProfile, CurrencyConfig, Document } from '../types';
import { getThemeForDocument } from './themeEngine';

export function getCurrencySymbol(code: string, currencies: CurrencyConfig[]): string {
  const found = currencies.find((c) => c.code === code);
  return found ? found.symbol : code;
}

export function formatCurrency(amount: number, currencyCode: string, currencies: CurrencyConfig[]): string {
  const symbol = getCurrencySymbol(currencyCode, currencies);
  return `${symbol} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): jsPDF {
  const defaultCompanyTheme =
    doc.type === 'invoice'
      ? company.invoiceTheme
      : doc.type === 'proforma'
      ? company.proformaTheme
      : company.challanTheme;

  const theme = getThemeForDocument(doc.type, doc.theme, defaultCompanyTheme);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Header Banner Background with Theme HeaderBg
  pdf.setFillColor(theme.headerBg[0], theme.headerBg[1], theme.headerBg[2]);
  pdf.rect(margin, y, contentWidth, 36, 'F');
  pdf.setDrawColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
  pdf.setLineWidth(0.4);
  pdf.rect(margin, y, contentWidth, 36, 'S');

  let textX = margin + 5;
  const hasLogo = Boolean(company.logoUrl);

  if (hasLogo) {
    try {
      // Draw company logo
      pdf.addImage(company.logoUrl!, 'JPEG', margin + 4, y + 4, 28, 28);
      textX = margin + 36;
    } catch {
      // If image format fails (e.g. SVG or CORS on external URL), render styled monogram badge
      pdf.setFillColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
      pdf.roundedRect(margin + 4, y + 4, 28, 28, 2, 2, 'F');
      pdf.setFont(theme.fontFamily, 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      const initials = company.name.substring(0, 2).toUpperCase();
      pdf.text(initials, margin + 18, y + 21, { align: 'center' });
      textX = margin + 36;
    }
  }

  // Company Name & Info
  pdf.setFont(theme.fontFamily, 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
  pdf.text(company.name, textX, y + 8);

  pdf.setFont(theme.fontFamily, 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105); // slate-600
  const compAddr = `${company.address}, ${company.city}, ${company.country}`;
  pdf.text(compAddr, textX, y + 14);
  pdf.text(`Tax ID / GSTIN: ${company.taxId} | Tel: ${company.phone}`, textX, y + 19);
  pdf.text(`Email: ${company.email} | Web: ${company.website}`, textX, y + 24);

  // Document Type & Number (Right side)
  const docTypeLabel =
    doc.type === 'invoice'
      ? 'TAX INVOICE'
      : doc.type === 'proforma'
      ? 'PROFORMA INVOICE'
      : 'DELIVERY CHALLAN';

  // Badge background using theme badgeBg
  pdf.setFillColor(theme.badgeBg[0], theme.badgeBg[1], theme.badgeBg[2]);
  pdf.rect(pageWidth - margin - 60, y + 5, 55, 9, 'F');
  pdf.setFont(theme.fontFamily, 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(theme.badgeTextColor[0], theme.badgeTextColor[1], theme.badgeTextColor[2]);
  pdf.text(docTypeLabel, pageWidth - margin - 32.5, y + 11, { align: 'center' });

  // Doc Number
  pdf.setFont(theme.fontFamily, 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.documentNumber, pageWidth - margin - 5, y + 20, { align: 'right' });

  pdf.setFont(theme.fontFamily, 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Issue Date: ${doc.date}`, pageWidth - margin - 5, y + 26, { align: 'right' });
  pdf.text(`Due Date: ${doc.dueDate}`, pageWidth - margin - 5, y + 31, { align: 'right' });

  y += 38;

  // Challan Delivery info if challan
  if (doc.type === 'challan' && doc.challanDetails) {
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(margin, y, contentWidth, 14, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('DISPATCH / LOGISTICS DETAILS:', margin + 4, y + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const vehicleText = doc.challanDetails.vehicleNo ? `Vehicle: ${doc.challanDetails.vehicleNo}` : '';
    const modeText = doc.challanDetails.dispatchThrough ? `Dispatch Via: ${doc.challanDetails.dispatchThrough}` : '';
    const returnText = doc.challanDetails.returnable ? 'Type: Returnable Challan' : 'Type: Non-Returnable Challan';
    pdf.text(`${vehicleText}   |   ${modeText}   |   ${returnText}`, margin + 4, y + 10);
    y += 18;
  }

  // Bill To / Client Details Box
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, y, contentWidth / 2 - 2, 30, 'S');
  pdf.rect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 30, 'S');

  // Left: Bill To
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('BILL TO / CLIENT:', margin + 4, y + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.clientCompany || doc.clientName, margin + 4, y + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Attn: ${doc.clientName}`, margin + 4, y + 17);
  pdf.text(`Email: ${doc.clientEmail} | Tel: ${doc.clientPhone}`, margin + 4, y + 22);
  pdf.text(`Address: ${doc.clientAddress}`, margin + 4, y + 27);

  // Right: Tax & Status Info
  const rightX = margin + contentWidth / 2 + 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('TRANSACTION DETAILS:', rightX, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Customer Tax ID / GSTIN: ${doc.clientTaxId || 'N/A'}`, rightX, y + 12);
  pdf.text(`Billing Currency: ${doc.currency}`, rightX, y + 17);
  pdf.text(`Payment Status: ${doc.status.toUpperCase()}`, rightX, y + 22);
  pdf.text(`Amount Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)}`, rightX, y + 27);

  y += 34;

  // Table Headers
  const colX = {
    idx: margin,
    desc: margin + 8,
    hsn: margin + 78,
    qty: margin + 102,
    rate: margin + 122,
    tax: margin + 147,
    total: margin + 165,
  };

  pdf.setFillColor(theme.tableHeaderBg[0], theme.tableHeaderBg[1], theme.tableHeaderBg[2]);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setFont(theme.fontFamily, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(theme.tableHeaderTextColor[0], theme.tableHeaderTextColor[1], theme.tableHeaderTextColor[2]);

  pdf.text('#', colX.idx + 2, y + 5.5);
  pdf.text('ITEM & DESCRIPTION', colX.desc, y + 5.5);
  pdf.text('HSN/SAC', colX.hsn, y + 5.5);
  pdf.text('QTY', colX.qty, y + 5.5);
  pdf.text('UNIT PRICE', colX.rate, y + 5.5);
  pdf.text('TAX', colX.tax, y + 5.5);
  pdf.text('AMOUNT', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  pdf.setFont(theme.fontFamily, 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);

  doc.items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 8, 'F');
    }

    pdf.text(`${index + 1}`, colX.idx + 2, y + 5.5);
    
    // Split long description if needed
    const truncatedDesc = item.description.length > 40 ? item.description.substring(0, 37) + '...' : item.description;
    pdf.text(truncatedDesc, colX.desc, y + 5.5);

    pdf.text(item.hsnCode || '-', colX.hsn, y + 5.5);
    pdf.text(`${item.quantity} ${item.unit || 'pcs'}`, colX.qty, y + 5.5);
    pdf.text(formatCurrency(item.unitPrice, doc.currency, currencies), colX.rate, y + 5.5);
    pdf.text(`${item.taxRate}%`, colX.tax, y + 5.5);
    pdf.text(formatCurrency(item.total, doc.currency, currencies), pageWidth - margin - 3, y + 5.5, { align: 'right' });

    y += 8;
  });

  // Table border line
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Summary & Banking Section
  const summaryBoxWidth = 75;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  // Left Side: Banking Details & Payment Instructions
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(margin, y, contentWidth - summaryBoxWidth - 6, 44, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('BANKING & PAYMENT INSTRUCTIONS:', margin + 4, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Bank: ${company.bankDetails.bankName}`, margin + 4, y + 12);
  pdf.text(`Account Name: ${company.bankDetails.accountName}`, margin + 4, y + 17);
  pdf.text(`Account No: ${company.bankDetails.accountNumber}`, margin + 4, y + 22);
  pdf.text(`SWIFT / IFSC: ${company.bankDetails.ifscSwift}`, margin + 4, y + 27);
  pdf.text(`UPI ID: ${company.bankDetails.upiId}`, margin + 4, y + 32);
  pdf.text('Please include invoice number in payment remarks.', margin + 4, y + 39);

  // Right Side: Totals
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Subtotal:', summaryX, y + 6);
  pdf.text(formatCurrency(doc.subtotal, doc.currency, currencies), pageWidth - margin, y + 6, { align: 'right' });

  if (doc.discountTotal > 0) {
    pdf.text('Discount:', summaryX, y + 12);
    pdf.text(`- ${formatCurrency(doc.discountTotal, doc.currency, currencies)}`, pageWidth - margin, y + 12, { align: 'right' });
  }

  // Tax Row
  const taxLabel = doc.taxType === 'gst' ? 'GST Total' : doc.taxType === 'vat' ? 'VAT Total' : 'Sales Tax';
  pdf.text(`${taxLabel}:`, summaryX, y + 18);
  pdf.text(formatCurrency(doc.taxAmount, doc.currency, currencies), pageWidth - margin, y + 18, { align: 'right' });

  if (doc.shippingCharges > 0) {
    pdf.text('Shipping / Freight:', summaryX, y + 24);
    pdf.text(formatCurrency(doc.shippingCharges, doc.currency, currencies), pageWidth - margin, y + 24, { align: 'right' });
  }

  // Grand Total Box
  pdf.setFillColor(theme.primaryColor[0], theme.primaryColor[1], theme.primaryColor[2]);
  pdf.rect(summaryX - 3, y + 28, summaryBoxWidth + 3, 16, 'F');

  pdf.setFont(theme.fontFamily, 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('GRAND TOTAL:', summaryX, y + 35);
  pdf.setFontSize(11);
  pdf.text(formatCurrency(doc.grandTotal, doc.currency, currencies), pageWidth - margin - 2, y + 36, { align: 'right' });

  // Balance Due if partial
  if (doc.paidAmount > 0) {
    const balance = Math.max(0, doc.grandTotal - doc.paidAmount);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(226, 232, 240);
    pdf.text(`Paid: ${formatCurrency(doc.paidAmount, doc.currency, currencies)} | Balance Due: ${formatCurrency(balance, doc.currency, currencies)}`, summaryX, y + 41);
  }

  y += 50;

  // Terms & Conditions & Signatory
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Terms
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TERMS & CONDITIONS:', margin, y + 4);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  const termsText = doc.terms || company.terms || 'Payment due as specified on invoice.';
  const termLines = pdf.splitTextToSize(termsText, contentWidth - 65);
  pdf.text(termLines, margin, y + 9);

  // Authorized Signatory
  const sigX = pageWidth - margin - 50;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('For ' + company.name, sigX, y + 4);

  pdf.setDrawColor(203, 213, 225);
  pdf.line(sigX, y + 26, sigX + 50, y + 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Authorized Signatory', sigX + 10, y + 30);

  // Footer Note
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('This is a computer-generated document processed via Business Billing Suite.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return pdf;
}

export function downloadDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): void {
  const pdf = generateDocumentPdf(doc, company, currencies);
  const fileName = `${doc.documentNumber}_${doc.clientCompany || doc.clientName}`.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
  pdf.save(fileName);
}

export function generateDocumentPdfBlob(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): Blob {
  const pdf = generateDocumentPdf(doc, company, currencies);
  return pdf.output('blob');
}
