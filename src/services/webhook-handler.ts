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

      // 1. EXTRACT customer phone from Dialpad event
      const customerPhone = extractCustomerPhone(callLog);
      if (!customerPhone) {
        console.log(`❌ Could not extract customer phone from call log`);
        return { success: false, error: 'Could not extract customer phone number' };
      }

      // 2. NORMALIZE phone number to E.164 format
      const normalizedPhone = normalizePhoneNumber(customerPhone);
      if (!normalizedPhone) {
        console.log(`❌ Invalid phone number format: ${customerPhone}`);
        return { success: false, error: `Invalid phone number format: ${customerPhone}` };
      }

      // 3. IDEMPOTENCY CHECK - Don't process the same call twice
      // Use call_id + customer phone + start_time to create unique key
      const startTime = new Date(callLog.start_time).toISOString();
      const uniqueKey = `${callLog.call_id}-${normalizedPhone.e164}-${startTime}`;
      
      console.log(`🔍 IDEMPOTENCY CHECK: uniqueKey = ${uniqueKey}`);
      console.log(`🔍 Processed calls: ${Array.from(this.processedCalls).join(', ')}`);
      
      if (this.processedCalls.has(uniqueKey)) {
        console.log(`⏭️ Call ${uniqueKey} already processed, skipping (idempotency)`);
        return { success: true, error: 'Call already processed' };
      }

      // Mark this call as processed
      this.processedCalls.add(uniqueKey);
      console.log(`✅ Added ${uniqueKey} to processed calls`);

      console.log(`📱 Customer phone: ${customerPhone} → ${normalizedPhone.e164}`);

      // 4. LOOKUP client in BuilderPrime by phone
      console.log(`🔍 Searching for client with phone: ${normalizedPhone.e164}`);
      const contactResult = await this.builderPrimeClient.findContactByPhone(normalizedPhone.e164);
      
      if (!contactResult.success) {
        console.log(`❌ Error searching for client: ${contactResult.error}`);
        return { success: false, error: contactResult.error || 'Failed to search for client' };
      }

      // 5. DISAMBIGUATE - Handle 0, 1, or many matches
      if (!contactResult.data) {
        console.log(`❌ No client found for phone: ${normalizedPhone.e164}`);
        return { success: false, error: `No client found for phone number: ${normalizedPhone.e164}` };
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
        secretKey: process.env.BUILDERPRIME_API_KEY || 'CrylHk2.lQ8zZDbuDFtj94jniUpn', // Use production API key
      };

      const result = await this.builderPrimeClient.createClientActivity(activityData);
      if (!result.success) {
        console.log(`❌ Failed to create client activity: ${result.error}`);
        return { success: false, error: result.error || 'Failed to create client activity' };
      }

      console.log(`✅ Successfully processed call ${callLog.call_id} for client ${client.opportunityId}`);
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
   * Includes direction, customer phone, and clickable recording link
   */
  private buildCallDescription(callLog: DialpadCallLog, normalizedPhone: string): string {
    let description: string;
    
    if (callLog.direction === 'inbound') {
      description = `Inbound call from ${normalizedPhone}`;
    } else {
      description = `Outbound call to ${normalizedPhone}`;
    }
    
    // Add recording link if available
    if (callLog.recording_url) {
      description += ` - [Listen to Recording](${callLog.recording_url})`;
    }
    
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