import { jsPDF } from 'jspdf';
import { CompanyProfile, CurrencyConfig, Document } from '../types';

export function getCurrencySymbol(code: string = 'INR', currencies: CurrencyConfig[] = []): string {
  const c = code?.toUpperCase();
  if (c === 'INR') return '₹';
  const found = currencies?.find((curr) => curr.code === c);
  return found ? found.symbol : code;
}

// PDF standard Type 1 fonts (Helvetica) cannot render unicode ₹ (U+20B9), which becomes corrupted as '¹'.
// For PDF generation, we map INR to clean 'Rs.' so amounts are crisp, clear, and professional.
export function getPdfCurrencySymbol(code: string = 'INR', currencies: CurrencyConfig[] = []): string {
  const c = code?.toUpperCase();
  if (c === 'INR') return 'Rs.';
  const found = currencies?.find((curr) => curr.code === c);
  if (!found) return code;
  if (found.symbol === '₹') return 'Rs.';
  return found.symbol;
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  currencies: CurrencyConfig[] = []
): string {
  const code = currencyCode || 'INR';
  const symbol = getCurrencySymbol(code, currencies);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyForPdf(
  amount: number,
  currencyCode: string = 'INR',
  currencies: CurrencyConfig[] = []
): string {
  const code = currencyCode || 'INR';
  const symbol = getPdfCurrencySymbol(code, currencies);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Convert a number into Indian English words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += ' ' + a[n % 10];
      }
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = inWords(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }
  return result + ' Only';
}

