import { DialpadCallLog, BuilderPrimeClientActivity } from '../types';
import { BuilderPrimeClient } from './builderprime';
import { MockBuilderPrimeClient } from './mock-builderprime';
import { extractCustomerPhone, normalizePhoneNumber } from '../utils/phone-normalizer';

export class WebhookHandler {
  private builderPrimeClient: BuilderPrimeClient | MockBuilderPrimeClient;
  private isMockMode: boolean;
  private processedCalls: Set<string> = new Set(); // For idempotency

  constructor(builderPrimeApiKey: string, builderPrimeBaseUrl?: string) {
    if (builderPrimeApiKey && builderPrimeApiKey !== 'your_builderprime_api_key_here') {
      this.builderPrimeClient = new BuilderPrimeClient(builderPrimeApiKey, builderPrimeBaseUrl);
      this.isMockMode = false;
      console.log('🔗 Using real BuilderPrime API client');
    } else {
      this.builderPrimeClient = new MockBuilderPrimeClient();
      this.isMockMode = true;
      console.log('🧪 Using mock BuilderPrime client for testing');
    }
  }

  /**
   * Process Dialpad call event (not call log event)
   * Fetch call log data from Dialpad API and create BuilderPrime activity
   */
  async processCallEvent(callEvent: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📞 Processing call event: ${JSON.stringify(callEvent)}`);

      // Extract call ID from the event
      const callId = callEvent.call_id || callEvent.id;
      if (!callId) {
        console.log(`❌ No call ID found in event`);
        return { success: false, error: 'No call ID found in event' };
      }

      console.log(`🔍 Fetching call log data for call ID: ${callId}`);

      // Fetch call log data from Dialpad API
      const callLogData = await this.fetchCallLogFromDialpad(callId);
      if (!callLogData) {
        console.log(`❌ Could not fetch call log data for call ID: ${callId}`);
        return { success: false, error: 'Could not fetch call log data' };
      }

      // Process the call log data
      return await this.processCallLogEvent(callLogData);

    } catch (error) {
      console.error(`❌ Error processing call event:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Fetch call log data from Dialpad API
   */
  private async fetchCallLogFromDialpad(callId: string): Promise<any> {
    try {
      const dialpadApiKey = process.env.DIALPAD_API_KEY;
      if (!dialpadApiKey) {
        console.log(`❌ No Dialpad API key configured`);
        return null;
      }

      const response = await fetch(`https://dialpad.com/api/v2/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${dialpadApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`❌ Failed to fetch call log: ${response.status} ${response.statusText}`);
        return null;
      }

      const callData = await response.json();
      console.log(`✅ Fetched call log data: ${JSON.stringify(callData)}`);
      return callData;

    } catch (error) {
      console.error(`❌ Error fetching call log:`, error);
      return null;
    }
  }

  /**
   * Process Dialpad call log webhook event
   * Implements: Extract → Normalize → Lookup → Disambiguate → Write → Idempotency
   */
  async processCallLogEvent(callLog: DialpadCallLog): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📞 Processing call log event for call ID: ${callLog.call_id}`);

      // 1. IDEMPOTENCY CHECK - Don't process the same call twice
      const callId = callLog.call_id;
      if (this.processedCalls.has(callId)) {
        console.log(`⏭️ Call ${callId} already processed, skipping (idempotency)`);
        return { success: true, error: 'Call already processed' };
      }

      // 2. EXTRACT customer phone from Dialpad event
      const customerPhone = extractCustomerPhone(callLog);
      if (!customerPhone) {
        console.log(`❌ Could not extract customer phone from call log`);
        return { success: false, error: 'Could not extract customer phone number' };
      }

      // 3. NORMALIZE phone number to E.164 format
      const normalizedPhone = normalizePhoneNumber(customerPhone);
      if (!normalizedPhone) {
        console.log(`❌ Invalid phone number format: ${customerPhone}`);
        return { success: false, error: `Invalid phone number format: ${customerPhone}` };
      }

      console.log(`📱 Customer phone: ${customerPhone} → ${normalizedPhone.e164}`);

      // 4. LOOKUP client in BuilderPrime by phone
      console.log(`🔍 Searching for client with phone: ${normalizedPhone.e164}`);
      const contactResult = await this.builderPrimeClient.findContactByPhone(customerPhone);
      
      if (!contactResult.success) {
        console.log(`❌ Error searching for client: ${contactResult.error}`);
        return { success: false, error: contactResult.error || 'Failed to search for client' };
      }

      // 5. DISAMBIGUATE - Handle 0, 1, or many matches
      if (!contactResult.data) {
        console.log(`❌ No client found for phone: ${customerPhone}`);
        return { success: false, error: `No client found for phone number: ${customerPhone}` };
      }

      const client = contactResult.data;
      if (!client.opportunityId) {
        console.log(`❌ Client found but no opportunity ID: ${JSON.stringify(client)}`);
        return { success: false, error: 'Client found but missing opportunity ID' };
      }

      console.log(`✅ Found client with opportunity ID: ${client.opportunityId}`);

      // 6. WRITE activity (recording link + call meta) on the chosen client
      const activityData: BuilderPrimeClientActivity = {
        opportunityId: client.opportunityId,
        activityDateTime: Date.now(), // Use current time when activity is logged
        activityType: 'CALL',
        callOutcome: this.mapCallOutcome(callLog.status),
        description: this.buildCallDescription(callLog, normalizedPhone.e164),
        secretKey: 'CrylHk2.lQ8zZDbuDFtj94jniUpn', // Use test API key as secret key
      };

      const result = await this.builderPrimeClient.createClientActivity(activityData);
      if (!result.success) {
        console.log(`❌ Failed to create client activity: ${result.error}`);
        return { success: false, error: result.error || 'Failed to create client activity' };
      }

      // 7. MARK AS PROCESSED (idempotency)
      this.processedCalls.add(callId);

      console.log(`✅ Successfully processed call ${callId} for client ${client.opportunityId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error processing call log event:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Map Dialpad call status to BuilderPrime call outcome
   */
  private mapCallOutcome(status: string): 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'LEFT_LIVE_MESSAGE' | 'LEFT_VOICEMAIL' | 'CONNECTED' {
    switch (status.toLowerCase()) {
      case 'answered':
      case 'connected':
      case 'recording':
      case 'ringing':
        return 'CONNECTED';
      case 'no_answer':
      case 'no-answer':
        return 'LEFT_VOICEMAIL';
      case 'busy':
        return 'BUSY';
      case 'voicemail':
        return 'LEFT_VOICEMAIL';
      case 'failed':
        return 'WRONG_NUMBER';
      default:
        return 'CONNECTED'; // Default to CONNECTED for active calls
    }
  }

  /**
   * Build call description from Dialpad call log
   * Simple & Clean format with DialPad number
   */
  private buildCallDescription(callLog: DialpadCallLog, normalizedPhone: string): string {
    const direction = callLog.direction === 'inbound' ? 'Inbound' : 'Outbound';
    
    // Get the DialPad business number (use target.phone for accuracy)
    const dialpadNumber = callLog.target?.phone || 
      (callLog.direction === 'inbound' ? callLog.to_number : callLog.from_number);
    
    // Simple & Clean format with separator and DialPad number
    let description = `${direction} call from ${normalizedPhone}`;
    description += ` | DialPad: ${dialpadNumber}`;
    
    return description;
  }

  /**
   * Get mock stats for testing
   */
  getMockStats() {
    if (this.isMockMode && 'getStats' in this.builderPrimeClient) {
      return (this.builderPrimeClient as any).getStats();
    }
    return null;
  }

  /**
   * Clear mock data for testing
   */
  clearMockData() {
    if (this.isMockMode && 'clearData' in this.builderPrimeClient) {
      (this.builderPrimeClient as any).clearData();
    }
  }
}