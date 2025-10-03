import { BuilderPrimeContact, BuilderPrimeCallLog, BuilderPrimeClientActivity, BuilderPrimeApiResponse } from '../types';

export class MockBuilderPrimeClient {
  private contacts: Map<string, BuilderPrimeContact> = new Map();
  private callLogs: BuilderPrimeCallLog[] = [];
  private clientActivities: BuilderPrimeClientActivity[] = [];

  constructor() {
    console.log('🔧 Using Mock BuilderPrime Client for testing');
  }

  async findContactByPhone(phoneNumber: string): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    for (const contact of this.contacts.values()) {
      if (contact.phone && contact.phone.replace(/\D/g, '') === cleanPhone) {
        console.log(`📞 Found existing contact: ${contact.id} for phone ${phoneNumber}`);
        return {
          success: true,
          data: contact,
        };
      }
    }
    
    console.log(`📞 No existing contact found for phone: ${phoneNumber}`);
    return {
      success: true,
    };
  }

  async createContact(contact: BuilderPrimeContact): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newContact: BuilderPrimeContact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    this.contacts.set(newContact.id!, newContact);
    
    console.log(`✅ Created new contact: ${newContact.id} for phone: ${contact.phone}`);
    console.log(`   Name: ${contact.first_name} ${contact.last_name}`);
    console.log(`   Tags: ${contact.tags?.join(', ') || 'none'}`);
    
    return {
      success: true,
      data: newContact,
    };
  }

  async updateContact(contactId: string, contact: Partial<BuilderPrimeContact>): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const existingContact = this.contacts.get(contactId);
    if (!existingContact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }
    
    const updatedContact = { ...existingContact, ...contact };
    this.contacts.set(contactId, updatedContact);
    
    console.log(`🔄 Updated contact: ${contactId}`);
    
    return {
      success: true,
      data: updatedContact,
    };
  }

  async createClientActivity(activity: BuilderPrimeClientActivity): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeClientActivity }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newActivity: BuilderPrimeClientActivity = {
      ...activity,
    };
    
    this.clientActivities.push(newActivity);
    
    console.log(`📞 Created client activity for opportunity: ${activity.opportunityId}`);
    console.log(`   Type: ${activity.activityType}`);
    console.log(`   Call Outcome: ${activity.callOutcome || 'N/A'}`);
    console.log(`   Date: ${new Date(activity.activityDateTime).toISOString()}`);
    console.log(`   Description: ${activity.description?.substring(0, 100)}${activity.description && activity.description.length > 100 ? '...' : ''}`);
    
    return {
      success: true,
      data: newActivity,
    };
  }

  async createCallLog(callLog: BuilderPrimeCallLog): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeCallLog }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newCallLog: BuilderPrimeCallLog = {
      ...callLog,
    };
    
    this.callLogs.push(newCallLog);
    
    console.log(`📞 Created call log for contact: ${callLog.contact_id}`);
    console.log(`   Phone: ${callLog.phone_number}`);
    console.log(`   Direction: ${callLog.call_direction}`);
    console.log(`   Duration: ${callLog.call_duration}s`);
    console.log(`   Status: ${callLog.call_status}`);
    console.log(`   Tags: ${callLog.tags?.join(', ') || 'none'}`);
    
    return {
      success: true,
      data: newCallLog,
    };
  }

  async getContact(contactId: string): Promise<BuilderPrimeApiResponse & { data?: BuilderPrimeContact }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const contact = this.contacts.get(contactId);
    if (!contact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }
    
    return {
      success: true,
      data: contact,
    };
  }

  // Helper methods for testing
  getContacts(): BuilderPrimeContact[] {
    return Array.from(this.contacts.values());
  }

  getCallLogs(): BuilderPrimeCallLog[] {
    return [...this.callLogs];
  }

  clearData(): void {
    this.contacts.clear();
    this.callLogs = [];
    this.clientActivities = [];
    console.log('🧹 Cleared all mock data');
  }

  getStats(): { contacts: number; callLogs: number; clientActivities: number } {
    return {
      contacts: this.contacts.size,
      callLogs: this.callLogs.length,
      clientActivities: this.clientActivities.length,
    };
  }
}
