import { BuilderPrimeContact, BuilderPrimeCallLog, BuilderPrimeClientActivity, BuilderPrimeApiResponse } from '../types';
import { normalizePhoneNumber, NormalizedPhone } from '../utils/phone-normalizer';

export class BuilderPrimeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.builderprime.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<BuilderPrimeApiResponse & { data?: T }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
        console.log(`📤 Sending JSON:`, options.body);
      }

      const response = await fetch(url, options);
      const responseData = await response.json() as any;

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        console.log(`❌ Response:`, responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async makeRequestWithUrl<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<BuilderPrimeApiResponse & { data?: T }> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
        console.log(`📤 Sending JSON to ${url}:`, options.body);
      }

      const response = await fetch(url, options);
      const responseData = await response.json() as any;

      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        console.log(`❌ Response:`, responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: responseData as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async findContactByPhone(phoneNumber: string): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact | BuilderPrimeContact[] }> {
    // Normalize the phone number to E.164 format
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
      return {
        success: false,
        error: `Invalid phone number format: ${phoneNumber}`
      };
    }

    console.log(`🔍 Searching for client with phone: ${phoneNumber} (normalized: ${normalized.e164})`);

    // Try exact match first with E.164 format using correct parameter name 'phone'
    const exactMatch = await this.makeRequest<BuilderPrimeContact | BuilderPrimeContact[]>(`/clients?phone=${normalized.e164}`);
    if (exactMatch.success && exactMatch.data) {
      return this.handleDisambiguation(exactMatch.data, normalized.e164);
    }
    
    // Fallback to last 10 digits if exact match fails
    const last10Match = await this.makeRequest<BuilderPrimeContact | BuilderPrimeContact[]>(`/clients?phone=${normalized.last10}`);
    if (last10Match.success && last10Match.data) {
      return this.handleDisambiguation(last10Match.data, normalized.e164);
    }

    // No matches found
    console.log(`❌ No client found for phone: ${normalized.e164}`);
    return {
      success: true,
      data: undefined as any
    };
  }

  /**
   * Handle disambiguation when multiple clients match the phone number
   * Returns the best match or error if ambiguous
   * Extracts the ID field from BuilderPrime response and maps it to opportunityId
   */
  private handleDisambiguation(matches: BuilderPrimeContact | BuilderPrimeContact[], originalPhone: string): BuilderPrimeApiResponse & { data?: BuilderPrimeContact } {
    // If single match, return it
    if (!Array.isArray(matches)) {
      console.log(`✅ Found single client match for ${originalPhone}`);
      const client = this.extractClientData(matches);
      return {
        success: true,
        data: client
      };
    }

    // Multiple matches - need to disambiguate
    if (matches.length === 0) {
      console.log(`❌ No client matches found for ${originalPhone}`);
      return {
        success: true,
        data: undefined as any
      };
    }

    if (matches.length === 1) {
      console.log(`✅ Found single client match for ${originalPhone}`);
      const client = this.extractClientData(matches[0]);
      return {
        success: true,
        data: client
      };
    }

    // Multiple matches - prioritize active opportunities over dead-end ones
    console.log(`⚠️ Multiple client matches (${matches.length}) found for ${originalPhone}`);
    console.log(`   Matches: ${matches.map(m => `ID:${(m as any).id || 'unknown'}, Status:${(m as any).leadStatusName || 'unknown'}`).join(', ')}`);
    
    // Filter out dead-end opportunities (like "Not qualified, cant do")
    const activeMatches = matches.filter(m => {
      const status = (m as any).leadStatusName?.toLowerCase() || '';
      return !status.includes('not qualified') && !status.includes('cant do') && !status.includes('dead');
    });
    
    // Use active match if available, otherwise fall back to first match
    const selectedMatch = activeMatches.length > 0 ? activeMatches[0] : matches[0];
    const client = this.extractClientData(selectedMatch);
    
    console.log(`✅ Selected opportunity ID: ${client.opportunityId} (${activeMatches.length > 0 ? 'active' : 'fallback'})`);
    
    return {
      success: true,
      data: client
    };
  }

  /**
   * Extract client data from BuilderPrime response
   * Maps the id field to opportunityId for our internal use
   * Handles the actual BP response format: {"id": 4015918, "firstName": "adham", ...}
   */
  private extractClientData(bpResponse: any): BuilderPrimeContact {
    return {
      id: bpResponse.id,
      opportunityId: bpResponse.id, // Map id field to opportunityId
      first_name: bpResponse.firstName,
      last_name: bpResponse.lastName,
      email: bpResponse.emailAddress,
      phone: bpResponse.phoneNumber,
      company: bpResponse.companyName,
      address: bpResponse.addressLine1,
      city: bpResponse.city,
      state: bpResponse.state,
      zip: bpResponse.zip,
      notes: bpResponse.notes,
      tags: bpResponse.tags,
      custom_fields: bpResponse.customFields,
    };
  }

  async createClientActivity(activity: BuilderPrimeClientActivity): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeClientActivity }> {
    // Use the correct client-activities endpoint with full URL
    const activityData = {
      opportunityId: activity.opportunityId,
      activityDateTime: activity.activityDateTime,
      activityType: activity.activityType,
      callOutcome: activity.callOutcome,
      description: activity.description,
      secretKey: activity.secretKey
    };
    
              // Use the full URL for client activities endpoint
              const url = `${this.baseUrl}/client-activities/v1`;
    return this.makeRequestWithUrl<BuilderPrimeClientActivity>(url, 'POST', activityData);
  }

  async updateContact(contactId: string, contact: Partial<BuilderPrimeContact>): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    return this.makeRequest<BuilderPrimeContact>(`/contacts/${contactId}`, 'PUT', contact);
  }

  async createCallLog(callLog: BuilderPrimeCallLog): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeCallLog }> {
    return this.makeRequest<BuilderPrimeCallLog>('/call-logs', 'POST', callLog);
  }

  async getContact(contactId: string): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    return this.makeRequest<BuilderPrimeContact>(`/contacts/${contactId}`);
  }
}
