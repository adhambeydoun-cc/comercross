/**
 * Phone number normalization utilities
 * Handles E.164 format extraction and normalization for BuilderPrime lookup
 */

export interface NormalizedPhone {
  e164: string;        // +13135551234
  last10: string;      // 3135551234
  clean: string;       // 13135551234 (no +)
}

/**
 * Normalize phone number to E.164 format and extract components
 * Handles various formats: +13135551234, 313-555-1234, 1 (313) 555-1234, etc.
 */
export function normalizePhoneNumber(phoneNumber: string): NormalizedPhone | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Handle different starting patterns
  let e164: string;
  let last10: string;
  let clean: string;

  if (cleaned.startsWith('+1')) {
    // Already in E.164 format: +13135551234
    e164 = cleaned;
    last10 = cleaned.slice(2); // Remove +1
    clean = cleaned.slice(1);  // Remove +
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // US format with country code: 13135551234
    e164 = '+' + cleaned;
    last10 = cleaned.slice(1); // Remove leading 1
    clean = cleaned;
  } else if (cleaned.length === 10) {
    // US format without country code: 3135551234
    e164 = '+1' + cleaned;
    last10 = cleaned;
    clean = '1' + cleaned;
  } else {
    // Invalid format
    return null;
  }

  // Validate that we have a proper US phone number
  if (last10.length !== 10 || !/^\d{10}$/.test(last10)) {
    return null;
  }

  return {
    e164,
    last10,
    clean
  };
}

/**
 * Extract customer phone number from Dialpad call log
 * For inbound calls: customer is the "from" number
 * For outbound calls: customer is the "to" number
 */
export function extractCustomerPhone(callLog: any): string | null {
  if (!callLog || !callLog.direction) {
    return null;
  }

  // For inbound calls, customer is calling us (from_number)
  // For outbound calls, customer is who we're calling (to_number)
  const customerPhone = callLog.direction === 'inbound' 
    ? callLog.from_number 
    : callLog.to_number;

  return customerPhone || null;
}

/**
 * Check if two phone numbers are equivalent (same customer)
 */
export function arePhoneNumbersEquivalent(phone1: string, phone2: string): boolean {
  const norm1 = normalizePhoneNumber(phone1);
  const norm2 = normalizePhoneNumber(phone2);
  
  if (!norm1 || !norm2) {
    return false;
  }
  
  return norm1.e164 === norm2.e164;
}
