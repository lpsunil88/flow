/**
 * Number to words conversion utility tailored for Indian currency and international formats.
 * e.g., 354 -> "Rupees Three Hundred Fifty Four Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred';
    n %= 100;
    if (n > 0) str += ' ';
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)];
    n %= 10;
    if (n > 0) str += ' ' + ONES[n];
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts a number to Indian numbering words (Crores, Lakhs, Thousands, Hundreds)
 */
export function numberToWordsIndian(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return 'Zero';
  }

  let words = '';
  let n = integerPart;

  const crore = Math.floor(n / 10000000);
  n %= 10000000;

  const lakh = Math.floor(n / 100000);
  n %= 100000;

  const thousand = Math.floor(n / 1000);
  n %= 1000;

  const hundred = n;

  if (crore > 0) {
    words += convertBelowThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertBelowThousand(hundred);
  }

  words = words.trim();

  if (decimalPart > 0) {
    const paiseWords = convertBelowThousand(decimalPart);
    return `${words} and ${paiseWords} Paise`;
  }

  return words;
}

/**
 * Formats an amount into standard tax invoice / delivery challan currency words
 * e.g. "Rupees Three Hundred Fifty Four Only"
 */
export function formatAmountToWords(amount: number, currency: string = 'INR'): string {
  const words = numberToWordsIndian(amount);
  if (!words || words === 'Zero') {
    return currency === 'INR' ? 'Rupees Zero Only' : 'Zero Only';
  }

  if (currency === 'INR') {
    return `Rupees ${words} Only`;
  }
  return `${currency} ${words} Only`;
}

/**
 * GST State Code Mapping
 */
export const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export function getStateCodeFromGstin(gstin?: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  const prefix = gstin.substring(0, 2);
  if (/^\d{2}$/.test(prefix)) {
    return prefix;
  }
  return null;
}

export function getStateDisplay(stateName?: string, gstin?: string, stateCode?: string): { code: string; name: string } {
  const isCleanStateName = (str?: string): boolean => {
    if (!str) return false;
    const trimmed = str.trim();
    if (trimmed.length > 30 || trimmed.includes('\n') || trimmed.includes(',')) return false;
    const lower = trimmed.toLowerCase();
    return !lower.includes('road') && !lower.includes('house') && !lower.includes('street') && !lower.includes('gali') && !lower.includes('nagar');
  };

  // If stateCode is provided
  if (stateCode && GST_STATE_MAP[stateCode]) {
    return {
      code: stateCode,
      name: isCleanStateName(stateName) ? stateName!.trim() : GST_STATE_MAP[stateCode]
    };
  }

  // From GSTIN (first 2 digits)
  const gstinCode = getStateCodeFromGstin(gstin);
  if (gstinCode && GST_STATE_MAP[gstinCode]) {
    return {
      code: gstinCode,
      name: isCleanStateName(stateName) ? stateName!.trim() : GST_STATE_MAP[gstinCode]
    };
  }

  // From stateName search
  if (stateName) {
    const cleanName = stateName.toLowerCase().trim();
    for (const [code, name] of Object.entries(GST_STATE_MAP)) {
      const lowerMapName = name.toLowerCase();
      // Match exact or as word boundary inside address text
      const wordRegex = new RegExp(`\\b${lowerMapName}\\b`, 'i');
      if (lowerMapName === cleanName || wordRegex.test(cleanName)) {
        return { code, name };
      }
    }
  }

  const defaultCode = stateCode || gstinCode || '27';
  return {
    code: defaultCode,
    name: GST_STATE_MAP[defaultCode] || 'Maharashtra'
  };
}
