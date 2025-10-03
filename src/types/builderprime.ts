export interface BuilderPrimeContact {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  opportunityId?: number; // Required for BuilderPrime API
}

export interface BuilderPrimeClientActivity {
  opportunityId: number;
  activityDateTime: number; // Milliseconds since epoch
  activityType: 'CALL' | 'EMAIL' | 'SMS' | 'NOTE';
  callOutcome?: 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'LEFT_LIVE_MESSAGE' | 'LEFT_VOICEMAIL' | 'CONNECTED';
  description?: string;
  secretKey: string;
}

export interface BuilderPrimeCallLog {
  contact_id?: string | undefined;
  phone_number: string;
  call_direction: 'inbound' | 'outbound';
  call_date: string;
  call_duration: number;
  call_status: string;
  recording_url?: string | undefined;
  notes?: string | undefined;
  tags?: string[] | undefined;
  custom_fields?: Record<string, any> | undefined;
}

export interface BuilderPrimeApiResponse {
  success: boolean;
  data?: any | undefined;
  error?: string | undefined;
  message?: string | undefined;
}