export function generateDocumentPdf(doc: Document, company: CompanyProfile, currencies: CurrencyConfig[]): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm
  const docFont = 'helvetica';

  let y = margin;

  // 1. Outer Border
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setLineWidth(0.35);
  pdf.rect(margin, margin, contentWidth, pageHeight - margin * 2, 'S');

  // 2. Header Section
  const hasLogo = Boolean(company.logoUrl);
  let textX = margin + 4;
  const logoWidth = 22;
  const logoHeight = 22;

  if (hasLogo) {
    try {
      pdf.addImage(company.logoUrl!, 'PNG', margin + 3, y + 4, logoWidth, logoHeight);
      textX = margin + logoWidth + 6;
    } catch {
      try {
        pdf.addImage(company.logoUrl!, 'JPEG', margin + 3, y + 4, logoWidth, logoHeight);
        textX = margin + logoWidth + 6;
      } catch {
        textX = margin + 4;
      }
    }
  }

  // Right Header width & coordinates
  const badgeWidth = 52;
  const badgeHeight = 7.5;
  const badgeX = pageWidth - margin - badgeWidth - 3;
  const maxHeaderLeftWidth = badgeX - textX - 4; // safe boundary so left text NEVER collides with badge

  // Company Name (Left Header)
  pdf.setFont(docFont, 'bold');
  const companyName = company.name || 'COMPANY NAME';
  pdf.setFontSize(companyName.length > 36 ? 10.5 : 12);
  pdf.setTextColor(15, 23, 42); // slate-900

  const compNameLines = pdf.splitTextToSize(companyName, maxHeaderLeftWidth);
  let compY = y + 6;
  compNameLines.forEach((line: string) => {
    pdf.text(line, textX, compY);
    compY += 4.5;
  });

  // Company Metadata (Address, Tax ID, Phone, Email, State)
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(71, 85, 105); // slate-600

  const companyAddressParts = [company.address, company.city, company.country].filter(Boolean);
  const companyAddr = companyAddressParts.join(', ').replace(/\s+/g, ' ').trim();
  if (companyAddr) {
    const addrLines = pdf.splitTextToSize(companyAddr, maxHeaderLeftWidth);
    addrLines.slice(0, 2).forEach((line: string) => {
      pdf.text(line, textX, compY);
      compY += 3.6;
    });
  }

  const taxIdText = `GSTIN: ${company.taxId || 'N/A'}${company.phone ? ` | Phone: ${company.phone}` : ''}`;
  pdf.text(taxIdText, textX, compY);
  compY += 3.6;

  const contactText = `Email: ${company.email || 'N/A'}${company.website ? ` | Web: ${company.website}` : ''}`;
  pdf.text(contactText, textX, compY);
  compY += 3.6;

  if (company.state) {
    pdf.text(`State: ${company.state}${company.stateCode ? ` (Code: ${company.stateCode})` : ''}`, textX, compY);
    compY += 3.6;
  }

  // Right Header: Document Type Badge & Details
  const docTypeLabel =
    doc.type === 'invoice'
      ? 'TAX INVOICE'
      : doc.type === 'proforma'
      ? 'PROFORMA INVOICE'
      : 'DELIVERY CHALLAN';

  const badgeBg =
    doc.type === 'invoice'
      ? [37, 99, 235]
      : doc.type === 'proforma'
      ? [217, 119, 6]
      : [16, 185, 129];

  pdf.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  pdf.rect(badgeX, y + 3, badgeWidth, badgeHeight, 'F');
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docTypeLabel, badgeX + badgeWidth / 2, y + 7.8, { align: 'center' });

  // Document Number & Dates
  const rightAlignX = pageWidth - margin - 4;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text(doc.documentNumber, rightAlignX, y + 16, { align: 'right' });

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Date: ${doc.date}`, rightAlignX, y + 21, { align: 'right' });
  pdf.text(`Due Date: ${doc.dueDate || doc.date}`, rightAlignX, y + 25.5, { align: 'right' });

  const copyLabel =
    doc.type === 'challan'
      ? 'Original for Consignee'
      : doc.type === 'invoice'
      ? 'Original for Recipient'
      : 'Commercial Quotation';
  pdf.text(copyLabel, rightAlignX, y + 30, { align: 'right' });

  // Calculate actual header height dynamically
  const headerHeight = Math.max(35, compY - y + 2);
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y + headerHeight, margin + contentWidth, y + headerHeight);
  y += headerHeight;

  // 3. Optional Dispatch / Challan Logistics Bar
  if (doc.type === 'challan' || doc.challanDetails) {
    const challanBarH = 9.5;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, contentWidth, challanBarH, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y + challanBarH, margin + contentWidth, y + challanBarH);

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.2);
    pdf.setTextColor(30, 41, 59);
    pdf.text('LOGISTICS / TRANSPORT DISPATCH PARTICULARS:', margin + 4, y + 4.2);

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7);
    const vehicleText = doc.challanDetails?.vehicleNo ? `Vehicle: ${doc.challanDetails.vehicleNo}` : 'Vehicle: Standard Fleet';
    const modeText = doc.challanDetails?.dispatchThrough ? `Via: ${doc.challanDetails.dispatchThrough}` : 'Via: Road Transport';
    const lrText = doc.challanDetails?.deliveryNote ? `LR/GR: ${doc.challanDetails.deliveryNote}` : 'Handover: Direct';
    const returnText = doc.challanDetails?.returnable ? 'Type: Returnable' : 'Type: Non-Returnable';
    pdf.text(`${vehicleText}   |   ${modeText}   |   ${lrText}   |   ${returnText}`, margin + 4, y + 7.8);
    y += challanBarH;
  }

  // 4. Buyer & Consignee Statutory Details Grid (DYNAMIC WRAPPING & NO OVERLAP)
  const hasShipping = Boolean(
    doc.shippingAddress?.enabled &&
      (doc.shippingAddress.name || doc.shippingAddress.company || doc.shippingAddress.address)
  );
  const buyerBoxW = hasShipping ? contentWidth / 2 : contentWidth;

  // Track Y positions dynamically for buyer and consignee to prevent line collision
  let buyerY = y + 4.5;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('BILLED TO (BUYER):', margin + 4, buyerY);
  buyerY += 4.5;

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  const clientTitle = doc.clientCompany || doc.clientName || 'Client Name';
  const clientTitleLines = pdf.splitTextToSize(clientTitle, buyerBoxW - 8);
  clientTitleLines.forEach((line: string) => {
    pdf.text(line, margin + 4, buyerY);
    buyerY += 3.8;
  });

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);

  if (doc.clientName && doc.clientCompany) {
    const contactLine = `Attn: ${doc.clientName}${doc.clientPhone ? ` | Phone: ${doc.clientPhone}` : ''}`;
    pdf.text(contactLine, margin + 4, buyerY);
    buyerY += 3.5;
  } else if (doc.clientPhone) {
    pdf.text(`Phone: ${doc.clientPhone}`, margin + 4, buyerY);
    buyerY += 3.5;
  }

  if (doc.clientAddress) {
    const cleanAddr = doc.clientAddress.replace(/\n+/g, ', ').replace(/\s+/g, ' ').trim();
    const addrLines = pdf.splitTextToSize(`Address: ${cleanAddr}`, buyerBoxW - 8);
    addrLines.slice(0, 3).forEach((line: string) => {
      pdf.text(line, margin + 4, buyerY);
      buyerY += 3.5;
    });
  }

  const buyerTaxId = doc.clientTaxId ? `GSTIN / Tax ID: ${doc.clientTaxId}` : 'GSTIN / Tax ID: Unregistered / Consumer';
  pdf.text(buyerTaxId, margin + 4, buyerY);
  buyerY += 3.5;

  let consigneeY = y + 4.5;
  if (hasShipping) {
    const rightX = margin + buyerBoxW + 4;
    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('SHIPPED TO (CONSIGNEE):', rightX, consigneeY);
    consigneeY += 4.5;

    pdf.setFont(docFont, 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    const shipTitle = doc.shippingAddress?.company || doc.shippingAddress?.name || doc.clientCompany || doc.clientName;
    const shipTitleLines = pdf.splitTextToSize(shipTitle, buyerBoxW - 8);
    shipTitleLines.forEach((line: string) => {
      pdf.text(line, rightX, consigneeY);
      consigneeY += 3.8;
    });

    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);

    const shipContact = doc.shippingAddress?.name || doc.clientName;
    const shipPhone = doc.shippingAddress?.phone || doc.clientPhone;
    if (shipContact) {
      pdf.text(`Contact: ${shipContact}${shipPhone ? ` | Phone: ${shipPhone}` : ''}`, rightX, consigneeY);
      consigneeY += 3.5;
    }

    const shipAddrStr = [doc.shippingAddress?.address, doc.shippingAddress?.city, doc.shippingAddress?.state]
      .filter(Boolean)
      .join(', ')
      .replace(/\n+/g, ', ')
      .trim();
    if (shipAddrStr) {
      const shipAddrLines = pdf.splitTextToSize(`Delivery: ${shipAddrStr}`, buyerBoxW - 8);
      shipAddrLines.slice(0, 3).forEach((line: string) => {
        pdf.text(line, rightX, consigneeY);
        consigneeY += 3.5;
      });
    }

    const shipTaxId = doc.shippingAddress?.taxId || doc.clientTaxId || 'N/A';
    pdf.text(`Consignee GSTIN: ${shipTaxId}`, rightX, consigneeY);
    consigneeY += 3.5;
  }

  // Box height accommodates all address lines with padding
  const buyerBoxH = Math.max(26, Math.max(buyerY - y, consigneeY - y) + 2);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, y, contentWidth, buyerBoxH, 'S');

  if (hasShipping) {
    pdf.line(margin + buyerBoxW, y, margin + buyerBoxW, y + buyerBoxH);
  }
  y += buyerBoxH;

  // 5. Line Items Table Header
  const colX = {
    sno: margin + 3,
    desc: margin + 9,
    hsn: margin + 82,
    qty: margin + 122,
    rate: margin + 146,
    tax: margin + 163,
    total: margin + contentWidth - 3,
  };

  const tableHeaderH = 7.5;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, y, contentWidth, tableHeaderH, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y + tableHeaderH, margin + contentWidth, y + tableHeaderH);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(30, 41, 59);

  pdf.text('#', colX.sno, y + 5);
  pdf.text('Description of Goods / Services', colX.desc, y + 5);
  pdf.text('HSN/SAC', colX.hsn, y + 5);
  pdf.text('Qty', colX.qty, y + 5, { align: 'right' });
  pdf.text('Rate', colX.rate, y + 5, { align: 'right' });
  pdf.text('Tax', colX.tax, y + 5, { align: 'right' });
  pdf.text('Amount', colX.total, y + 5, { align: 'right' });

  y += tableHeaderH;

  // 6. Line Items Rows
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(15, 23, 42);

  doc.items.forEach((item, index) => {
    const descLines = pdf.splitTextToSize(item.description || 'Merchandise Item', 70);
    const rowH = Math.max(7.2, descLines.length * 3.6 + 2.5);

    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, rowH, 'F');
    }

    pdf.text(String(index + 1), colX.sno, y + 4.8);

    let itemDescY = y + 4.8;
    descLines.forEach((dLine: string) => {
      pdf.text(dLine, colX.desc, itemDescY);
      itemDescY += 3.6;
    });

    pdf.text(item.hsnCode || '-', colX.hsn, y + 4.8);
    pdf.text(`${item.quantity} ${item.unit || 'PCS'}`.trim(), colX.qty, y + 4.8, { align: 'right' });
    pdf.text(formatCurrencyForPdf(item.unitPrice, doc.currency, currencies), colX.rate, y + 4.8, { align: 'right' });
    pdf.text(`${item.taxRate}%`, colX.tax, y + 4.8, { align: 'right' });
    pdf.text(formatCurrencyForPdf(item.total, doc.currency, currencies), colX.total, y + 4.8, { align: 'right' });

    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(margin, y + rowH, margin + contentWidth, y + rowH);
    y += rowH;
  });

  // Table bottom border
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, y, margin + contentWidth, y);

  // 7. Totals & Financial Breakdown Section
  const totalsSectionH = 44;
  const splitX = margin + contentWidth * 0.56;

  // Amount In Words & Bank Details (Left side)
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(71, 85, 105);
  pdf.text('TOTAL AMOUNT IN WORDS:', margin + 4, y + 5.5);

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  const words = numberToWords(doc.grandTotal);
  const wordsLines = pdf.splitTextToSize(words, splitX - margin - 8);
  pdf.text(wordsLines.slice(0, 2), margin + 4, y + 10);

  // Bank Details
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(71, 85, 105);
  pdf.text('BANK ACCOUNT PAYMENT DETAILS:', margin + 4, y + 22);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(15, 23, 42);
  if (company.bankDetails) {
    const bankStr = `Bank: ${company.bankDetails.bankName || 'N/A'} (A/C: ${company.bankDetails.accountNumber || 'N/A'})`;
    pdf.text(bankStr, margin + 4, y + 27);
    const ifscStr = `IFSC: ${company.bankDetails.ifscSwift || 'N/A'} | Branch: ${company.bankDetails.branch || 'Main Branch'}`;
    pdf.text(ifscStr, margin + 4, y + 32);
    if (company.bankDetails.upiId) {
      pdf.text(`UPI Digital VPA: ${company.bankDetails.upiId}`, margin + 4, y + 37);
    }
  } else {
    pdf.text('Direct Electronic Wire / NEFT / RTGS Transfer Available', margin + 4, y + 27);
  }

  // Right Side: Financial Breakdown
  pdf.line(splitX, y, splitX, y + totalsSectionH);
  pdf.line(margin, y + totalsSectionH, margin + contentWidth, y + totalsSectionH);

  let rightY = y + 5.5;
  const labelX = splitX + 4;
  const valueX = margin + contentWidth - 4;

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);

  pdf.text('Taxable Subtotal:', labelX, rightY);
  pdf.text(formatCurrencyForPdf(doc.subtotal, doc.currency, currencies), valueX, rightY, { align: 'right' });
  rightY += 5;

  if (doc.taxType === 'gst') {
    if (doc.cgstAmount || doc.sgstAmount) {
      const halfRate = doc.taxRate ? (doc.taxRate / 2).toFixed(1) : '9';
      pdf.text(`CGST (${halfRate}%):`, labelX, rightY);
      pdf.text(formatCurrencyForPdf(doc.cgstAmount || 0, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 4.5;

      pdf.text(`SGST (${halfRate}%):`, labelX, rightY);
      pdf.text(formatCurrencyForPdf(doc.sgstAmount || 0, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 4.5;
    } else if (doc.igstAmount) {
      pdf.text(`IGST (${doc.taxRate}%):`, labelX, rightY);
      pdf.text(formatCurrencyForPdf(doc.igstAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;
    } else if (doc.taxAmount > 0) {
      pdf.text(`GST (${doc.taxRate}%):`, labelX, rightY);
      pdf.text(formatCurrencyForPdf(doc.taxAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
      rightY += 5;
    }
  } else if (doc.taxAmount > 0) {
    pdf.text(`Tax (${doc.taxRate}%):`, labelX, rightY);
    pdf.text(formatCurrencyForPdf(doc.taxAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 5;
  }

  if (doc.shippingCharges > 0) {
    pdf.text('Shipping & Handling:', labelX, rightY);
    pdf.text(formatCurrencyForPdf(doc.shippingCharges, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 4.5;
  }

  // Grand Total Highlight Box
  pdf.setFillColor(241, 245, 249);
  pdf.rect(splitX, rightY - 1, contentWidth * 0.44, 7.5, 'F');
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Grand Total:', labelX, rightY + 4.2);
  pdf.text(formatCurrencyForPdf(doc.grandTotal, doc.currency, currencies), valueX, rightY + 4.2, { align: 'right' });
  rightY += 8.5;

  if (doc.paidAmount > 0) {
    pdf.setFont(docFont, 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(16, 185, 129);
    pdf.text('Paid Amount:', labelX, rightY);
    pdf.text(formatCurrencyForPdf(doc.paidAmount, doc.currency, currencies), valueX, rightY, { align: 'right' });
    rightY += 4;

    const balanceDue = Math.max(0, doc.grandTotal - doc.paidAmount);
    pdf.setFont(docFont, 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text('Balance Due:', labelX, rightY);
    pdf.text(formatCurrencyForPdf(balanceDue, doc.currency, currencies), valueX, rightY, { align: 'right' });
  }

  y += totalsSectionH;

  // 8. Declarations & Authorized Signatory Block
  const bottomSectionH = 32;
  const sigSplitX = margin + contentWidth * 0.56;

  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text('DECLARATION & TERMS:', margin + 4, y + 5);

  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  const termsText =
    doc.terms ||
    company.terms ||
    'Certified that goods described in this document are genuine. Discrepancies if any must be reported within 48 hours.';
  const termsLines = pdf.splitTextToSize(termsText, sigSplitX - margin - 8);
  pdf.text(termsLines.slice(0, 3), margin + 4, y + 9);

  // Receiver's Signature (left)
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin + 4, y + 24, margin + 42, y + 24);
  pdf.setFont(docFont, 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Receiver's Signature", margin + 23, y + 28, { align: 'center' });

  // Authorized Signatory (Right)
  pdf.line(sigSplitX, y, sigSplitX, y + bottomSectionH);

  // Company Name above signature (wrapped so it NEVER crosses sigSplitX)
  const maxSigCompanyW = contentWidth * 0.44 - 6;
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7.2);
  pdf.setTextColor(15, 23, 42);
  const forCompText = `FOR ${company.name || 'COMPANY NAME'}`;
  const forCompLines = pdf.splitTextToSize(forCompText, maxSigCompanyW);
  let forCompY = y + 5;
  forCompLines.slice(0, 2).forEach((line: string) => {
    pdf.text(line, pageWidth - margin - 4, forCompY, { align: 'right' });
    forCompY += 3.5;
  });

  // Stamp & Signature Images
  const stampUrl = doc.includeStamp !== false ? doc.stampUrl || company.stampUrl : null;
  const signatureUrl = doc.includeSignature !== false ? doc.signatureUrl || company.signatureUrl : null;

  if (stampUrl) {
    try {
      pdf.addImage(stampUrl, 'PNG', sigSplitX + 6, y + 7, 16, 16);
    } catch {
      try {
        pdf.addImage(stampUrl, 'JPEG', sigSplitX + 6, y + 7, 16, 16);
      } catch (e) {
        console.warn('Could not add stamp to PDF', e);
      }
    }
  }

  if (signatureUrl) {
    try {
      pdf.addImage(signatureUrl, 'PNG', pageWidth - margin - 38, y + 7, 32, 13);
    } catch {
      try {
        pdf.addImage(signatureUrl, 'JPEG', pageWidth - margin - 38, y + 7, 32, 13);
      } catch (e) {
        console.warn('Could not add signature to PDF', e);
      }
    }
  }

  pdf.line(pageWidth - margin - 46, y + 24, pageWidth - margin - 4, y + 24);
  pdf.setFont(docFont, 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);
  const signatoryName = doc.authorizedSignatoryName || company.authorizedSignatoryName || 'Authorized Signatory';
  pdf.text(signatoryName, pageWidth - margin - 25, y + 28, { align: 'center' });

  // 9. Computer-Generated Notice Footer
  pdf.setFont(docFont, 'italic');
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    `This is a computer-generated document issued for corporate operations. Standard A4 format.`,
    pageWidth / 2,
    pageHeight - margin - 2,
    { align: 'center' }
  );

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
